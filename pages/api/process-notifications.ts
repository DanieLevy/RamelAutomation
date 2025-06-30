import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { generateAppointmentNotificationEmail } from '@/lib/emailTemplates';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { emailService } from '@/lib/emailService';

// ============================================================================
// EMAIL NOTIFICATION PROCESSOR
// Purpose: Handle heavy email processing triggered by frontend
// Benefit: Keeps auto-check function under 8 seconds, emails processed separately
// ============================================================================

const supabase = supabaseAdmin;

// Israel timezone utilities
const ISRAEL_TIMEZONE = 'Asia/Jerusalem';

const formatDateIsrael = (date: Date) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const getCurrentDateIsrael = () => {
  return new Date(new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()) + 'T00:00:00');
};

const getDayNameHebrew = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date);
};

const generateBookingUrl = (dateStr: string) => {
  const baseUrl = 'https://mytor.co.il/home.php';
  const params = new URLSearchParams({
    i: 'cmFtZWwzMw==',  // ramel33 encoded
    s: 'MjY1',         // 265
    mm: 'y',
    lang: 'he',
    datef: dateStr,
    signup: 'הצג'      // Hebrew for "Show"
  });
  
  return `${baseUrl}?${params.toString()}`;
};

// Create reusable email transporter with connection pooling
// DEPRECATED: Now using emailService with retry logic
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    pool: true,
    maxConnections: 10,
    maxMessages: 100,
    rateDelta: 1000,  // 1 second
    rateLimit: 5      // max 5 emails per second
  });
};

interface AppointmentResult {
  date: string;
  available: boolean;
  times: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📧 EMAIL PROCESSOR: Starting notification processing');
    const processingStart = Date.now();

    // Get appointments data from request or fetch from cache
    let appointments: AppointmentResult[] = [];
    const isTestMode = req.body?.testMode === true; // Test mode bypasses rate limiting
    
    if (req.body && req.body.appointments) {
      appointments = req.body.appointments;
      console.log(`📧 Using provided appointments: ${appointments.length}`);
    } else {
      // Fallback: fetch from cache
      const { data: cacheData } = await supabaseAdmin
        .from('cache')
        .select('value')
        .eq('key', 'auto-check-minimal')
        .single();
      
      if (cacheData?.value?.preview) {
        appointments = cacheData.value.preview;
        console.log(`📧 Using cached appointments: ${appointments.length}`);
      }
    }

    if (appointments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No appointments to process',
        emailsSent: 0
      });
    }

    // Fetch active notifications that need processing (excluding soft-deleted)
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'active')
      .is('deleted_at', null); // Exclude soft-deleted records

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`);
    }

    if (!notifications || notifications.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active subscriptions found',
        emailsSent: 0
      });
    }

    console.log(`📧 Processing ${notifications.length} active subscriptions`);

    // Initialize counters
    let emailsQueued = 0;
    let emailsSkipped = 0;

    // Process notifications in optimized batches
    const BATCH_SIZE = 3; // Smaller batches for better reliability
    
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);

      for (const notification of batch) {
        try {
          // Find matching appointments for this notification
          let matchingResults: AppointmentResult[] = [];

          if (notification.criteria_type === 'single' && notification.criteria?.date) {
            // Single date matching
            matchingResults = appointments.filter(apt => 
              apt.date === notification.criteria.date && apt.available === true
            );
          } else if (notification.criteria_type === 'range' && notification.criteria?.start && notification.criteria?.end) {
            // Range matching - collect ALL available appointments in range
            matchingResults = appointments.filter(apt => 
              apt.available === true && 
              apt.date >= notification.criteria.start && 
              apt.date <= notification.criteria.end
            );
          }

          if (matchingResults.length === 0) {
            console.log(`📧 No matching appointments for ${notification.email}`);
            continue;
          }

          // Check if should batch notifications
          const shouldBatch = notification.batch_notifications !== false;
          const batchInterval = (notification.batch_interval_hours || 4) * 60 * 60 * 1000; // Convert to milliseconds
          
          // Check if urgent mode applies (same-day appointments)
          const todayStr = formatDateIsrael(getCurrentDateIsrael());
          const hasUrgentAppointments = notification.enable_urgent_mode && 
            matchingResults.some(apt => apt.date === todayStr);

          // Calculate if it's appropriate time to send based on user preferences
          const now = new Date();
          const userTimezone = notification.timezone || 'Asia/Jerusalem';
          const preferredTime = notification.preferred_send_time || '09:00';
          const quietStart = notification.quiet_hours_start || '22:00';
          const quietEnd = notification.quiet_hours_end || '07:00';
          
          // Check if we're in quiet hours
          const currentHour = parseInt(new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            hour: '2-digit',
            hour12: false
          }).format(now));
          
          const quietStartHour = parseInt(quietStart.split(':')[0]);
          const quietEndHour = parseInt(quietEnd.split(':')[0]);
          
          const inQuietHours = (quietStartHour > quietEndHour) 
            ? (currentHour >= quietStartHour || currentHour < quietEndHour)
            : (currentHour >= quietStartHour && currentHour < quietEndHour);

          // Check if it's weekend and user doesn't want weekend notifications
          const dayOfWeek = new Date().getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          if (!notification.send_on_weekends && isWeekend && !hasUrgentAppointments) {
            console.log(`📧 Skipping ${notification.email} - weekend notifications disabled`);
            continue;
          }

          // If urgent appointments exist, send immediately regardless of batching/quiet hours
          if (hasUrgentAppointments) {
            console.log(`🚨 Urgent same-day appointments for ${notification.email} - sending immediately`);
          } else if (shouldBatch && !isTestMode) {
            // Check if we should batch this notification
            const lastBatchSent = notification.last_batch_sent_at ? new Date(notification.last_batch_sent_at) : null;
            
            if (lastBatchSent && (now.getTime() - lastBatchSent.getTime() < batchInterval)) {
              // Add to batch queue instead of sending immediately
              console.log(`📦 Adding to batch queue for ${notification.email} (next batch in ${Math.round((batchInterval - (now.getTime() - lastBatchSent.getTime())) / 60000)} minutes)`);
              
              await supabase
                .from('notification_batch_queue')
                .upsert({
                  notification_id: notification.id,
                  appointment_data: matchingResults,
                  is_urgent: false,
                  scheduled_send_time: new Date(lastBatchSent.getTime() + batchInterval).toISOString(),
                  status: 'pending'
                }, {
                  ignoreDuplicates: false
                });
              
              continue;
            }
            
            // Get all pending batched appointments
            const { data: batchedAppointments } = await supabase
              .from('notification_batch_queue')
              .select('appointment_data')
              .eq('notification_id', notification.id)
              .eq('status', 'pending');

            if (batchedAppointments && batchedAppointments.length > 0) {
              // Combine with current results
              batchedAppointments.forEach(batch => {
                if (batch.appointment_data) {
                  matchingResults = [...matchingResults, ...batch.appointment_data];
                }
              });
              
              // Mark batched items as processed
              await supabase
                .from('notification_batch_queue')
                .update({ status: 'processing', processed_at: new Date().toISOString() })
                .eq('notification_id', notification.id)
                .eq('status', 'pending');
            }
            
            // Update last batch sent time
            await supabase
              .from('notifications')
              .update({ last_batch_sent_at: new Date().toISOString() })
              .eq('id', notification.id);
          }

          // Skip if in quiet hours (unless urgent)
          if (inQuietHours && !hasUrgentAppointments && !isTestMode) {
            console.log(`🌙 In quiet hours for ${notification.email} - scheduling for ${quietEnd}`);
            
            // Calculate next send time after quiet hours
            const nextSendTime = new Date();
            nextSendTime.setHours(parseInt(quietEnd.split(':')[0]), parseInt(quietEnd.split(':')[1]), 0, 0);
            if (nextSendTime <= now) {
              nextSendTime.setDate(nextSendTime.getDate() + 1);
            }
            
            await supabase
              .from('notification_batch_queue')
              .upsert({
                notification_id: notification.id,
                appointment_data: matchingResults,
                is_urgent: false,
                scheduled_send_time: nextSendTime.toISOString(),
                status: 'pending'
              }, {
                ignoreDuplicates: false
              });
            
            continue;
          }

          // Remove duplicates from batched results
          const uniqueResults = Array.from(
            new Map(matchingResults.map(item => [`${item.date}-${item.times.join(',')}`, item])).values()
          );

          // Use unique results for processing
          matchingResults = uniqueResults;

          // Fetch fresh notification data to avoid stale counts in test mode
          let currentNotification = notification;
          if (isTestMode) {
            const { data: freshNotification } = await supabase
              .from('notifications')
              .select('*')
              .eq('id', notification.id)
              .single();
            currentNotification = freshNotification || notification;
          }
          
          // Custom notification timing and constraints
          const currentNotifCount = currentNotification.notification_count || 0;
          const maxNotifications = currentNotification.max_notifications || 3; // Default to 3 if not set
          const intervalMinutes = currentNotification.interval_minutes || 30; // Default to 30 minutes if not set
          const notifyOnEveryNew = currentNotification.notify_on_every_new !== false; // Default to true
          const lastNotified = currentNotification.last_notified ? new Date(currentNotification.last_notified) : null;
          const timeSinceLastNotification = lastNotified ? now.getTime() - lastNotified.getTime() : Infinity;

          // Skip if max emails reached (based on user settings)
          if (currentNotifCount >= maxNotifications) {
            await supabase
              .from('notifications')
              .update({ 
                status: 'max_reached', 
                notification_phase: 'completed',
                updated_at: new Date().toISOString() 
              })
              .eq('id', notification.id);
            console.log(`📧 Max emails reached for ${notification.email} (${maxNotifications} emails) - marking as max_reached`);
            emailsSkipped++;
            continue;
          }

          // Use custom interval timing
          const requiredInterval = intervalMinutes * 60 * 1000; // Convert minutes to milliseconds
          
          if (isTestMode) {
            console.log(`📧 🧪 TEST: Processing email for ${currentNotification.email}, count: ${currentNotifCount}/${maxNotifications}, interval: ${intervalMinutes}min`);
          }

          // Skip if too soon since last notification - unless in test mode or interval is 0 (immediate)
          if (!isTestMode && intervalMinutes > 0 && timeSinceLastNotification < requiredInterval) {
            const minutesRemaining = Math.ceil((requiredInterval - timeSinceLastNotification) / 60000);
            console.log(`📧 Too soon for ${notification.email} (${minutesRemaining}m remaining, interval: ${intervalMinutes}m)`);
            emailsSkipped++;
            continue;
          }
          
          if (isTestMode && timeSinceLastNotification < requiredInterval) {
            console.log(`📧 🧪 TEST MODE: Bypassing rate limit for ${notification.email}`);
          }
          
          if (intervalMinutes === 0) {
            console.log(`📧 ⚡ Immediate notification enabled for ${notification.email} (no interval delay)`);
          }

          // Filter out appointments based on ignored appointments table
          console.log(`📧 Filtering appointments for ${notification.email} - checking ignored list...`);
          
          // Get ignored appointments for this notification
          const { data: ignoredAppointments, error: ignoredError } = await supabase
            .from('ignored_appointments')
            .select('appointment_date, appointment_time')
            .eq('notification_id', notification.id);

          if (ignoredError) {
            console.error(`Failed to fetch ignored appointments for ${notification.email}:`, ignoredError);
          }

          // Create a set of ignored combinations for fast lookup
          const ignoredSet = new Set();
          if (ignoredAppointments) {
            ignoredAppointments.forEach(ignored => {
              ignoredSet.add(`${ignored.appointment_date}:${ignored.appointment_time}`);
            });
          }

          // Filter matching results to exclude ignored appointments
          const filteredResults = matchingResults.map(appointment => {
            // Filter out times that are specifically ignored
            const availableTimes = appointment.times.filter(time => {
              const key = `${appointment.date}:${time}`;
              return !ignoredSet.has(key);
            });
            
            return {
              ...appointment,
              times: availableTimes
            };
          }).filter(appointment => appointment.times.length > 0); // Keep only appointments with available times

          // Check if any appointments remain after filtering
          if (filteredResults.length === 0) {
            console.log(`📧 All appointments ignored by user for ${notification.email}`);
            emailsSkipped++;
            continue;
          }

          console.log(`📧 Found ${filteredResults.length} appointments after filtering ignored times for ${notification.email}`);
          console.log(`📧 Ignored ${ignoredSet.size} specific appointment times`);

          // Use filtered results for email content
          matchingResults = filteredResults;

          // Create or update user appointment responses with tokens
          const responseTokens: { [key: string]: string } = {};
          
          for (const appointment of matchingResults) {
            try {
              // Optimistically attempt to insert the record.
              // If it fails with a unique constraint violation (code 23505), it's a race condition.
              // In that case, we can safely fetch the existing record.
              const { data: response, error: responseError } = await supabase
                .from('user_appointment_responses')
                .insert({
                  notification_id: currentNotification.id,
                  appointment_date: appointment.date,
                  appointment_times: appointment.times,
                  response_status: 'pending'
                })
                .select('response_token')
                .single();

              if (responseError) {
                if (responseError.code === '23505') { // Unique constraint violation
                  console.log(`📧 Race condition detected for ${appointment.date}. Fetching existing token.`);
                  const { data: existingResponse, error: selectError } = await supabase
                    .from('user_appointment_responses')
                    .select('response_token')
                    .eq('notification_id', currentNotification.id)
                    .eq('appointment_date', appointment.date)
                    .single();

                  if (selectError) {
                    console.error(`🚨 Failed to fetch token after race condition for ${appointment.date}:`, selectError);
                  } else if (existingResponse) {
                    responseTokens[appointment.date] = existingResponse.response_token;
                  }
                } else {
                  // A different, unexpected error occurred
                  console.error(`🚨 Failed to create response record for ${appointment.date}:`, responseError);
                }
              } else if (response) {
                responseTokens[appointment.date] = response.response_token;
              }
            } catch (error) {
              console.error(`🚨 Unhandled error managing response record for ${appointment.date}:`, error);
            }
          }

          // Generate modern email content using the enhanced template system
          const emailContent = generateAppointmentNotificationEmail(
            matchingResults,
            responseTokens,
            currentNotifCount + 1, // Current notification number
            maxNotifications, // Max notifications based on user settings
            currentNotification.email,
            currentNotification.unsubscribe_token
          );

          // Queue email instead of sending directly
          const queueResult = await emailService.queueEmail({
            to: currentNotification.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            notificationId: currentNotification.id,
            appointmentData: matchingResults,
            priority: isTestMode ? 10 : 0 // Higher priority for test mode
          });

          if (queueResult.success) {
            console.log(`📧 Email queued #${currentNotifCount + 1}/${maxNotifications} for ${currentNotification.email}`);
                
            // Calculate new values based on user settings
            const newNotificationCount = currentNotifCount + 1;
            let newStatus = 'active';

            // Determine status based on user's max notifications setting
            if (newNotificationCount >= maxNotifications) {
              newStatus = 'max_reached';
            }
            
            // Track email history (queued status)
            try {
              await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  notification_id: currentNotification.id,
                  email_count: newNotificationCount,
                  appointment_data: matchingResults,
                  email_subject: emailContent.subject,
                  email_status: 'queued',
                  queue_id: queueResult.queueId
                })
              });
            } catch (historyError) {
              console.log('📧 ⚠️ Email history tracking failed (non-critical):', historyError instanceof Error ? historyError.message : 'Unknown error');
            }
            
            // Update notification record
            const { error: updateError } = await supabase
              .from('notifications')
              .update({
                last_notified: new Date().toISOString(),
                notification_count: newNotificationCount,
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', currentNotification.id);
            
            if (updateError) {
              console.error(`📧 ❌ Failed to update notification record for ${currentNotification.email}:`, updateError);
            } else {
              console.log(`📧 ✅ Queued email #${newNotificationCount}/${maxNotifications} for ${currentNotification.email} (status: ${newStatus})`);
              
              if (newStatus === 'max_reached') {
                console.log(`🏁 Notification completed for ${currentNotification.email} - ${maxNotifications} emails queued (user limit reached)`);
              } else {
                console.log(`📧 ⏰ Next notification for ${currentNotification.email} in ${intervalMinutes} minutes (if opportunities found)`);
              }
              
              emailsQueued++;
            }
          } else {
            console.error(`📧 ❌ Failed to queue email for ${currentNotification.email}:`, queueResult.error);
            emailsSkipped++;
            
            // Update error count
            try {
              await supabase
                .from('notifications')
                .update({
                  error_count: (currentNotification.error_count || 0) + 1,
                  last_error: queueResult.error || 'Failed to queue email',
                  updated_at: new Date().toISOString()
                })
                .eq('id', currentNotification.id);
            } catch (dbError) {
              console.error(`📧 ❌ Failed to update error count for ${currentNotification.id}:`, dbError);
            }
          }

        } catch (error) {
          console.error(`📧 Error processing notification for ${notification.email}:`, error);
          emailsSkipped++;
        }
      }

      // Small delay between batches to prevent overwhelming the system
      if (i + BATCH_SIZE < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process any immediate emails from the queue
    const { processed, errors } = await emailService.processEmailQueue(emailsQueued);

    const processingTime = Math.round((Date.now() - processingStart) / 1000);
    console.log(`📧 ✅ EMAIL PROCESSING COMPLETED in ${processingTime}s`);
    console.log(`📧 📊 Stats: ${emailsQueued} queued, ${processed} sent immediately, ${emailsSkipped} skipped`);

    return res.status(200).json({
      success: true,
      emailsQueued,
      emailsSent: processed,
      emailsSkipped,
      totalProcessed: notifications.length,
      processingTime,
      message: `Successfully processed ${notifications.length} subscriptions, queued ${emailsQueued} emails (${processed} sent immediately)`
    });

  } catch (error) {
    console.error('📧 ❌ EMAIL PROCESSING FAILED:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      emailsSent: 0
    });
  }
} 
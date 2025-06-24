import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { generateModernEmailTemplate } from '@/lib/emailTemplates';

// ============================================================================
// EMAIL NOTIFICATION PROCESSOR
// Purpose: Handle heavy email processing triggered by frontend
// Benefit: Keeps auto-check function under 8 seconds, emails processed separately
// ============================================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

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
      const { data: cacheData } = await supabase
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

    // Fetch active notifications that need processing
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'active');

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

    // Create email transporter
    const transporter = createEmailTransporter();
    let emailsSent = 0;
    let emailsSkipped = 0;

    // Process notifications in optimized batches
    const BATCH_SIZE = 3; // Smaller batches for better reliability
    
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      const emailPromises: Promise<any>[] = [];

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
          
          // Check notification constraints
          const currentNotifCount = currentNotification.notification_count || 0;
          const now = new Date();
          const lastNotified = currentNotification.last_notified ? new Date(currentNotification.last_notified) : null;
          const timeSinceLastNotification = lastNotified ? now.getTime() - lastNotified.getTime() : Infinity;

          // Skip if max emails reached
          if (currentNotifCount >= 6) {
            await supabase
              .from('notifications')
              .update({ status: 'max_reached', updated_at: new Date().toISOString() })
              .eq('id', notification.id);
            console.log(`📧 Max emails reached for ${notification.email} - marking as max_reached`);
            emailsSkipped++;
            continue;
          }
          
          if (isTestMode) {
            console.log(`📧 🧪 TEST: Processing email for ${currentNotification.email}, current count: ${currentNotifCount}, will be: ${currentNotifCount + 1}`);
          }

          // Skip if too soon since last notification (10 minutes minimum) - unless in test mode
          if (!isTestMode && timeSinceLastNotification < 10 * 60 * 1000) {
            console.log(`📧 Too soon for ${notification.email} (${Math.round(timeSinceLastNotification / 60000)}m ago)`);
            emailsSkipped++;
            continue;
          }
          
          if (isTestMode && timeSinceLastNotification < 10 * 60 * 1000) {
            console.log(`📧 🧪 TEST MODE: Bypassing rate limit for ${notification.email}`);
          }

          // Generate modern email content using the new template system
          const emailContent = generateModernEmailTemplate({
            matchingResults,
            notificationCount: currentNotifCount,
            unsubscribeUrl: `https://tor-ramel.netlify.app/unsubscribe?token=${currentNotification.unsubscribe_token}`,
            userEmail: currentNotification.email,
            criteriaType: currentNotification.criteria_type as 'single' | 'range'
          });

          const mailOptions = {
            from: `"תורים לרם-אל" <${process.env.EMAIL_SENDER}>`,
            to: currentNotification.email,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html
          };

          // Add to batch promises with robust error handling
          emailPromises.push(
            (async () => {
              try {
                console.log(`📧 Sending email #${currentNotifCount + 1}/6 to ${currentNotification.email}`);
                
                // Send email
                const emailResult = await transporter.sendMail(mailOptions);
                console.log(`📧 ✅ Email sent successfully: ${emailResult.messageId}`);
                
                // Calculate new values
                const newNotificationCount = currentNotifCount + 1;
                const newStatus = newNotificationCount >= 6 ? 'max_reached' : 'active';
                
                // Track email history (non-blocking)
                try {
                  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email-history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      notification_id: currentNotification.id,
                      email_count: newNotificationCount,
                      appointment_data: matchingResults,
                      email_subject: emailContent.subject,
                      email_status: 'sent'
                    })
                  });
                } catch (historyError) {
                  console.log('📧 ⚠️ Email history tracking failed (non-critical):', historyError instanceof Error ? historyError.message : 'Unknown error');
                }
                
                // Update notification record with proper transaction handling
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
                  throw new Error(`Database update failed: ${updateError.message}`);
                }
                
                console.log(`📧 ✅ Sent email #${newNotificationCount} to ${currentNotification.email} (status: ${newStatus})`);
                
                if (newStatus === 'max_reached') {
                  console.log(`🏁 Notification completed for ${currentNotification.email} - 6 emails sent`);
                }
                
                return { success: true, email: currentNotification.email, count: newNotificationCount, status: newStatus };
                
                              } catch (error: any) {
                console.error(`📧 ❌ Failed to send/update email for ${currentNotification.email}:`, error.message);
                
                // Update error count
                try {
                  await supabase
                    .from('notifications')
                    .update({
                      error_count: (currentNotification.error_count || 0) + 1,
                      last_error: error.message,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', currentNotification.id);
                } catch (dbError) {
                  console.error(`📧 ❌ Failed to update error count for ${currentNotification.id}:`, dbError);
                }
                
                return { success: false, email: currentNotification.email, error: error.message };
              }
            })()
          );

        } catch (error) {
          console.error(`📧 Error processing notification for ${notification.email}:`, error);
          emailsSkipped++;
        }
      }

      // Execute batch of emails with proper result handling
      if (emailPromises.length > 0) {
        const results = await Promise.allSettled(emailPromises);
        
        // Process results to update counters
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const emailResult = result.value;
            if (emailResult.success) {
              emailsSent++;
              console.log(`📧 ✅ Batch result: ${emailResult.email} - email #${emailResult.count} (${emailResult.status})`);
            } else {
              emailsSkipped++;
              console.log(`📧 ❌ Batch result: ${emailResult.email} - failed: ${emailResult.error}`);
            }
          } else {
            emailsSkipped++;
            console.log(`📧 ❌ Batch promise rejected:`, result.reason);
          }
        });
        
        // Rate limiting: small delay between batches
        if (i + BATCH_SIZE < notifications.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    // Close email transporter
    transporter.close();

    const processingTime = Math.round((Date.now() - processingStart) / 1000);
    console.log(`📧 ✅ EMAIL PROCESSING COMPLETED in ${processingTime}s`);
    console.log(`📧 📊 Stats: ${emailsSent} sent, ${emailsSkipped} skipped`);

    return res.status(200).json({
      success: true,
      emailsSent,
      emailsSkipped,
      totalProcessed: notifications.length,
      processingTime,
      message: `Successfully processed ${notifications.length} subscriptions, sent ${emailsSent} emails`
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
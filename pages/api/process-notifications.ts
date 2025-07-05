import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { emailService } from '@/lib/emailService';
import { generateAppointmentNotificationEmail } from '@/lib/emailTemplates';

const supabase = supabaseAdmin;

// Israel timezone utilities
const ISRAEL_TIMEZONE = 'Asia/Jerusalem';

const getCurrentDateIsrael = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

interface Appointment {
  date: string;
  available: boolean;
  times: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { appointments } = req.body;
    
    if (!appointments || !Array.isArray(appointments)) {
      return res.status(400).json({ error: 'Appointments array is required' });
    }

    // Filter only available appointments
    const availableAppointments = appointments.filter((apt: Appointment) => 
      apt.available && apt.times && apt.times.length > 0
    );

    if (availableAppointments.length === 0) {
      console.log('📧 No available appointments to process');
      return res.status(200).json({
        success: true,
        message: 'No available appointments to process',
        emailsSent: 0,
        emailsSkipped: 0
      });
    }

    console.log(`📧 Processing ${availableAppointments.length} available appointments`);

    // Get current date for comparison
    const currentDateStr = getCurrentDateIsrael();

    // Fetch all active subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('notifications_simple')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📧 No active subscriptions found');
      return res.status(200).json({
        success: true,
        message: 'No active subscriptions',
        emailsSent: 0,
        emailsSkipped: 0
      });
    }

    console.log(`📧 Found ${subscriptions.length} active subscriptions`);

    let emailsSent = 0;
    let emailsSkipped = 0;

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        // Check if subscription is expired
        let isExpired = false;
        if (subscription.subscription_type === 'single') {
          isExpired = subscription.target_date < currentDateStr;
        } else if (subscription.subscription_type === 'range') {
          isExpired = subscription.date_end < currentDateStr;
        }

        if (isExpired) {
          // Mark subscription as expired
          await supabase
            .from('notifications_simple')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', subscription.id);
          
          console.log(`📧 Subscription ${subscription.id} expired`);
          emailsSkipped++;
          continue;
        }

        // Find matching appointments for this subscription
        const matchingAppointments = availableAppointments.filter((apt: Appointment) => {
          if (subscription.subscription_type === 'single') {
            return apt.date === subscription.target_date;
          } else {
            return apt.date >= subscription.date_start && apt.date <= subscription.date_end;
          }
        });

        if (matchingAppointments.length === 0) {
          console.log(`📧 No matching appointments for subscription ${subscription.id}`);
          emailsSkipped++;
          continue;
        }

        // Get previously sent appointments for this subscription
        const { data: sentAppointments, error: sentError } = await supabase
          .from('sent_appointments')
          .select('appointment_date, appointment_times')
          .eq('notification_id', subscription.id);

        if (sentError) {
          console.error('Error fetching sent appointments:', sentError);
          emailsSkipped++;
          continue;
        }

        // Find NEW appointments (not previously sent)
        const newAppointments: Appointment[] = [];
        
        for (const apt of matchingAppointments) {
          // Check if this exact appointment (date + times) was already sent
          const wasSent = sentAppointments?.some(sent => 
            sent.appointment_date === apt.date &&
            JSON.stringify(sent.appointment_times.sort()) === JSON.stringify(apt.times.sort())
          );

          if (!wasSent) {
            newAppointments.push(apt);
          }
        }

        if (newAppointments.length === 0) {
          console.log(`📧 No new appointments for subscription ${subscription.id}`);
          emailsSkipped++;
          continue;
        }

        console.log(`📧 Found ${newAppointments.length} NEW appointments for ${subscription.email}`);

        // Generate action token for this notification
        const actionToken = crypto.randomUUID();

        // Store the action token
        await supabase
          .from('user_notification_actions')
          .insert({
            notification_id: subscription.id,
            action: 'pending',
            action_token: actionToken
          });

        // Generate email content
        const emailContent = generateAppointmentNotificationEmail({
          appointments: newAppointments,
          notificationId: subscription.id,
          actionToken,
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://tor-ramel.netlify.app'
        });

        // Queue the email
        const queueResult = await emailService.queueEmail({
          to: subscription.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          notificationId: subscription.id,
          appointmentData: newAppointments,
          priority: 1
        });

        if (queueResult.success) {
          console.log(`📧 Email queued for ${subscription.email}`);
          
          // Record sent appointments to avoid duplicates
          const sentRecords = newAppointments.map(apt => ({
            notification_id: subscription.id,
            appointment_date: apt.date,
            appointment_times: apt.times
          }));

          await supabase
            .from('sent_appointments')
            .insert(sentRecords);

          emailsSent++;
        } else {
          console.error(`📧 Failed to queue email for ${subscription.email}:`, queueResult.error);
          emailsSkipped++;
        }

      } catch (error) {
        console.error(`📧 Error processing subscription ${subscription.id}:`, error);
        emailsSkipped++;
      }
    }

    // Process queued emails
    const { processed, errors } = await emailService.processEmailQueue(emailsSent);

    console.log(`📧 ✅ Notification processing completed: ${emailsSent} sent, ${emailsSkipped} skipped`);

    return res.status(200).json({
      success: true,
      emailsSent: processed,
      emailsQueued: emailsSent,
      emailsSkipped,
      totalProcessed: subscriptions.length,
      message: `Successfully processed ${subscriptions.length} subscriptions`
    });

  } catch (error) {
    console.error('Process notifications error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
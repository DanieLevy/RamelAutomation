import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { emailService } from '@/lib/emailService';
import { generateAppointmentNotificationEmail } from '@/lib/emailTemplates';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate request
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('📦 Processing batched notifications...');
    const now = new Date();

    // Get all pending batched notifications that are ready to send
    const { data: pendingBatches, error: fetchError } = await supabase
      .from('notification_batch_queue')
      .select(`
        *,
        notifications (
          id,
          email,
          unsubscribe_token,
          notification_count,
          max_notifications
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_send_time', now.toISOString())
      .order('is_urgent', { ascending: false })
      .order('scheduled_send_time', { ascending: true });

    if (fetchError || !pendingBatches) {
      console.error('Failed to fetch pending batches:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch pending batches' });
    }

    if (pendingBatches.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending batches to process',
        processed: 0
      });
    }

    console.log(`📦 Found ${pendingBatches.length} batches to process`);

    // Group by notification ID
    const batchesByNotification = new Map<string, any[]>();
    
    pendingBatches.forEach(batch => {
      const notificationId = batch.notification_id;
      if (!batchesByNotification.has(notificationId)) {
        batchesByNotification.set(notificationId, []);
      }
      batchesByNotification.get(notificationId)!.push(batch);
    });

    let emailsQueued = 0;
    let batchesProcessed = 0;

    // Process each notification's batches
    for (const [notificationId, batches] of batchesByNotification) {
      try {
        const notification = batches[0].notifications;
        if (!notification) continue;

        // Combine all appointment data
        let allAppointments: any[] = [];
        batches.forEach(batch => {
          if (batch.appointment_data) {
            allAppointments = [...allAppointments, ...batch.appointment_data];
          }
        });

        // Remove duplicates
        const uniqueAppointments = Array.from(
          new Map(allAppointments.map(item => [`${item.date}-${item.times.join(',')}`, item])).values()
        );

        if (uniqueAppointments.length === 0) continue;

        // Generate email with combined results
        const emailContent = generateAppointmentNotificationEmail(
          uniqueAppointments,
          {}, // Response tokens can be generated separately if needed
          notification.notification_count + 1,
          notification.max_notifications,
          notification.email,
          notification.unsubscribe_token
        );

        // Add batch indicator to subject
        const batchSubject = `${emailContent.subject} (${uniqueAppointments.length} תורים מצטברים)`;

        // Queue the email
        const queueResult = await emailService.queueEmail({
          to: notification.email,
          subject: batchSubject,
          html: emailContent.html,
          text: emailContent.text,
          notificationId: notification.id,
          appointmentData: uniqueAppointments,
          priority: batches.some(b => b.is_urgent) ? 10 : 0
        });

        if (queueResult.success) {
          emailsQueued++;

          // Update notification count
          await supabase
            .from('notifications')
            .update({
              notification_count: notification.notification_count + 1,
              last_notified: now.toISOString(),
              last_batch_sent_at: now.toISOString(),
              status: notification.notification_count + 1 >= notification.max_notifications ? 'max_reached' : 'active'
            })
            .eq('id', notification.id);

          // Mark batches as sent
          const batchIds = batches.map(b => b.id);
          await supabase
            .from('notification_batch_queue')
            .update({
              status: 'sent',
              processed_at: now.toISOString()
            })
            .in('id', batchIds);

          batchesProcessed += batches.length;

          console.log(`📦 ✅ Batched email queued for ${notification.email} with ${uniqueAppointments.length} appointments`);
        }

      } catch (error) {
        console.error(`Failed to process batch for notification ${notificationId}:`, error);
      }
    }

    // Process the email queue
    const { processed, errors } = await emailService.processEmailQueue(emailsQueued);

    return res.status(200).json({
      success: true,
      message: `Processed ${batchesProcessed} batches`,
      emailsQueued,
      emailsSent: processed,
      errors
    });

  } catch (error) {
    console.error('Batch processing failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
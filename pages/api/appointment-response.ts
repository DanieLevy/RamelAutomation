import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { response_token, action } = req.body;

    if (!response_token || !action) {
      return res.status(400).json({ 
        error: 'Missing required fields: response_token, action' 
      });
    }

    if (!['taken', 'not_wanted'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be "taken" or "not_wanted"' 
      });
    }

    // Find the appointment response record - check both pending and already responded
    // This allows handling multiple clicks on the same email
    const { data: appointmentResponse, error: findError } = await supabase
      .from('user_appointment_responses')
      .select(`
        *,
        notifications!inner(*)
      `)
      .eq('response_token', response_token)
      .single();

    if (findError || !appointmentResponse) {
      return res.status(404).json({ 
        error: 'Invalid or expired response token',
        details: 'הקישור לא תקין או שהוא כבר נעשה בו שימוש. אנא בדוק את המייל האחרון שקיבלת.'
      });
    }

    // Check if this token was already used for this action
    if (appointmentResponse.response_status === action) {
      // Return success for idempotent requests
      return res.status(200).json({
        success: true,
        action: action,
        message: action === 'taken' 
          ? 'התגובה כבר נרשמה - המינוי שלך מוכן!'
          : 'התגובה כבר נרשמה - נמשיך לחפש תורים אחרים עבורך.',
        alreadyProcessed: true
      });
    }

    // Check if subscription is still active
    const notification = appointmentResponse.notifications;
    if (!notification || ['completed', 'cancelled', 'max_reached'].includes(notification.status)) {
      return res.status(400).json({
        error: 'Subscription no longer active',
        details: 'המינוי כבר לא פעיל. ייתכן שכבר הגבת או שהמינוי הושלם.'
      });
    }

    const now = new Date().toISOString();

    // If user took the appointment, close the subscription
    if (action === 'taken') {
      // Update the specific appointment response
      const { error: updateError } = await supabase
        .from('user_appointment_responses')
        .update({
          response_status: action,
          responded_at: now,
          updated_at: now
        })
        .eq('response_token', response_token);

      if (updateError) {
        throw new Error(`Failed to update response: ${updateError.message}`);
      }

      // Close the subscription
      const { error: notificationError } = await supabase
        .from('notifications')
        .update({
          status: 'completed',
          updated_at: now
        })
        .eq('id', appointmentResponse.notification_id);

      if (notificationError) {
        console.error('Failed to close subscription:', notificationError);
      }

      return res.status(200).json({
        success: true,
        action: 'taken',
        message: 'מצוין! ההרשמה שלך סומנה כהושלמה. לא תקבל עוד התראות.',
        appointmentDate: appointmentResponse.appointment_date,
        appointmentTimes: appointmentResponse.appointment_times
      });
    }

    // If user marked as "not wanted", ignore ALL appointments from the same email
    if (action === 'not_wanted') {
      // Find ALL appointments for this notification that were sent in the same email batch
      // We identify the same email batch by finding all appointments with the same notification_id
      // that were created around the same time (within 5 minutes of each other)
      const { data: allEmailAppointments, error: fetchError } = await supabase
        .from('user_appointment_responses')
        .select('id, appointment_date, appointment_times, response_status, created_at')
        .eq('notification_id', appointmentResponse.notification_id)
        .gte('created_at', new Date(new Date(appointmentResponse.created_at).getTime() - 5 * 60 * 1000).toISOString())
        .lte('created_at', new Date(new Date(appointmentResponse.created_at).getTime() + 5 * 60 * 1000).toISOString());

      if (fetchError) {
        console.error('Failed to fetch email appointments:', fetchError);
        return res.status(500).json({ error: 'Failed to process response' });
      }

      // Create ignored entries for ALL appointments in the same email batch
      const ignoredEntries: Array<{
        notification_id: string;
        appointment_date: string;
        appointment_time: string;
        ignored_at: string;
      }> = [];

      if (allEmailAppointments) {
        allEmailAppointments.forEach((apt: any) => {
          const appointmentTimes = apt.appointment_times || [];
          appointmentTimes.forEach((time: string) => {
            ignoredEntries.push({
              notification_id: appointmentResponse.notification_id,
              appointment_date: apt.appointment_date,
              appointment_time: time,
              ignored_at: now
            });
          });
        });
      }

      // Insert ignored appointments (with conflict handling)
      if (ignoredEntries.length > 0) {
        const { error: ignoreError } = await supabase
          .from('ignored_appointments')
          .upsert(ignoredEntries, {
            onConflict: 'notification_id,appointment_date,appointment_time'
          });

        if (ignoreError) {
          console.error('Failed to add ignored appointments:', ignoreError);
          return res.status(500).json({ 
            error: 'Failed to save ignored appointments',
            details: 'שגיאה בשמירת התורים שלא רצית. אנא נסה שוב.'
          });
        } else {
          console.log(`📝 Added ${ignoredEntries.length} ignored appointments from email batch`);
        }
      }

      // Mark ALL appointments in the same email batch as not_wanted
      if (allEmailAppointments) {
        const appointmentIds = allEmailAppointments.map((apt: any) => apt.id);
        const { error: bulkUpdateError } = await supabase
          .from('user_appointment_responses')
          .update({
            response_status: 'not_wanted',
            responded_at: now,
            updated_at: now
          })
          .in('id', appointmentIds);

        if (bulkUpdateError) {
          console.error('Failed to update all email appointments:', bulkUpdateError);
        }
      }

      return res.status(200).json({
        success: true,
        action: 'not_wanted',
        message: 'הבנו! נמשיך לחפש תורים זמינים אחרים ולא נתריעה על התורים הספציפיים האלה שוב.',
        totalIgnored: ignoredEntries.length,
        emailAppointmentsProcessed: allEmailAppointments?.length || 0
      });
    }

  } catch (error) {
    console.error('Appointment response error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'שגיאת מערכת. אנא נסה שוב מאוחר יותר.'
    });
  }
} 
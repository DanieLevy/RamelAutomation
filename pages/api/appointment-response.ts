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

    // Find the appointment response record
    const { data: appointmentResponse, error: findError } = await supabase
      .from('user_appointment_responses')
      .select(`
        *,
        notifications!inner(*)
      `)
      .eq('response_token', response_token)
      .eq('response_status', 'pending')
      .single();

    if (findError || !appointmentResponse) {
      return res.status(404).json({ 
        error: 'Invalid or expired response token' 
      });
    }

    const now = new Date().toISOString();

    // Update the appointment response
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

    // If user took the appointment, close the subscription
    if (action === 'taken') {
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

    // If user marked as "not wanted", add each specific time to ignored list
    if (action === 'not_wanted') {
      // Find all pending appointments for this notification
      const { data: allPendingAppointments, error: fetchError } = await supabase
        .from('user_appointment_responses')
        .select('appointment_date, appointment_times')
        .eq('notification_id', appointmentResponse.notification_id)
        .eq('response_status', 'pending');

      if (fetchError) {
        console.error('Failed to fetch pending appointments:', fetchError);
        return res.status(500).json({ error: 'Failed to process response' });
      }

      // Create ignored entries for all appointments in the current email
      const ignoredEntries: Array<{
        notification_id: string;
        appointment_date: string;
        appointment_time: string;
        ignored_at: string;
      }> = [];
      if (allPendingAppointments) {
        allPendingAppointments.forEach((apt: any) => {
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
          // Don't fail the request, just log the error
        } else {
          console.log(`📝 Added ${ignoredEntries.length} ignored appointments for all pending appointments`);
        }
      }

      // Mark all pending appointments as not_wanted
      const { error: bulkUpdateError } = await supabase
        .from('user_appointment_responses')
        .update({
          response_status: 'not_wanted',
          responded_at: now,
          updated_at: now
        })
        .eq('notification_id', appointmentResponse.notification_id)
        .eq('response_status', 'pending');

      if (bulkUpdateError) {
        console.error('Failed to update all pending appointments:', bulkUpdateError);
      }

      return res.status(200).json({
        success: true,
        action: 'not_wanted',
        message: 'הבנו! נמשיך לחפש תורים זמינים אחרים ולא נתריעה על התורים הספציפיים האלה שוב.',
        totalIgnored: ignoredEntries.length
      });
    }

  } catch (error) {
    console.error('Appointment response error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
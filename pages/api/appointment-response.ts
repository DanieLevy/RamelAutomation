import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

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
        message: 'Great! Your subscription has been marked as completed. You will receive no more notifications.',
        appointmentDate: appointmentResponse.appointment_date,
        appointmentTimes: appointmentResponse.appointment_times
      });
    }

    // If user marked as "not wanted", continue with subscription
    return res.status(200).json({
      success: true,
      action: 'not_wanted',
      message: 'Got it! We\'ll continue searching for other available appointments and won\'t notify you about this specific date again.',
      appointmentDate: appointmentResponse.appointment_date
    });

  } catch (error) {
    console.error('Appointment response error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
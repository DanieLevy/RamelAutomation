import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscriptionId, status } = req.body;

  if (!subscriptionId || !status) {
    return res.status(400).json({ error: 'Subscription ID and status are required' });
  }

  // Validate status
  const validStatuses = ['active', 'stopped', 'expired'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be one of: active, stopped, expired' });
  }

  try {
    // Update the subscription status
    const { data, error } = await supabase
      .from('notifications_simple')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update subscription:', error);
      return res.status(500).json({ 
        error: 'Failed to update subscription',
        details: error.message 
      });
    }

    if (!data) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.status(200).json({ 
      success: true,
      message: `Subscription ${status === 'stopped' ? 'stopped' : 'updated'} successfully`,
      subscription: data
    });
  } catch (error) {
    console.error('Update subscription API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, updates } = req.body;

    if (!id || !updates) {
      return res.status(400).json({ error: 'ID and updates are required' });
    }

    // Update subscription
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating subscription:', error);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }

    return res.status(200).json({ 
      success: true,
      subscription: data?.[0] || null
    });

  } catch (error) {
    console.error('Error in update-subscription API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
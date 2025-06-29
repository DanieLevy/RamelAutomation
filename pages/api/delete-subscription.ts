import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Delete subscription
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subscription:', error);
      return res.status(500).json({ error: 'Failed to delete subscription' });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete-subscription API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
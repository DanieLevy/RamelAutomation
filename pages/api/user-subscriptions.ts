import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Fetch user subscriptions
    const { data: subscriptions, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    return res.status(200).json({ 
      subscriptions: subscriptions || []
    });

  } catch (error) {
    console.error('Error in user-subscriptions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
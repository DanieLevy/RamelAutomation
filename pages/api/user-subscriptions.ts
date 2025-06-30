import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const { data: subscriptions, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null) // Exclude soft-deleted records
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch user subscriptions:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch subscriptions',
        details: error.message 
      });
    }

    return res.status(200).json({ 
      success: true,
      subscriptions: subscriptions || [] 
    });
  } catch (error) {
    console.error('User subscriptions API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
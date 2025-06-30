import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    // Check if token exists and is valid
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('token', token);

    return res.status(200).json({
      valid: true,
      email: session.email,
      expiresAt: session.expires_at
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ error: 'Failed to verify token' });
  }
} 
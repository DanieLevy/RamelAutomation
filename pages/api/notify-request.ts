import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, date } = req.body;
  if (!email || !date) {
    return res.status(400).json({ error: 'Missing email or date' });
  }
  // Basic email validation
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const unsubscribe_token = uuidv4();
  const { error } = await supabase.from('notifications').insert([
    {
      email,
      criteria: { date },
      unsubscribe_token,
    },
  ]);
  if (error) {
    return res.status(500).json({ error: 'Failed to save notification request' });
  }
  return res.status(200).json({ success: true });
} 
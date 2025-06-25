import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { v4 as uuidv4 } from 'uuid';

const MAX_ATTEMPTS = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  // Find the OTP
  const now = new Date();
  const { data: otp, error } = await supabaseAdmin
    .from('management_otps')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !otp) {
    return res.status(400).json({ error: 'קוד שגוי או לא קיים' });
  }

  if (otp.used) {
    return res.status(400).json({ error: 'קוד זה כבר שומש' });
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return res.status(400).json({ error: 'חרגת ממספר הנסיונות המותרים' });
  }
  if (new Date(otp.expires_at) < now) {
    return res.status(400).json({ error: 'הקוד פג תוקף' });
  }

  // Mark as used and increment attempts
  await supabaseAdmin
    .from('management_otps')
    .update({ used: true, used_at: now.toISOString(), attempts: otp.attempts + 1 })
    .eq('id', otp.id);

  // Generate a session token (random UUID)
  const sessionToken = uuidv4();

  // Store session token in management_tokens for persistent auth
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await supabaseAdmin
    .from('management_tokens')
    .insert([
      {
        token: sessionToken,
        email,
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
        used: false
      }
    ]);

  return res.status(200).json({ success: true, token: sessionToken });
} 
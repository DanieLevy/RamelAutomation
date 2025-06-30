import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp } = req.body;

  // Validate inputs
  if (!email || !otp) {
    return res.status(400).json({ error: 'חסרים פרטים נדרשים' });
  }

  try {
    // Check if OTP exists and is valid
    const { data: otpRecord, error: fetchError } = await supabase
      .from('user_otp_tokens')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !otpRecord) {
      return res.status(400).json({ error: 'קוד אימות שגוי או פג תוקף' });
    }

    // Mark OTP as used
    await supabase
      .from('user_otp_tokens')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Generate authentication token
    const authToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token expires in 30 days

    // Note: Ensure the user_sessions table exists in your Supabase database
    // You can create it manually in Supabase SQL Editor with:
    /*
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        last_activity TIMESTAMPTZ DEFAULT now()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_email ON user_sessions(email);
    */

    // Delete any existing sessions for this email
    await supabase
      .from('user_sessions')
      .delete()
      .eq('email', email);

    // Create new session
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        email,
        token: authToken,
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return res.status(500).json({ error: 'שגיאה ביצירת התחברות' });
    }

    // Clean up old OTPs
    await supabase
      .from('user_otp_tokens')
      .delete()
      .or('used.eq.true,expires_at.lt.' + new Date().toISOString());

    return res.status(200).json({
      success: true,
      email,
      token: authToken,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'שגיאה באימות קוד' });
  }
} 
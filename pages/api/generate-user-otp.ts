import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

// Generate a 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'כתובת מייל לא תקינה' });
  }

  try {
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Note: Ensure the user_otp_tokens table exists in your Supabase database
    // You can create it manually in Supabase SQL Editor with:
    /*
      CREATE TABLE IF NOT EXISTS user_otp_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_otp_email ON user_otp_tokens(email);
      CREATE INDEX IF NOT EXISTS idx_user_otp_expires ON user_otp_tokens(expires_at);
    */

    // Delete any existing OTPs for this email
    await supabase
      .from('user_otp_tokens')
      .delete()
      .eq('email', email)
      .eq('used', false);

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('user_otp_tokens')
      .insert({
        email,
        otp,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Failed to store OTP:', insertError);
      return res.status(500).json({ error: 'שגיאה בשמירת קוד האימות' });
    }

    // Send OTP via email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_SENDER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"תורים לרם-אל" <${process.env.EMAIL_SENDER}>`,
        to: email,
        subject: 'קוד אימות - תורים לרם-אל',
        html: `
          <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">קוד האימות שלך</h2>
            <div style="background: #f5f5f5; padding: 30px; border-radius: 10px; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; margin: 0;">
                ${otp}
              </p>
            </div>
            <p style="color: #666; text-align: center; font-size: 14px;">
              הקוד תקף ל-10 דקות
            </p>
            <p style="color: #999; text-align: center; font-size: 12px; margin-top: 30px;">
              אם לא ביקשת קוד זה, ניתן להתעלם מהודעה זו.
            </p>
          </div>
        `,
        text: `קוד האימות שלך: ${otp}\n\nהקוד תקף ל-10 דקות.`
      });

      transporter.close();
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({ error: 'שגיאה בשליחת המייל' });
    }

    return res.status(200).json({ 
      success: true,
      message: 'קוד אימות נשלח למייל שלך'
    });

  } catch (error) {
    console.error('Generate OTP error:', error);
    return res.status(500).json({ error: 'שגיאה ביצירת קוד אימות' });
  }
} 
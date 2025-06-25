import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import nodemailer from 'nodemailer';

const CODE_EXPIRY_MINUTES = 10;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check for existing valid, unused code
  const now = new Date();
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('management_otps')
    .select('*')
    .eq('email', email)
    .eq('used', false)
    .gt('expires_at', now.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Invalidate all previous unused, unexpired codes for this email
  await supabaseAdmin
    .from('management_otps')
    .update({ used: true, used_at: now.toISOString() })
    .eq('email', email)
    .eq('used', false)
    .gt('expires_at', now.toISOString());

  // Always generate a new code
  const code = generateCode();
  const expiresAt = new Date(now.getTime() + CODE_EXPIRY_MINUTES * 60000);
  const { error: insertError } = await supabaseAdmin
    .from('management_otps')
    .insert({
      email,
      code,
      expires_at: expiresAt.toISOString(),
      used: false,
      attempts: 0,
    });
  if (insertError) {
    return res.status(500).json({ error: 'Failed to generate code' });
  }

  // Send email
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: `"תור רם-אל" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: 'קוד אימות לניהול התראות',
      text: `קוד האימות שלך לניהול התראות: ${code}\n\nהקוד בתוקף ל-10 דקות בלבד.`,
      html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>קוד אימות לניהול התראות</title>
  <style>
    body { background: #f8fafc; font-family: 'Assistant', Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 420px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(79,70,229,0.08); border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff; padding: 32px 0 16px 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 32px 24px 24px 24px; text-align: center; }
    .otp-code { font-size: 36px; letter-spacing: 12px; font-weight: 700; color: #4f46e5; background: #f1f5f9; border-radius: 12px; padding: 16px 0; margin: 24px 0 16px 0; display: inline-block; width: 100%; }
    .footer { background: #f8fafc; color: #64748b; font-size: 13px; padding: 18px; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 קוד אימות לניהול התראות</h1>
      <p style="margin: 0; font-size: 15px; opacity: 0.9;">מספרת רם-אל</p>
    </div>
    <div class="content">
      <p style="font-size: 17px; margin-bottom: 8px;">שלום,</p>
      <p style="font-size: 15px; color: #475569; margin-bottom: 18px;">להשלמת הכניסה לעמוד ניהול ההתראות שלך, הזן את קוד האימות הבא:</p>
      <div class="otp-code">${code}</div>
      <p style="font-size: 14px; color: #64748b; margin-top: 0;">הקוד בתוקף ל-10 דקות בלבד.</p>
      <p style="font-size: 13px; color: #64748b; margin-top: 18px;">אם לא ביקשת קוד זה, ניתן להתעלם מהמייל.</p>
    </div>
    <div class="footer">
      מספרת רם-אל • מערכת התראות אוטומטית<br>
      <a href="https://tor-ramel.netlify.app" style="color: #4f46e5; text-decoration: none;">האתר הראשי</a>
    </div>
  </div>
</body>
</html>`
    });
    transporter.close();
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to send email', details: e.message });
  }

  return res.status(200).json({ success: true, message: 'קוד אימות נשלח למייל', expiresAt });
} 
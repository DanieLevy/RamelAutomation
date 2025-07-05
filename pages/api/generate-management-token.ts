import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const supabase = supabaseAdmin;

const generateManagementEmail = (email: string, token: string, subscriptionCount: number) => {
  const managementUrl = `https://tor-ramel.netlify.app/manage?token=${token}`;
  
  const subject = `תור רם-אל • קישור לניהול ההתראות שלך`;
  
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: 'Assistant', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1e293b;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 32px;
            text-align: center;
        }
        .content {
            padding: 32px;
        }
        .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        .stats-box {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .warning-box {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">🔐 ניהול התראות</h1>
                <p style="margin: 0; font-size: 16px; opacity: 0.9;">תור רם-אל • קישור מאובטח</p>
            </div>
            
            <div class="content">
                <h2 style="color: #1e293b; margin-top: 0;">שלום,</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                    קיבלנו בקשה לגשת לניהול ההתראות שלך במערכת תור רם-אל.
                </p>
                
                <div class="stats-box">
                    <h3 style="margin: 0 0 8px 0; color: #1e293b;">📊 סטטיסטיקה</h3>
                    <p style="margin: 0; color: #64748b;">
                        נמצאו <strong>${subscriptionCount}</strong> הרשמות עבור כתובת המייל הזו
                    </p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${managementUrl}" class="cta-button">
                        🛠️ נהל את ההתראות שלי
                    </a>
                </div>
                
                <div class="warning-box">
                    <strong>🔒 חשוב לדעת:</strong><br>
                    • הקישור הזה בטוח ומאפשר גישה רק להתראות שלך<br>
                    • הקישור תקף למשך 24 שעות<br>
                    • אם לא ביקשת את הקישור הזה, אל תלחץ עליו
                </div>
                
                <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                    <strong>מה תוכל לעשות בעמוד הניהול:</strong><br>
                    ✅ לראות את כל ההרשמות שלך<br>
                    ✅ לבדוק סטטוס והתקדמות<br>
                    ✅ לבטל הרשמות<br>
                    ✅ למחוק הרשמות ישנות<br>
                    ✅ ליצור הרשמות חדשות
                </p>
            </div>
            
            <div class="footer">
                <p style="margin: 0 0 8px 0;">תור רם-אל - מערכת חכמה לניהול תורים</p>
                <p style="margin: 0;">
                    <a href="https://tor-ramel.netlify.app" style="color: #4f46e5; text-decoration: none;">האתר הראשי</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

  const text = `
תור רם-אל: קישור לניהול ההתראות שלך

שלום,

קיבלנו בקשה לגשת לניהול ההתראות שלך במערכת תור רם-אל.

📊 נמצאו ${subscriptionCount} הרשמות עבור כתובת המייל הזו

🛠️ לניהול ההתראות שלך: ${managementUrl}

🔒 חשוב לדעת:
- הקישור הזה בטוח ומאפשר גישה רק להתראות שלך
- הקישור תקף למשך 24 שעות
- אם לא ביקשת את הקישור הזה, אל תלחץ עליו

מה תוכל לעשות בעמוד הניהול:
✅ לראות את כל ההרשמות שלך
✅ לבדוק סטטוס והתקדמות
✅ לבטל הרשמות
✅ למחוק הרשמות ישנות
✅ ליצור הרשמות חדשות

תור רם-אל
האתר: https://tor-ramel.netlify.app
`.trim();

  return { subject, html, text };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, includeStats } = req.body;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'כתובת מייל לא תקינה' });
  }

  try {
    // Check if user has any subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('notifications')
      .select('id, status')
      .eq('email', email);

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ 
        error: 'לא נמצאו הרשמות עבור כתובת המייל הזו' 
      });
    }

    // Generate secure management token
    const managementToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store management token in database
    const { error: tokenError } = await supabase
      .from('management_tokens')
      .insert([{
        token: managementToken,
        email: email,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        used: false
      }]);

    if (tokenError) {
      // If table doesn't exist, create it
      if (tokenError.code === '42P01') {
        console.log('🔑 Creating management_tokens table...');
        
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS management_tokens (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              token UUID NOT NULL UNIQUE,
              email TEXT NOT NULL,
              expires_at TIMESTAMPTZ NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              used BOOLEAN DEFAULT FALSE,
              used_at TIMESTAMPTZ
            );

            CREATE INDEX IF NOT EXISTS idx_management_tokens_token ON management_tokens(token);
            CREATE INDEX IF NOT EXISTS idx_management_tokens_email ON management_tokens(email);
            CREATE INDEX IF NOT EXISTS idx_management_tokens_expires_at ON management_tokens(expires_at);

            -- Enable RLS
            ALTER TABLE management_tokens ENABLE ROW LEVEL SECURITY;

            -- Create policy for service role access
            CREATE POLICY "Allow service role full access to management_tokens" ON management_tokens
              FOR ALL USING (auth.role() = 'service_role');
          `
        });

        if (createError) {
          console.error('🔑 ❌ Failed to create management_tokens table:', createError);
          throw createError;
        }

        // Try inserting again
        const { error: retryError } = await supabase
          .from('management_tokens')
          .insert([{
            token: managementToken,
            email: email,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            used: false
          }]);

        if (retryError) {
          throw retryError;
        }
      } else {
        throw tokenError;
      }
    }

    // Only fetch full stats if requested
    let stats = {};
    if (includeStats === 'true') {
      try {
        // Get active subscriptions from notifications_simple
        const { data: activeSubscriptions, error: subError } = await supabase
          .from('notifications_simple')
          .select('*', { count: 'exact' })
          .eq('status', 'active');

        if (subError) {
          console.error('Error fetching subscription stats:', subError);
        }

        // Get cache data
        const { data: cacheData, error: cacheError } = await supabase
          .from('cache')
          .select('value')
          .eq('key', 'auto-check-results')
          .single();

        if (cacheError) {
          console.error('Error fetching cache stats:', cacheError);
        }

        // Get email queue stats
        const { data: queueData, error: queueError } = await supabase
          .from('email_queue')
          .select('status', { count: 'exact' })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (queueError) {
          console.error('Error fetching email queue stats:', queueError);
        }

        // Calculate stats
        const pendingEmails = queueData?.filter(e => e.status === 'pending').length || 0;
        const sentEmails = queueData?.filter(e => e.status === 'sent').length || 0;
        const failedEmails = queueData?.filter(e => e.status === 'failed').length || 0;

        stats = {
          activeSubscriptions: activeSubscriptions?.length || 0,
          lastCheckResult: cacheData?.value || null,
          emailQueue: {
            pending: pendingEmails,
            sent: sentEmails,
            failed: failedEmails,
            total: queueData?.length || 0
          },
          timestamp: new Date().toISOString()
        };
      } catch (statsError) {
        console.error('Error gathering stats:', statsError);
        // Don't fail the whole request if stats fail
      }
    }

    // Send management email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_SENDER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });

      const emailContent = generateManagementEmail(email, managementToken, subscriptions.length);

      const emailResult = await transporter.sendMail({
        from: `"תור רם-אל" <${process.env.EMAIL_SENDER}>`,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal'
        }
      });

      console.log(`🔑 ✅ Management token email sent to ${email}: ${emailResult.messageId}`);
      transporter.close();

    } catch (emailError: any) {
      console.error(`🔑 ❌ Failed to send management email to ${email}:`, emailError.message);
      return res.status(500).json({ 
        error: 'שגיאה בשליחת המייל. אנא נסה שוב.' 
      });
    }

    return res.status(200).json({
      success: true,
      message: `נשלח קישור לניהול ההתראות לכתובת ${email}. בדוק את תיבת הדואר שלך.`,
      subscriptionCount: subscriptions.length,
      stats: stats
    });

  } catch (error) {
    console.error('🔑 ❌ Management token generation error:', error);
    return res.status(500).json({
      error: 'שגיאה פנימית. אנא נסה שוב.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enhanced debug logging
  console.log('=== NOTIFY REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'origin': req.headers.origin,
    'referer': req.headers.referer
  });
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', req.body ? Object.keys(req.body) : 'no body');
  console.log('========================');

  if (req.method !== 'POST') {
    console.error('[notify-request] Invalid method:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      details: `Expected POST, received ${req.method}`
    });
  }

  // Check if body exists
  if (!req.body) {
    console.error('[notify-request] Missing request body');
    return res.status(400).json({ 
      error: 'Missing request body',
      details: 'Request body is required'
    });
  }

  try {
    const { email, subscriptionType, targetDate, dateStart, dateEnd } = req.body;
    
    // More debug logging
    console.log('[notify-request] Extracted values:', { 
      email, 
      subscriptionType, 
      targetDate, 
      dateStart, 
      dateEnd 
    });

    // Validate email
    if (!email) {
      console.error('[notify-request] Missing email');
      return res.status(400).json({ 
        error: 'כתובת מייל חסרה',
        field: 'email',
        details: 'Email is required'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('[notify-request] Invalid email format:', email);
      return res.status(400).json({ 
        error: 'כתובת מייל לא תקינה',
        field: 'email',
        details: `Invalid email format: ${email}`
      });
    }

    // Validate subscription type
    if (!subscriptionType || !['single', 'range'].includes(subscriptionType)) {
      console.error('[notify-request] Invalid subscription type:', subscriptionType);
      return res.status(400).json({ 
        error: 'סוג מינוי לא תקין',
        field: 'subscriptionType',
        details: `Expected 'single' or 'range', received: ${subscriptionType}`
      });
    }

    // Validate dates based on subscription type
    if (subscriptionType === 'single') {
      if (!targetDate) {
        return res.status(400).json({ error: 'יש לבחור תאריך' });
      }
      
      // Use string comparison to avoid timezone issues
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
      
      console.log('Date validation:', {
        targetDate,
        todayStr,
        isPast: targetDate < todayStr
      });
      
      if (targetDate < todayStr) {
        return res.status(400).json({ error: 'לא ניתן לבחור תאריך שעבר' });
      }
    } else if (subscriptionType === 'range') {
      if (!dateStart || !dateEnd) {
        return res.status(400).json({ error: 'יש לבחור טווח תאריכים' });
      }
      
      // Use string comparison to avoid timezone issues
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
      
      console.log('Range validation:', {
        dateStart,
        dateEnd,
        todayStr,
        startIsPast: dateStart < todayStr,
        endBeforeStart: dateEnd < dateStart
      });
      
      if (dateStart < todayStr) {
        return res.status(400).json({ error: 'תאריך התחלה לא יכול להיות בעבר' });
      }
      
      if (dateEnd < dateStart) {
        return res.status(400).json({ error: 'תאריך סיום חייב להיות אחרי תאריך התחלה' });
      }
      
      // Limit range to 30 days as per requirements
      const start = new Date(dateStart);
      const end = new Date(dateEnd);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      console.log('Days difference:', daysDiff);
      
      if (daysDiff > 30) {
        return res.status(400).json({ error: 'טווח התאריכים לא יכול לעלות על 30 יום' });
      }
    }

    // Create new subscription
    const subscriptionData: any = {
      email,
      subscription_type: subscriptionType,
      status: 'active'
    };

    if (subscriptionType === 'single') {
      subscriptionData.target_date = targetDate;
    } else {
      subscriptionData.date_start = dateStart;
      subscriptionData.date_end = dateEnd;
    }

    const { data: newSubscription, error: insertError } = await supabase
      .from('notifications_simple')
      .insert([subscriptionData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating subscription:', insertError);
      return res.status(500).json({ error: 'שגיאה ביצירת המינוי' });
    }

    console.log(`✅ New subscription created for ${email}:`, {
      id: newSubscription.id,
      type: subscriptionType,
      dates: subscriptionType === 'single' ? targetDate : `${dateStart} - ${dateEnd}`
    });

    // Send confirmation email (simple)
    try {
      const { emailService } = await import('@/lib/emailService');
      
      const emailContent = {
        subject: 'אישור הרשמה להתראות - תורים לרם-אל',
        html: `
          <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif;">
            <h2>ההרשמה שלך התקבלה בהצלחה! ✅</h2>
            <p>שלום,</p>
            <p>נרשמת בהצלחה לקבלת התראות על תורים פנויים במספרת רם-אל.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>פרטי המינוי:</h3>
              ${subscriptionType === 'single' 
                ? `<p><strong>תאריך:</strong> ${new Date(targetDate).toLocaleDateString('he-IL')}</p>`
                : `<p><strong>טווח תאריכים:</strong> ${new Date(dateStart).toLocaleDateString('he-IL')} - ${new Date(dateEnd).toLocaleDateString('he-IL')}</p>`
              }
            </div>
            
            <p>כאשר יימצאו תורים פנויים, נשלח לך מייל עם כל האפשרויות הזמינות.</p>
            
            <p style="margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?token=${newSubscription.stop_token}" 
                 style="color: #666; text-decoration: underline;">
                לביטול המינוי
              </a>
            </p>
          </div>
        `,
        text: `ההרשמה שלך התקבלה בהצלחה!\n\nפרטי המינוי:\n${
          subscriptionType === 'single' 
            ? `תאריך: ${new Date(targetDate).toLocaleDateString('he-IL')}`
            : `טווח תאריכים: ${new Date(dateStart).toLocaleDateString('he-IL')} - ${new Date(dateEnd).toLocaleDateString('he-IL')}`
        }\n\nכאשר יימצאו תורים פנויים, נשלח לך מייל עם כל האפשרויות הזמינות.`
      };

      await emailService.queueEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        priority: 5
      });
    } catch (emailError) {
      console.error('Failed to queue confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      success: true,
      message: 'נרשמת בהצלחה! נשלח אליך מייל כשיימצאו תורים פנויים.',
      subscription: {
        id: newSubscription.id,
        type: subscriptionType,
        dates: subscriptionType === 'single' ? targetDate : { start: dateStart, end: dateEnd }
      }
    });

  } catch (error) {
    console.error('Notify request error:', error);
    return res.status(500).json({ 
      error: 'שגיאת מערכת',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
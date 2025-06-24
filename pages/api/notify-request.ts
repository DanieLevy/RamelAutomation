import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format, isValid, parse, parseISO } from 'date-fns';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
);

// Israel timezone utilities
const ISRAEL_TIMEZONE = 'Asia/Jerusalem';

const formatDateIsrael = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const getCurrentDateIsrael = (): Date => {
  return new Date(new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()) + 'T00:00:00');
};

const isValidDateFormat = (dateStr: string): boolean => {
  // Check if date is in YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  
  // Parse and validate the date
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(parsed);
};

const isClosedDay = (dateStr: string): boolean => {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date);
  
  return dayOfWeek === 'Monday' || dayOfWeek === 'Saturday';
};

// Create confirmation email template
const generateConfirmationEmail = (email: string, criteria: any, criteria_type: string) => {
  const isRange = criteria_type === 'range';
  const dateText = isRange ? 
    `${criteria.start} עד ${criteria.end}` : 
    criteria.date;
  
  const subject = 'תור רם-אל: קיבלנו את בקשתך! 🎯';
  
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>קיבלנו את בקשתך - תור רם-אל</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f9; direction: rtl;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4a4a68, #6b6b7d); color: white; padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 תור רם-אל</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">קיבלנו את בקשתך!</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 32px;">
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h2 style="color: #0ea5e9; margin: 0 0 12px 0; font-size: 20px;">✅ הרשמה הושלמה בהצלחה</h2>
                <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6;">
                    שלום! קיבלנו את בקשתך להתראות על תורים פנויים במספרת רם-אל.
                </p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #334155; margin: 0 0 16px 0; font-size: 18px;">📋 פרטי החיפוש שלך:</h3>
                <div style="background-color: white; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                        <strong>סוג חיפוש:</strong> ${isRange ? 'טווח תאריכים' : 'תאריך בודד'}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                        <strong>${isRange ? 'טווח תאריכים:' : 'תאריך:'}</strong> ${dateText}
                    </p>
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                        <strong>כתובת מייל:</strong> ${email}
                    </p>
                </div>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px;">⚡ מה קורה עכשיו?</h3>
                <ul style="margin: 0; padding-right: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
                    <li>המערכת שלנו בודקת כל 5 דקות אם יש תורים פנויים</li>
                    <li>ברגע שנמצא תור מתאים - תקבל מייל מיידי</li>
                    <li>תוכל לקבל עד 6 התראות על תורים זמינים</li>
                    <li>התראות יישלחו עם הפסקה של 10 דקות לפחות</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://tor-ramel.netlify.app" style="display: inline-block; background-color: #4a4a68; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
                    🔗 חזור לאתר
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">
                תור רם-אל - מערכת חכמה לניהול תורים
            </p>
            <p style="margin: 0; color: #64748b; font-size: 12px;">
                לא רוצה לקבל התראות? 
                <a href="https://tor-ramel.netlify.app/unsubscribe" style="color: #0ea5e9; text-decoration: none;">בטל את המנוי</a>
            </p>
        </div>
    </div>
</body>
</html>`;

  const text = `
תור רם-אל: קיבלנו את בקשתך!

שלום,

קיבלנו את בקשתך להתראות על תורים פנויים במספרת רם-אל.

פרטי החיפוש:
- סוג: ${isRange ? 'טווח תאריכים' : 'תאריך בודד'}
- ${isRange ? 'טווח' : 'תאריך'}: ${dateText}
- מייל: ${email}

מה קורה עכשיו?
- המערכת בודקת כל 5 דקות אם יש תורים פנויים
- ברגע שנמצא תור מתאים - תקבל מייל מיידי
- תוכל לקבל עד 6 התראות על תורים זמינים

תודה שבחרת בתור רם-אל!

האתר: https://tor-ramel.netlify.app
`.trim();

  return { subject, html, text };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, date, start, end, smartSelection } = req.body;
  
  // Validate required fields
  if (!email || (!date && (!start || !end))) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Validate email format
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Handle the date selection based on the request
  let criteria: any;
  let criteria_type: string;
  const maxRangeDays = 30; // Maximum allowed range in days
  
  const currentDate = getCurrentDateIsrael();
  
  if (date) {
    // Single date selection
    if (!isValidDateFormat(date)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Ensure date is not in the past
    const selectedDate = new Date(date);
    if (selectedDate < currentDate) {
      return res.status(400).json({ error: 'Cannot select a date in the past' });
    }
    
    // Handle closed days
    if (isClosedDay(date)) {
      return res.status(400).json({ error: 'The selected date is a closed day (Monday or Saturday)' });
    }
    
    criteria = { date };
    criteria_type = 'single';
  } else {
    // Date range selection
    if (!isValidDateFormat(start) || !isValidDateFormat(end)) {
      return res.status(400).json({ error: 'Invalid date format in range' });
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Validate date range
    if (startDate > endDate) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    if (startDate < currentDate) {
      return res.status(400).json({ error: 'Cannot select start date in the past' });
    }
    
    // Smart date selection - limit range if it's too long
    let adjustedEnd = endDate;
    
    if (smartSelection === true) {
      const dayDifference = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDifference > maxRangeDays) {
        adjustedEnd = addDays(startDate, maxRangeDays);
        // Format the adjusted end date
        const adjustedEndStr = format(adjustedEnd, 'yyyy-MM-dd');
        criteria = { 
          start,
          end: adjustedEndStr,
          original_end: end,
          adjusted: true
        };
      } else {
        criteria = { start, end };
      }
    } else {
      criteria = { start, end };
    }
    
    criteria_type = 'range';
  }
  
  // Create a unique unsubscribe token
  const unsubscribe_token = uuidv4();
  
  // Insert into Supabase
  const { error: insertError } = await supabase.from('notifications').insert([
    {
      email,
      criteria,
      criteria_type,
      unsubscribe_token,
      notification_count: 0,
      last_notified: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
  ]);
  
  if (insertError) {
    console.error('Failed to save notification request:', insertError);
    return res.status(500).json({ error: 'Failed to save notification request' });
  }

  console.log(`📧 New subscription created for ${email}`);

  // Send confirmation email
  try {
    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // Generate confirmation email
    const confirmationEmail = generateConfirmationEmail(email, criteria, criteria_type);

    // Send confirmation email
    const emailResult = await transporter.sendMail({
      from: `"תור רם-אל" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: confirmationEmail.subject,
      html: confirmationEmail.html,
      text: confirmationEmail.text,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal'
      }
    });

    console.log(`📧 ✅ Confirmation email sent to ${email}: ${emailResult.messageId}`);
    
    // Close transporter
    transporter.close();

  } catch (emailError: any) {
    console.error(`📧 ❌ Failed to send confirmation email to ${email}:`, emailError.message);
    // Don't fail the entire request if confirmation email fails
  }
  
  return res.status(200).json({ 
    success: true,
    message: criteria.adjusted 
      ? `נרשמת בהצלחה להתראה! שים לב: טווח התאריכים הוגבל ל-${maxRangeDays} ימים. נשלח לך מייל אישור.`
      : 'נרשמת בהצלחה להתראה! נשלח לך מייל אישור.'
  });
} 
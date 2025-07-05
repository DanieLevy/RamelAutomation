import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token, action } = req.query;

  // Validate parameters
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid token' });
  }

  if (!action || (action !== 'continue' && action !== 'stop')) {
    return res.status(400).json({ error: 'Invalid action. Must be "continue" or "stop"' });
  }

  try {
    // Find the action record
    const { data: actionRecord, error: findError } = await supabase
      .from('user_notification_actions')
      .select(`
        *,
        notifications_simple!inner(*)
      `)
      .eq('action_token', token)
      .single();

    if (findError || !actionRecord) {
      // Return user-friendly HTML page for invalid token
      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>קישור לא תקין</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #ef4444; }
            p { color: #666; margin: 20px 0; }
            a {
              display: inline-block;
              margin-top: 20px;
              padding: 10px 20px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ קישור לא תקין</h1>
            <p>הקישור שלחצת עליו אינו תקין או שכבר נעשה בו שימוש.</p>
            <p>אנא בדוק את המייל האחרון שקיבלת מהמערכת.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || '/'}">חזור לדף הבית</a>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(html);
    }

    // Check if action was already processed
    if (actionRecord.action !== 'pending') {
      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>הפעולה כבר בוצעה</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #f59e0b; }
            p { color: #666; margin: 20px 0; }
            .status { 
              font-weight: bold; 
              color: ${actionRecord.action === 'stop' ? '#ef4444' : '#10b981'};
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ הפעולה כבר בוצעה</h1>
            <p>כבר ביצעת פעולה עבור התראה זו.</p>
            <p class="status">
              סטטוס: ${actionRecord.action === 'stop' ? '🛑 התראות הופסקו' : '✅ החיפוש ממשיך'}
            </p>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    const notification = actionRecord.notifications_simple;

    // Process the action
    if (action === 'stop') {
      // User found an appointment - stop notifications
      await supabase
        .from('notifications_simple')
        .update({ 
          status: 'stopped',
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      // Update action record
      await supabase
        .from('user_notification_actions')
        .update({ 
          action: 'stop',
          created_at: new Date().toISOString()
        })
        .eq('action_token', token);

      // Return success page
      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ההתראות הופסקו</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #10b981; }
            p { color: #666; margin: 20px 0; }
            .emoji { font-size: 48px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">🎉</div>
            <h1>מצוין! ההתראות הופסקו</h1>
            <p>שמחים שמצאת תור מתאים!</p>
            <p>לא תקבל יותר התראות עבור מינוי זה.</p>
            <p style="margin-top: 30px; font-size: 14px;">בהצלחה בתור! 💇‍♂️</p>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);

    } else if (action === 'continue') {
      // User wants to continue searching
      // Just update the action record to mark it as processed
      await supabase
        .from('user_notification_actions')
        .update({ 
          action: 'continue',
          created_at: new Date().toISOString()
        })
        .eq('action_token', token);

      // Return continue page
      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>החיפוש ממשיך</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #2563eb; }
            p { color: #666; margin: 20px 0; }
            .emoji { font-size: 48px; margin: 20px 0; }
            .info {
              background-color: #eff6ff;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">🔍</div>
            <h1>החיפוש ממשיך!</h1>
            <p>נמשיך לחפש תורים פנויים עבורך.</p>
            <p>ברגע שיתפנו תורים חדשים, נשלח לך התראה במייל.</p>
            <div class="info">
              💡 טיפ: הבדיקה מתבצעת כל 5 דקות, כך שלא תפספס אף הזדמנות!
            </div>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

  } catch (error) {
    console.error('Notification action error:', error);
    
    // Return error page
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>שגיאה</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          }
          h1 { color: #ef4444; }
          p { color: #666; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ שגיאה</h1>
          <p>אירעה שגיאה בעיבוד הבקשה.</p>
          <p>אנא נסה שוב מאוחר יותר.</p>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(html);
  }
} 
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { generateUnsubscribeEmailTemplate } from '@/lib/emailTemplates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  // Common styles for mobile-optimized responsive design
  const commonStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Ploni', 'Arial Hebrew', sans-serif;
      direction: rtl;
    }
    body {
      background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
      color: #111827;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      transition: all 0.3s ease;
      line-height: 1.6;
    }
    body.dark {
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      color: #f9fafb;
    }
    .container {
      max-width: 480px;
      width: 100%;
      margin: 0 auto;
      text-align: center;
    }
    .card {
      background-color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
      border: 1px solid rgba(229, 231, 235, 0.8);
    }
    body.dark .card {
      background-color: rgba(31, 41, 55, 0.95);
      border: 1px solid rgba(75, 85, 99, 0.8);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    }
    h1 {
      font-size: 1.75rem;
      margin-bottom: 1rem;
      font-weight: 700;
      color: #111827;
    }
    body.dark h1 {
      color: #f9fafb;
    }
    p {
      margin-bottom: 1.5rem;
      line-height: 1.6;
      color: #4b5563;
      font-size: 1rem;
    }
    body.dark p {
      color: #d1d5db;
    }
    .icon {
      margin-bottom: 1.5rem;
      width: 72px;
      height: 72px;
      margin-left: auto;
      margin-right: auto;
      opacity: 0.9;
    }
    .success {
      color: #10b981;
    }
    .error {
      color: #ef4444;
    }
    .warning {
      color: #f59e0b;
    }
    .info {
      color: #3b82f6;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #111827 0%, #374151 100%);
      color: white;
      padding: 0.875rem 1.75rem;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 1rem;
      transition: background-color 0.3s ease;
    }
    body.dark .button {
      background-color: #2563eb;
    }
    .button:hover {
      background-color: #374151;
    }
    body.dark .button:hover {
      background-color: #3b82f6;
    }
    .toggle-theme {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #4b5563;
      font-size: 1.5rem;
      transition: color 0.3s ease;
    }
    body.dark .toggle-theme {
      color: #9ca3af;
    }
    .status-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-active {
      background-color: #d1fae5;
      color: #065f46;
    }
    body.dark .status-active {
      background-color: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
    }
    .status-cancelled {
      background-color: #fee2e2;
      color: #991b1b;
    }
    body.dark .status-cancelled {
      background-color: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
    }
    .status-expired {
      background-color: #fef3c7;
      color: #92400e;
    }
    body.dark .status-expired {
      background-color: rgba(245, 158, 11, 0.2);
      color: #fcd34d;
    }
    .status-max {
      background-color: #e0e7ff;
      color: #3730a3;
    }
    body.dark .status-max {
      background-color: rgba(99, 102, 241, 0.2);
      color: #c7d2fe;
    }
    .details-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      text-align: right;
      font-size: 0.875rem;
    }
    body.dark .details-box {
      background-color: #1e293b;
      border-color: #475569;
    }
    .button.secondary {
      background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
    }
    body.dark .button.secondary {
      background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
    }
    .animation {
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 640px) {
      .card {
        padding: 1.5rem;
      }
      h1 {
        font-size: 1.25rem;
      }
      .button {
        display: block;
        width: 100%;
        margin: 0.5rem 0;
      }
    }
  `;

  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>שגיאה - הסרה מהתראות</title>
        <style>${commonStyles}</style>
      </head>
      <body>
        <button class="toggle-theme" aria-label="החלף מצב תצוגה">🌓</button>
        <div class="container">
          <div class="card animation">
            <div class="icon error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1>שגיאה בהסרה מהתראות</h1>
            <p>לא נמצא טוקן הסרה. אנא ודא שהקישור שלחצת עליו תקין.</p>
            <a href="https://tor-ramel.netlify.app" class="button">חזרה לדף הבית</a>
          </div>
        </div>
        <script>
          // Dark mode toggle
          const toggleTheme = document.querySelector('.toggle-theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          
          if (prefersDark) {
            document.body.classList.add('dark');
          }
          
          toggleTheme.addEventListener('click', () => {
            document.body.classList.toggle('dark');
          });
        </script>
      </body>
      </html>
    `);
  }

  try {
    // Check if token exists and get subscription details
    const { data, error } = await supabase
      .from('notifications')
      .select('id, email, status, criteria_type, criteria, notification_count, created_at, last_notified')
      .eq('unsubscribe_token', token)
      .single();

    if (error || !data) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>לא נמצא - הסרה מהתראות</title>
          <style>${commonStyles}</style>
        </head>
        <body>
          <button class="toggle-theme" aria-label="החלף מצב תצוגה">🌓</button>
          <div class="container">
            <div class="card animation">
              <div class="icon error">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1>הרשמה לא נמצאה</h1>
              <p>הקישור שלחצת עליו אינו תקף או שההרשמה כבר הוסרה מהמערכת.</p>
              <div class="details-box">
                <p><strong>סיבות אפשריות:</strong></p>
                <ul style="text-align: right; margin-top: 0.5rem;">
                  <li>הקישור פג תוקף</li>
                  <li>ההרשמה כבר בוטלה בעבר</li>
                  <li>הקישור לא הועתק כראוי</li>
                </ul>
              </div>
              <a href="https://tor-ramel.netlify.app" class="button">רישום מחדש לתורים</a>
            </div>
          </div>
          <script>
            // Dark mode toggle
            const toggleTheme = document.querySelector('.toggle-theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (prefersDark) {
              document.body.classList.add('dark');
            }
            
            toggleTheme.addEventListener('click', () => {
              document.body.classList.toggle('dark');
            });
          </script>
        </body>
        </html>
      `);
    }

    // Handle different subscription statuses
    const status = data.status || 'active'; // Default to active for backward compatibility
    const notificationCount = data.notification_count || 0;
    const createdDate = new Date(data.created_at).toLocaleDateString('he-IL');
    const lastNotified = data.last_notified ? new Date(data.last_notified).toLocaleDateString('he-IL') : 'אף פעם';

    // Format criteria for display
    let criteriaText = '';
    if (data.criteria_type === 'single' && data.criteria?.date) {
      criteriaText = `תאריך בודד: ${data.criteria.date}`;
    } else if (data.criteria_type === 'range' && data.criteria?.start && data.criteria?.end) {
      criteriaText = `טווח תאריכים: ${data.criteria.start} עד ${data.criteria.end}`;
    }

    // If already cancelled, show status
    if (status === 'cancelled') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>הרשמה בוטלה - תורים רם-אל</title>
          <style>${commonStyles}</style>
        </head>
        <body>
          <button class="toggle-theme" aria-label="החלף מצב תצוגה">🌓</button>
          <div class="container">
            <div class="card animation">
              <div class="status-badge status-cancelled">בוטל על ידי המשתמש</div>
              <div class="icon warning">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                </svg>
              </div>
              <h1>ההרשמה כבר בוטלה</h1>
              <p>ההרשמה שלך להתראות במספרת רם-אל כבר בוטלה בעבר על ידך.</p>
              
              <div class="details-box">
                <p><strong>פרטי ההרשמה:</strong></p>
                <p>📧 כתובת מייל: ${data.email}</p>
                <p>📅 ${criteriaText}</p>
                <p>📊 התראות שנשלחו: ${notificationCount} מתוך 6</p>
                <p>📆 נוצר ב: ${createdDate}</p>
                <p>📨 התראה אחרונה: ${lastNotified}</p>
              </div>
              
              <p>אם תרצה לקבל התראות שוב, תוכל לעבור לאפליקציה ולהירשם מחדש.</p>
              <div>
                <a href="https://tor-ramel.netlify.app" class="button">רישום מחדש</a>
                <a href="https://tor-ramel.netlify.app" class="button secondary">חזרה לאפליקציה</a>
              </div>
            </div>
          </div>
          <script>
            const toggleTheme = document.querySelector('.toggle-theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (prefersDark) {
              document.body.classList.add('dark');
            }
            
            toggleTheme.addEventListener('click', () => {
              document.body.classList.toggle('dark');
            });
          </script>
        </body>
        </html>
      `);
    }

    // If expired, show status
    if (status === 'expired') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>הרשמה פגה - תורים רם-אל</title>
          <style>${commonStyles}</style>
        </head>
        <body>
          <button class="toggle-theme" aria-label="החלף מצב תצוגה">🌓</button>
          <div class="container">
            <div class="card animation">
              <div class="status-badge status-expired">פג תוקף</div>
              <div class="icon warning">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1>ההרשמה פגה</h1>
              <p>ההרשמה שלך להתראות פגה מאחר והתאריכים שביקשת כבר עברו.</p>
              
              <div class="details-box">
                <p><strong>פרטי ההרשמה שפגה:</strong></p>
                <p>📧 כתובת מייל: ${data.email}</p>
                <p>📅 ${criteriaText}</p>
                <p>📊 התראות שנשלחו: ${notificationCount} מתוך 6</p>
                <p>📆 נוצר ב: ${createdDate}</p>
                <p>📨 התראה אחרונה: ${lastNotified}</p>
              </div>
              
              <p>תוכל לבצע הרשמה חדשה לתאריכים עתידיים באפליקציה.</p>
              <div>
                <a href="https://tor-ramel.netlify.app" class="button">רישום חדש</a>
                <a href="https://tor-ramel.netlify.app" class="button secondary">חזרה לאפליקציה</a>
              </div>
            </div>
          </div>
          <script>
            const toggleTheme = document.querySelector('.toggle-theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (prefersDark) {
              document.body.classList.add('dark');
            }
            
            toggleTheme.addEventListener('click', () => {
              document.body.classList.toggle('dark');
            });
          </script>
        </body>
        </html>
      `);
    }

    // If max reached, show status
    if (status === 'max_reached') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>הושלמו כל ההתראות - תורים רם-אל</title>
          <style>${commonStyles}</style>
        </head>
        <body>
          <button class="toggle-theme" aria-label="החלף מצב תצוגה">🌓</button>
          <div class="container">
            <div class="card animation">
              <div class="status-badge status-max">הושלמו 6 התראות</div>
              <div class="icon info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1>הושלמו כל ההתראות</h1>
              <p>ההרשמה שלך להתראות הושלמה לאחר שנשלחו לך 6 התראות מקסימליות.</p>
              
              <div class="details-box">
                <p><strong>פרטי ההרשמה שהושלמה:</strong></p>
                <p>📧 כתובת מייל: ${data.email}</p>
                <p>📅 ${criteriaText}</p>
                <p>📊 התראות שנשלחו: ${notificationCount} מתוך 6 ✅</p>
                <p>📆 נוצר ב: ${createdDate}</p>
                <p>📨 התראה אחרונה: ${lastNotified}</p>
              </div>
              
              <p>המערכת הפסיקה לשלוח התראות לאחר שהגיעה למספר המקסימלי. תוכל לבצע הרשמה חדשה אם תרצה.</p>
              <div>
                <a href="https://tor-ramel.netlify.app" class="button">רישום חדש</a>
                <a href="https://tor-ramel.netlify.app" class="button secondary">חזרה לאפליקציה</a>
              </div>
            </div>
          </div>
          <script>
            const toggleTheme = document.querySelector('.toggle-theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (prefersDark) {
              document.body.classList.add('dark');
            }
            
            toggleTheme.addEventListener('click', () => {
              document.body.classList.toggle('dark');
            });
          </script>
        </body>
        </html>
      `);
    }

    // For active subscriptions, perform the cancellation - MARK AS CANCELLED instead of deleting
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('unsubscribe_token', token);

    if (updateError) {
      throw updateError;
    }

    // Send modern unsubscribe confirmation email
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_SENDER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
      const unsubscribeEmail = generateUnsubscribeEmailTemplate({
        userEmail: data.email,
        resubscribeUrl: 'https://tor-ramel.netlify.app'
      });
      await transporter.sendMail({
        from: `"תור רם-אל" <${process.env.EMAIL_SENDER}>`,
        to: data.email,
        subject: unsubscribeEmail.subject,
        html: unsubscribeEmail.html,
        text: unsubscribeEmail.text
      });
      transporter.close();
    } catch (emailError) {
      console.error('Failed to send unsubscribe confirmation email:', emailError);
    }

    // Success page - subscription cancelled
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>הרשמה בוטלה בהצלחה - תורים רם-אל</title>
        <style>${commonStyles}</style>
      </head>
      <body>
        <button class="toggle-theme" aria-label="החלף מצב תצוגה">🌓</button>
        <div class="container">
          <div class="card animation">
            <div class="status-badge status-cancelled">בוטל בהצלחה</div>
            <div class="icon success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1>הרשמה בוטלה בהצלחה!</h1>
            <p>ההרשמה שלך להתראות במספרת רם-אל בוטלה בהצלחה. לא תקבל עוד התראות על הכתובת הזו.</p>
            
            <div class="details-box">
              <p><strong>פרטי ההרשמה שבוטלה:</strong></p>
              <p>📧 כתובת מייל: ${data.email}</p>
              <p>📅 ${criteriaText}</p>
              <p>📊 התראות שנשלחו: ${notificationCount} מתוך 6</p>
              <p>📆 נוצר ב: ${createdDate}</p>
              <p>📨 התראה אחרונה: ${lastNotified}</p>
              <p>🚫 בוטל היום: ${new Date().toLocaleDateString('he-IL')}</p>
            </div>
            
            <p>תוכל לחזור ולהירשם להתראות בכל עת דרך האפליקציה.</p>
            <div>
              <a href="https://tor-ramel.netlify.app" class="button">רישום מחדש</a>
              <a href="https://tor-ramel.netlify.app" class="button secondary">חזרה לאפליקציה</a>
            </div>
          </div>
        </div>
        <script>
          // Add confetti effect for success
          function createConfetti() {
            const confettiCount = 50;
            const container = document.querySelector('body');
            
            for (let i = 0; i < confettiCount; i++) {
              const confetti = document.createElement('div');
              confetti.style.position = 'fixed';
              confetti.style.width = Math.random() * 8 + 4 + 'px';
              confetti.style.height = Math.random() * 8 + 4 + 'px';
              confetti.style.backgroundColor = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)];
              confetti.style.borderRadius = '50%';
              confetti.style.top = '-10px';
              confetti.style.left = Math.random() * 100 + 'vw';
              confetti.style.opacity = Math.random() * 0.6 + 0.4;
              confetti.style.pointerEvents = 'none';
              confetti.style.zIndex = '1000';
              confetti.style.animation = 'fall ' + (Math.random() * 2 + 2) + 's ease-out forwards';
              container.appendChild(confetti);
              
              setTimeout(() => confetti.remove(), 4000);
            }
            
            const style = document.createElement('style');
            style.innerHTML = '@keyframes fall { to { transform: translateY(100vh) rotate(360deg); opacity: 0; } }';
            document.head.appendChild(style);
          }
          
          // Dark mode toggle
          const toggleTheme = document.querySelector('.toggle-theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          
          if (prefersDark) {
            document.body.classList.add('dark');
          }
          
          toggleTheme.addEventListener('click', () => {
            document.body.classList.toggle('dark');
          });
          
          // Run confetti on load
          setTimeout(createConfetti, 500);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing unsubscribe request:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>שגיאה - הסרה מהתראות</title>
        <style>${commonStyles}</style>
      </head>
      <body>
        <button class="toggle-theme" aria-label="החלף מצב תצוגה">🌓</button>
        <div class="container">
          <div class="card animation">
            <div class="icon error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1>שגיאת מערכת</h1>
            <p>אירעה שגיאה בעת ביטול ההרשמה. אנא נסה שוב מאוחר יותר.</p>
            <div class="details-box">
              <p><strong>מה אפשר לעשות:</strong></p>
              <ul style="text-align: right; margin-top: 0.5rem;">
                <li>נסה ללחוץ על הקישור שוב</li>
                <li>בדוק את החיבור לאינטרנט</li>
                <li>פנה לתמיכה אם הבעיה נמשכת</li>
              </ul>
            </div>
            <div>
              <a href="javascript:location.reload()" class="button">נסה שוב</a>
              <a href="https://tor-ramel.netlify.app" class="button secondary">חזרה לאפליקציה</a>
            </div>
          </div>
        </div>
        <script>
          const toggleTheme = document.querySelector('.toggle-theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          
          if (prefersDark) {
            document.body.classList.add('dark');
          }
          
          toggleTheme.addEventListener('click', () => {
            document.body.classList.toggle('dark');
          });
        </script>
      </body>
      </html>
    `);
  }
} 
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// ============================================================================
// EMAIL NOTIFICATION PROCESSOR
// Purpose: Handle heavy email processing triggered by frontend
// Benefit: Keeps auto-check function under 8 seconds, emails processed separately
// ============================================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Israel timezone utilities
const ISRAEL_TIMEZONE = 'Asia/Jerusalem';

const formatDateIsrael = (date: Date) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const getCurrentDateIsrael = () => {
  return new Date(new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()) + 'T00:00:00');
};

const getDayNameHebrew = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date);
};

const generateBookingUrl = (dateStr: string) => {
  const baseUrl = 'https://mytor.co.il/home.php';
  const params = new URLSearchParams({
    i: 'cmFtZWwzMw==',  // ramel33 encoded
    s: 'MjY1',         // 265
    mm: 'y',
    lang: 'he',
    datef: dateStr,
    signup: 'הצג'      // Hebrew for "Show"
  });
  
  return `${baseUrl}?${params.toString()}`;
};

// Create reusable email transporter with connection pooling
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    pool: true,
    maxConnections: 10,
    maxMessages: 100,
    rateDelta: 1000,  // 1 second
    rateLimit: 5      // max 5 emails per second
  });
};

interface AppointmentResult {
  date: string;
  available: boolean;
  times: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📧 EMAIL PROCESSOR: Starting notification processing');
    const processingStart = Date.now();

    // Get appointments data from request or fetch from cache
    let appointments: AppointmentResult[] = [];
    
    if (req.body && req.body.appointments) {
      appointments = req.body.appointments;
      console.log(`📧 Using provided appointments: ${appointments.length}`);
    } else {
      // Fallback: fetch from cache
      const { data: cacheData } = await supabase
        .from('cache')
        .select('value')
        .eq('key', 'auto-check-minimal')
        .single();
      
      if (cacheData?.value?.preview) {
        appointments = cacheData.value.preview;
        console.log(`📧 Using cached appointments: ${appointments.length}`);
      }
    }

    if (appointments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No appointments to process',
        emailsSent: 0
      });
    }

    // Fetch active notifications that need processing
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`);
    }

    if (!notifications || notifications.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active subscriptions found',
        emailsSent: 0
      });
    }

    console.log(`📧 Processing ${notifications.length} active subscriptions`);

    // Create email transporter
    const transporter = createEmailTransporter();
    let emailsSent = 0;
    let emailsSkipped = 0;

    // Process notifications in optimized batches
    const BATCH_SIZE = 3; // Smaller batches for better reliability
    
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      const emailPromises: Promise<any>[] = [];

      for (const notification of batch) {
        try {
          // Find matching appointments for this notification
          let matchingResults: AppointmentResult[] = [];

          if (notification.criteria_type === 'single' && notification.criteria?.date) {
            // Single date matching
            matchingResults = appointments.filter(apt => 
              apt.date === notification.criteria.date && apt.available === true
            );
          } else if (notification.criteria_type === 'range' && notification.criteria?.start && notification.criteria?.end) {
            // Range matching - collect ALL available appointments in range
            matchingResults = appointments.filter(apt => 
              apt.available === true && 
              apt.date >= notification.criteria.start && 
              apt.date <= notification.criteria.end
            );
          }

          if (matchingResults.length === 0) {
            console.log(`📧 No matching appointments for ${notification.email}`);
            continue;
          }

          // Check notification constraints
          const currentNotifCount = notification.notification_count || 0;
          const now = new Date();
          const lastNotified = notification.last_notified ? new Date(notification.last_notified) : null;
          const timeSinceLastNotification = lastNotified ? now.getTime() - lastNotified.getTime() : Infinity;

          // Skip if max emails reached
          if (currentNotifCount >= 6) {
            await supabase
              .from('notifications')
              .update({ status: 'max_reached', updated_at: new Date().toISOString() })
              .eq('id', notification.id);
            console.log(`📧 Max emails reached for ${notification.email}`);
            emailsSkipped++;
            continue;
          }

          // Skip if too soon since last notification (10 minutes minimum)
          if (timeSinceLastNotification < 10 * 60 * 1000) {
            console.log(`📧 Too soon for ${notification.email} (${Math.round(timeSinceLastNotification / 60000)}m ago)`);
            emailsSkipped++;
            continue;
          }

          // Generate personalized email content
          const notifCount = currentNotifCount;
          let subject = 'תור פנוי במספרת רם-אל!';

          // Smart subject line based on notification count
          if (notifCount === 0) {
            subject = `תור פנוי נמצא! 🎉`;
          } else if (notifCount === 1) {
            subject = `תזכורת: תור פנוי עדיין זמין`;
          } else if (notifCount >= 2) {
            subject = `פעולה נדרשת: תורים פנויים עלולים להתמלא בקרוב`;
          }

          if (notifCount >= 3) {
            subject = `🚨 ${subject}`;
          }

          const unsubscribeUrl = `https://tor-ramel.netlify.app/unsubscribe?token=${notification.unsubscribe_token}`;

          // Generate appointment cards for email
          const appointmentCards = matchingResults.map(appointment => `
            <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background-color: #f9fafb;">
              <div style="text-align: center; margin-bottom: 12px;">
                <div style="background-color: #f3f4f6; border-radius: 16px; padding: 8px 16px; font-weight: bold; font-size: 18px; display: inline-block; margin-bottom: 8px; color: #111827;">
                  ${appointment.date}
                </div>
                <div style="font-size: 16px; color: #4b5563;">${getDayNameHebrew(appointment.date)}</div>
              </div>
              
              <div style="display: flex; align-items: center; justify-content: center; margin: 12px 0;">
                <span style="color: #10b981; font-weight: 500;">תורים זמינים: ${appointment.times.length}</span>
                <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #10b981; margin-right: 8px;"></div>
              </div>
              
              <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 16px 0;">
                ${appointment.times.map(time => `
                  <span style="background-color: #e5e7eb; color: #111827; border-radius: 16px; padding: 6px 12px; font-size: 14px; font-weight: 500;">${time}</span>
                `).join('')}
              </div>
              
              <div style="text-align: center;">
                <a href="${generateBookingUrl(appointment.date)}" style="display: inline-block; background-color: #000000; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; margin-top: 8px;" target="_blank">
                  קבע תור ל-${appointment.date}
                </a>
              </div>
            </div>
          `).join('');

          // Mobile-optimized email HTML
          const emailHtml = `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>תורים פנויים במספרת רם-אל</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; width: 100%; background-color: #f9fafb; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .card { background-color: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .header { text-align: center; margin-bottom: 24px; }
                .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 24px; }
                .urgency-indicator { text-align: center; margin: 16px 0; }
                .urgency-bar { height: 6px; border-radius: 3px; background-color: #fee2e2; position: relative; overflow: hidden; }
                .urgency-progress { height: 100%; background-color: #ef4444; width: ${Math.min((notifCount + 1) * 16, 90)}%; transition: width 0.3s ease; }
                .unsubscribe { text-align: center; margin-top: 24px; font-size: 12px; color: #6b7280; }
                .unsubscribe a { color: #6b7280; text-decoration: underline; }
                .email-count { background-color: #fef3c7; color: #92400e; padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-bottom: 16px; text-align: center; }
                @media (max-width: 600px) {
                  .container { padding: 10px; }
                  .card { padding: 16px; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="header">
                    <h1 style="margin: 0; color: #111827; font-size: 24px;">תורים פנויים במספרת רם-אל!</h1>
                    <p style="margin: 8px 0 0; color: #6b7280; font-size: 16px;">
                      ${matchingResults.length === 1 ? 'מצאנו תור זמין בתאריך שביקשת' : `מצאנו ${matchingResults.length} תאריכים זמינים בטווח שביקשת`}
                    </p>
                  </div>
                  
                  ${notifCount > 0 ? `
                  <div class="email-count">
                    התראה מספר ${notifCount + 1} מתוך 6 | נותרו ${6 - notifCount - 1} התראות
                  </div>` : ''}
                  
                  ${notifCount > 0 ? `
                  <div class="urgency-indicator">
                    <p style="margin: 4px 0 8px; font-size: 14px; color: #b91c1c;">רמת דחיפות</p>
                    <div class="urgency-bar">
                      <div class="urgency-progress"></div>
                    </div>
                    ${notifCount >= 2 ? `<p style="margin: 8px 0 0; font-size: 13px; color: #b91c1c;">⚠️ אזהרה: התורים עלולים להתמלא במהרה</p>` : ''}
                  </div>` : ''}
                  
                  <div style="margin: 24px 0;">
                    ${appointmentCards}
                  </div>
                  
                  <div class="unsubscribe">
                    <p><a href="${unsubscribeUrl}">הסר הרשמה מההתראות</a></p>
                  </div>
                </div>
                
                <div class="footer">
                  <p>התראה זו נשלחה באופן אוטומטי ממערכת בדיקת תורים למספרת רם-אל.</p>
                  <p>אין להשיב למייל זה.</p>
                </div>
              </div>
            </body>
          </html>
          `;

          // Plain text version
          const plainText = `תורים פנויים במספרת רם-אל!

${matchingResults.map(apt => `
תאריך: ${apt.date} (${getDayNameHebrew(apt.date)})
זמנים זמינים: ${apt.times.join(', ')}
קישור לקביעת תור: ${generateBookingUrl(apt.date)}
`).join('\n')}

להסרה מההתראות: ${unsubscribeUrl}

התראה מספר ${notifCount + 1} מתוך 6`;

          const mailOptions = {
            from: `"תורים לרם-אל" <${process.env.EMAIL_SENDER}>`,
            to: notification.email,
            subject: subject,
            text: plainText,
            html: emailHtml
          };

          // Add to batch promises
          emailPromises.push(
            transporter.sendMail(mailOptions)
              .then(async () => {
                // Update notification record
                await supabase
                  .from('notifications')
                  .update({
                    last_notified: new Date().toISOString(),
                    notification_count: (notification.notification_count || 0) + 1,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', notification.id);
                
                console.log(`📧 ✅ Sent email #${(notification.notification_count || 0) + 1} to ${notification.email}`);
                emailsSent++;
              })
              .catch(error => {
                console.error(`📧 ❌ Failed to send email to ${notification.email}:`, error.message);
                throw error;
              })
          );

        } catch (error) {
          console.error(`📧 Error processing notification for ${notification.email}:`, error);
          emailsSkipped++;
        }
      }

      // Execute batch of emails
      if (emailPromises.length > 0) {
        await Promise.allSettled(emailPromises);
        
        // Rate limiting: small delay between batches
        if (i + BATCH_SIZE < notifications.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    // Close email transporter
    transporter.close();

    const processingTime = Math.round((Date.now() - processingStart) / 1000);
    console.log(`📧 ✅ EMAIL PROCESSING COMPLETED in ${processingTime}s`);
    console.log(`📧 📊 Stats: ${emailsSent} sent, ${emailsSkipped} skipped`);

    return res.status(200).json({
      success: true,
      emailsSent,
      emailsSkipped,
      totalProcessed: notifications.length,
      processingTime,
      message: `Successfully processed ${notifications.length} subscriptions, sent ${emailsSent} emails`
    });

  } catch (error) {
    console.error('📧 ❌ EMAIL PROCESSING FAILED:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      emailsSent: 0
    });
  }
} 
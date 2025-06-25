// Enhanced & Modern Email Templates for Tor-RamEl - TypeScript Version
// Focus: Minimal design, premium UX, perfect responsiveness, and consistent branding
// Features: Glass morphism effects, micro-animations, better typography, and enhanced accessibility

// =================================================================================
// TYPE DEFINITIONS
// =================================================================================

interface AppointmentResult {
  date: string;
  available: boolean;
  times: string[];
}

interface EmailTemplateParams {
  matchingResults: AppointmentResult[];
  notificationCount: number;
  unsubscribeUrl: string;
  userEmail: string;
  criteriaType: 'single' | 'range';
  responseTokens?: { [key: string]: string };
  notificationId?: string;
}

// =================================================================================
// HELPER FUNCTIONS
// =================================================================================

/**
 * Gets the Hebrew day name from a date string (e.g., '2024-12-25').
 */
const getDayNameHebrew = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long'
  }).format(date);
};

/**
 * Formats a date string into a full Hebrew date.
 */
const formatHebrewDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

/**
 * Generates the direct booking URL for a specific date.
 */
const generateBookingUrl = (dateStr: string): string => {
  const baseUrl = 'https://mytor.co.il/home.php';
  const params = new URLSearchParams({
    i: 'cmFtZWwzMw==',
    s: 'MjY1',
    mm: 'y',
    lang: 'he',
    datef: dateStr,
    signup: 'הצג'
  });
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Generate modern CSS styles for the email template
 */
const generateEmailStyles = (): string => `
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Assistant:wght@400;500;600;700&display=swap');

    * {
      -webkit-box-sizing: border-box;
      -moz-box-sizing: border-box;
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Inter', 'Assistant', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      line-height: 1.6;
      color: #1a1a1a;
    }

    .email-container {
      max-width: 680px;
      margin: 0 auto;
      padding: 24px;
    }

    .email-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 
        0 32px 64px -8px rgba(0, 0, 0, 0.08),
        0 16px 32px -4px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
      overflow: hidden;
      position: relative;
    }

    .email-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
      background-size: 300% 100%;
    }

    .header {
      padding: 48px 40px 32px;
      text-align: center;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      position: relative;
    }

    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 2px;
    }

    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0 0 8px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-subtitle {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: #64748b;
      letter-spacing: 0.5px;
    }

    .content {
      padding: 40px;
    }

    .content-title {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      text-align: center;
      margin: 0 0 12px 0;
      letter-spacing: -0.3px;
    }

    .content-subtitle {
      font-size: 16px;
      color: #64748b;
      text-align: center;
      margin: 0 0 40px 0;
      font-weight: 400;
      line-height: 1.5;
    }

    .appointment-grid {
      display: grid;
      gap: 24px;
      margin-bottom: 32px;
    }

    .appointment-item {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      padding: 32px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .appointment-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
    }

    .appointment-item:hover::before {
      transform: scaleX(1);
    }

    .date-section {
      text-align: center;
      margin-bottom: 28px;
    }

    .date-primary {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
      letter-spacing: -0.2px;
    }

    .date-secondary {
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .times-container {
      margin-bottom: 28px;
    }

    .times-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 16px 0;
      text-align: center;
      letter-spacing: 0.3px;
    }

    .times-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .time-badge {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      color: #374151;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      padding: 12px 8px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
      letter-spacing: 0.3px;
    }

    .time-badge:hover {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-color: #3b82f6;
      transform: translateY(-1px);
    }

    .primary-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: #ffffff;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      padding: 16px 32px;
      border-radius: 16px;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 
        0 4px 12px rgba(59, 130, 246, 0.3),
        0 2px 4px rgba(59, 130, 246, 0.2);
      border: none;
      letter-spacing: 0.3px;
      position: relative;
      overflow: hidden;
    }

    .primary-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s ease;
    }

    .primary-button:hover::before {
      left: 100%;
    }

    .primary-button:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 24px rgba(59, 130, 246, 0.4),
        0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .response-section {
      margin-top: 32px;
      padding: 24px;
      background: rgba(248, 250, 252, 0.8);
      border-radius: 16px;
      border: 1px solid rgba(226, 232, 240, 0.5);
    }

    .response-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      text-align: center;
      margin: 0 0 20px 0;
      letter-spacing: 0.2px;
    }

    .response-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .response-button {
      display: inline-block;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 14px 20px;
      border-radius: 12px;
      text-align: center;
      transition: all 0.2s ease;
      letter-spacing: 0.2px;
      border: 2px solid transparent;
    }

    .response-button.success {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    }

    .response-button.success:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    }

    .response-button.neutral {
      background: rgba(248, 250, 252, 0.8);
      color: #64748b;
      border-color: #e2e8f0;
    }

    .response-button.neutral:hover {
      background: rgba(241, 245, 249, 0.9);
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }

    .footer {
      padding: 32px 40px;
      text-align: center;
      background: rgba(248, 250, 252, 0.5);
      border-top: 1px solid rgba(226, 232, 240, 0.3);
    }

    .footer-email {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    .footer-links {
      margin: 0 0 20px 0;
    }

    .footer-link {
      color: #64748b;
        text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      margin: 0 12px;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: #3b82f6;
        text-decoration: underline;
    }

    .footer-copyright {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      font-weight: 400;
      letter-spacing: 0.3px;
    }

    .button-center {
      text-align: center;
      margin-top: 24px;
    }

    /* Dark Mode Styles */
    @media (prefers-color-scheme: dark) {
      body {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      }

      .email-card {
        background: rgba(15, 23, 42, 0.95);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 
          0 32px 64px -8px rgba(0, 0, 0, 0.3),
          0 16px 32px -4px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }

      .header {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
      }

      .content-title { color: #f1f5f9; }
      .content-subtitle { color: #94a3b8; }
      .header-subtitle { color: #94a3b8; }

      .appointment-item {
        background: rgba(30, 41, 59, 0.7);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .date-primary { color: #f1f5f9; }
      .date-secondary { color: #94a3b8; }
      .times-label { color: #e2e8f0; }

      .time-badge {
        background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
        color: #e2e8f0;
        border-color: #475569;
      }

      .time-badge:hover {
        background: linear-gradient(135deg, #475569 0%, #334155 100%);
        border-color: #64748b;
      }

      .response-section {
        background: rgba(30, 41, 59, 0.5);
        border-color: rgba(71, 85, 105, 0.3);
      }

      .response-title { color: #e2e8f0; }

      .response-button.neutral {
        background: rgba(51, 65, 85, 0.8);
        color: #cbd5e1;
        border-color: #475569;
      }

      .response-button.neutral:hover {
        background: rgba(71, 85, 105, 0.9);
        border-color: #64748b;
      }

      .footer {
        background: rgba(15, 23, 42, 0.5);
        border-color: rgba(71, 85, 105, 0.2);
      }

      .footer-email { color: #94a3b8; }
      .footer-link { color: #94a3b8; }
      .footer-link:hover { color: #60a5fa; }
      .footer-copyright { color: #64748b; }
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
      .email-container { 
        padding: 16px; 
      }
      
      .content { 
        padding: 32px 24px; 
      }
      
      .header { 
        padding: 40px 24px 24px; 
      }
      
      .footer { 
        padding: 24px; 
      }
      
      .appointment-item { 
        padding: 24px 20px; 
      }
      
      .times-grid { 
        grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
        gap: 8px;
      }
      
      .response-buttons { 
        grid-template-columns: 1fr;
        gap: 8px;
      }
      
      .primary-button {
        padding: 14px 24px;
        font-size: 15px;
      }
      
      .logo { 
        font-size: 24px; 
      }
      
      .content-title { 
        font-size: 22px; 
      }
      
      .footer-link { 
        display: block;
        margin: 8px 0;
      }
    }

    /* High-end animation for supported clients */
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .appointment-item {
      animation: slideInUp 0.6s ease-out;
    }

    .appointment-item:nth-child(2) { animation-delay: 0.1s; }
    .appointment-item:nth-child(3) { animation-delay: 0.2s; }
    .appointment-item:nth-child(4) { animation-delay: 0.3s; }
  </style>
`;

// =================================================================================
// MAIN EMAIL GENERATION FUNCTION
// =================================================================================

/**
 * Generates a premium, modern, and responsive HTML email template.
 */
export const generateModernEmailTemplate = ({
  matchingResults,
  notificationCount,
  unsubscribeUrl,
  userEmail,
  responseTokens = {},
  notificationId,
}: EmailTemplateParams): { subject: string; html: string; text: string } => {
  const isMultipleDates = matchingResults.length > 1;
  const dayName = getDayNameHebrew(matchingResults[0].date);
  let subject = '';
  if (notificationCount === 0) {
    subject = isMultipleDates ?
      `🎯 Tor-RamEl | נמצאו ${matchingResults.length} תורים פנויים!` :
      `✨ Tor-RamEl | תור פנוי ביום ${dayName}!`;
  } else {
    subject = `🔔 Tor-RamEl | התורים שחיפשת עדיין זמינים`;
  }
  const plainText = `
Tor-RamEl - התראה על תורים פנויים

שלום,

מצאנו תורים פנויים עבורך במספרת רם-אל:
${matchingResults.map(apt => `
📅 ${formatHebrewDate(apt.date)} (יום ${getDayNameHebrew(apt.date)})
⏰ שעות זמינות: ${apt.times.join(', ')}
🔗 קישור לקביעת תור: ${generateBookingUrl(apt.date)}
`).join('\n')}

ניהול התראות: https://tor-ramel.netlify.app/manage
נשלח אל: ${userEmail}
להסרה מההתראות: ${unsubscribeUrl}
  `.trim();
  const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  ${generateEmailStyles()}
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <h1 class="logo">Tor-RamEl</h1>
        <p class="header-subtitle">מערכת התראות חכמה לתורים</p>
      </div>
      <div class="content">
        <h2 class="content-title">
          ${notificationCount === 0 ? 
            (isMultipleDates ? `נמצאו ${matchingResults.length} תורים פנויים! 🎉` : 'נמצא תור פנוי עבורך! ✨') :
            'התורים שחיפשת עדיין זמינים 🔔'
          }
        </h2>
        <p class="content-subtitle">
          ${notificationCount === 0 ? 'הנה התורים הפנויים שמצאנו עבורך במספרת רם-אל' : 'מהרו לתפוס את התורים לפני שנגמרים'}
        </p>
        <div class="appointment-grid">
          ${matchingResults.map(appointment => {
            const responseToken = responseTokens[appointment.date];
            return `
            <div class="appointment-item">
              <div class="date-section">
                <div class="date-primary">${formatHebrewDate(appointment.date)}</div>
                <div class="date-secondary">יום ${getDayNameHebrew(appointment.date)}</div>
              </div>
              <div class="times-container">
                <div class="times-label">שעות פנויות</div>
                <div class="times-grid">
                  ${appointment.times.map(time => `<div class="time-badge">${time}</div>`).join('')}
                </div>
              </div>
              <div class="button-center">
                <a href="${generateBookingUrl(appointment.date)}" target="_blank" class="primary-button">
                  📅 לקביעת תור מיידית
                </a>
              </div>
              ${responseToken ? `
              <div class="response-section">
                <div class="response-title">האם התור הזה מתאים לך?</div>
                <div class="response-buttons">
                  <a href="https://tor-ramel.netlify.app/appointment-response?token=${responseToken}&action=taken" class="response-button success">
                    ✅ כן, לוקח!
                  </a>
                  <a href="https://tor-ramel.netlify.app/appointment-response?token=${responseToken}&action=not_wanted" class="response-button neutral">
                    ❌ לא מתאים
                  </a>
                </div>
              </div>
              ` : ''}
            </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="footer">
        <p class="footer-email">נשלח אל ${userEmail}</p>
        <div class="footer-links">
          <a href="https://tor-ramel.netlify.app/manage" target="_blank" class="footer-link">🔧 ניהול התראות</a>
          <a href="${unsubscribeUrl}" target="_blank" class="footer-link">📭 הסרת הרשמה</a>
        </div>
        <p class="footer-copyright">
          Tor-RamEl Automation &copy; ${new Date().getFullYear()} | נבנה באהבה עבור לקוחות רם-אל
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  return { subject, html: emailHtml, text: plainText };
};

// =================================================================================
// ADDITIONAL EMAIL TEMPLATES FOR DIFFERENT SCENARIOS
// =================================================================================

/**
 * Generates a confirmation email template
 */
export const generateConfirmationEmailTemplate = (params: {
  userEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } => {
  const subject = '✅ Tor-RamEl | אישור הרשמה';
  const plainText = `
✅ אישור הרשמה

שלום,

נרשמת בהצלחה למערכת ההתראות של מספרת רם-אל!

${params.appointmentDate ? `תאריך: ${formatHebrewDate(params.appointmentDate)}` : ''}
${params.appointmentTime ? `שעה: ${params.appointmentTime}` : ''}

תוכל לנהל או לבטל את ההתראות שלך בכל עת.
להסרה: ${params.unsubscribeUrl}
  `.trim();
  const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  ${generateEmailStyles()}
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <h1 class="logo">Tor-RamEl</h1>
        <p class="header-subtitle">הרשמתך התקבלה בהצלחה</p>
      </div>
      <div class="content">
        <h2 class="content-title">✅ נרשמת בהצלחה!</h2>
        <p class="content-subtitle">המערכת תתחיל לחפש עבורך תורים פנויים.</p>
        <div class="appointment-item">
          <div class="date-section">
            <div class="date-primary">${params.userEmail}</div>
            <div class="date-secondary">${params.appointmentDate ? `תאריך: ${formatHebrewDate(params.appointmentDate)}` : ''} ${params.appointmentTime ? `| שעה: ${params.appointmentTime}` : ''}</div>
          </div>
        </div>
        <div class="button-center">
          <a href="https://tor-ramel.netlify.app/manage" target="_blank" class="primary-button">
            🔧 ניהול ההתראות שלי
          </a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-email">${params.userEmail}</p>
        <div class="footer-links">
          <a href="https://tor-ramel.netlify.app/manage" target="_blank" class="footer-link">🔧 ניהול התראות</a>
          <a href="${params.unsubscribeUrl}" target="_blank" class="footer-link">📭 הסרת הרשמה</a>
        </div>
        <p class="footer-copyright">
          Tor-RamEl Automation &copy; ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  return { subject, html: emailHtml, text: plainText };
};

/**
 * Generates a reminder email template
 */
export const generateReminderEmailTemplate = (params: {
  userEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  hoursUntilAppointment: number;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } => {
  
  const subject = `⏰ Tor-RamEl | תזכורת: התור שלכם בעוד ${params.hoursUntilAppointment} שעות`;
  
  const plainText = `
⏰ תזכורת חשובה

שלום,

זוהי תזכורת לתור שלכם:

📅 תאריך: ${formatHebrewDate(params.appointmentDate)}
⏰ שעה: ${params.appointmentTime}
🏢 מיקום: מספרת רם-אל
⏳ בעוד: ${params.hoursUntilAppointment} שעות

אל תשכחו להגיע בזמן!

תודה,
צוות Tor-RamEl

הסרה מההתראות: ${params.unsubscribeUrl}
  `.trim();

  const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  ${generateEmailStyles()}
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <h1 class="logo">Tor-RamEl</h1>
        <p class="header-subtitle">תזכורת לתור</p>
      </div>
      
      <div class="content">
        <h2 class="content-title">תזכורת: התור שלכם מתקרב! ⏰</h2>
        <p class="content-subtitle">בעוד ${params.hoursUntilAppointment} שעות</p>
        
        <div class="appointment-item">
          <div class="date-section">
            <div class="date-primary">${formatHebrewDate(params.appointmentDate)}</div>
            <div class="date-secondary">יום ${getDayNameHebrew(params.appointmentDate)}</div>
          </div>
          
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; border-radius: 16px; font-size: 18px; font-weight: 600;">
              ⏰ ${params.appointmentTime}
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; margin-top: 24px;">
            <div style="font-size: 16px; font-weight: 600; color: #d97706; margin-bottom: 8px;">
              ⏳ בעוד ${params.hoursUntilAppointment} שעות
            </div>
            <div style="font-size: 14px; color: #92400e;">
              אל תשכחו להגיע בזמן למספרת רם-אל!
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p class="footer-email">נשלח אל ${params.userEmail}</p>
        <div class="footer-links">
          <a href="${params.unsubscribeUrl}" target="_blank" class="footer-link">
            📭 הסרת הרשמה
          </a>
        </div>
        <p class="footer-copyright">
          Tor-RamEl Automation &copy; ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html: emailHtml, text: plainText };
};

/**
 * Generates a no appointments found email template
 */
export const generateNoAppointmentsEmailTemplate = (params: {
  userEmail: string;
  searchCriteria: string;
  unsubscribeUrl: string;
  manageUrl: string;
}): { subject: string; html: string; text: string } => {
  
  const subject = '🔍 Tor-RamEl | לא נמצאו תורים פנויים כרגע';
  
  const plainText = `
🔍 עדכון חיפוש תורים

שלום,

בדקנו עבורכם ולא מצאנו תורים פנויים שמתאימים לקריטריונים שלכם כרגע.

🎯 הקריטריונים שלכם: ${params.searchCriteria}

אל תדאגו! המערכת תמשיך לחפש עבורכם ותעדכן אתכם ברגע שיהיו תורים זמינים.

💡 טיפים:
- נסו להרחיב את טווח התאריכים
- שקלו שעות נוספות ביום
- בדקו אם יש גמישות בימי השבוע

ניהול הקריטריונים: ${params.manageUrl}

תודה על הסבלנות,
צוות Tor-RamEl

הסרה מההתראות: ${params.unsubscribeUrl}
  `.trim();

  const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  ${generateEmailStyles()}
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <h1 class="logo">Tor-RamEl</h1>
        <p class="header-subtitle">עדכון חיפוש תורים</p>
      </div>
      
      <div class="content">
        <h2 class="content-title">לא נמצאו תורים כרגע 🔍</h2>
        <p class="content-subtitle">אבל אנחנו ממשיכים לחפש עבורכם!</p>
        
        <div style="text-align: center; padding: 32px; background: rgba(59, 130, 246, 0.1); border-radius: 16px; margin: 24px 0;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
          <div style="font-size: 18px; font-weight: 600; color: #1e40af; margin-bottom: 12px;">
            המערכת ממשיכה לעבוד
          </div>
          <div style="font-size: 14px; color: #1e40af; line-height: 1.5;">
            נודיע לכם מיד כשנמצא תור שמתאים לקריטריונים שלכם
          </div>
        </div>
        
        <div style="background: rgba(245, 158, 11, 0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <div style="font-size: 16px; font-weight: 600; color: #d97706; margin-bottom: 16px; text-align: center;">
            💡 טיפים לשיפור הסיכויים
          </div>
          <div style="font-size: 14px; color: #92400e; line-height: 1.6;">
            • נסו להרחיב את טווח התאריכים<br>
            • שקלו שעות נוספות ביום<br>
            • בדקו אם יש גמישות בימי השבוע<br>
            • לפעמים תורים מתפנים ברגע האחרון
          </div>
        </div>
        
        <div class="button-center">
          <a href="${params.manageUrl}" target="_blank" class="primary-button">
            ⚙️ עדכון קריטריוני חיפוש
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-email">נשלח אל ${params.userEmail}</p>
        <div class="footer-links">
          <a href="${params.manageUrl}" target="_blank" class="footer-link">
            🔧 ניהול התראות
          </a>
          <a href="${params.unsubscribeUrl}" target="_blank" class="footer-link">
            📭 הסרת הרשמה
          </a>
        </div>
        <p class="footer-copyright">
          Tor-RamEl Automation &copy; ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html: emailHtml, text: plainText };
};

/**
 * Generates a welcome email template for new users
 */
export const generateWelcomeEmailTemplate = (params: {
  userEmail: string;
  unsubscribeUrl: string;
  manageUrl: string;
}): { subject: string; html: string; text: string } => {
  
  const subject = '🎉 Tor-RamEl | ברוכים הבאים למערכת ההתראות החכמה!';
  
  const plainText = `
🎉 ברוכים הבאים ל-Tor-RamEl!

שלום וברוכים הבאים,

תודה שהצטרפתם למערכת ההתראות החכמה שלנו!

מה קורה עכשיו?
✅ המערכת תתחיל לחפש תורים פנויים עבורכם
🔔 תקבלו התראה מיד כשנמצא תור מתאים
📱 תוכלו לנהל את ההתראות בכל זמן

יתרונות המערכת:
• חיפוש אוטומטי 24/7
• התראות מיידיות
• ממשק נוח וידידותי
• חינם לחלוטין

ניהול התראות: ${params.manageUrl}

בהצלחה במציאת התור המושלם!
צוות Tor-RamEl

הסרה מההתראות: ${params.unsubscribeUrl}
  `.trim();

  const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  ${generateEmailStyles()}
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <h1 class="logo">Tor-RamEl</h1>
        <p class="header-subtitle">ברוכים הבאים למערכת החכמה!</p>
      </div>
      
      <div class="content">
        <h2 class="content-title">ברוכים הבאים! 🎉</h2>
        <p class="content-subtitle">המערכת כבר מתחילה לחפש תורים עבורכם</p>
        
        <div style="text-align: center; padding: 32px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 163, 74, 0.1) 100%); border-radius: 16px; margin: 24px 0;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
          <div style="font-size: 18px; font-weight: 600; color: #16a34a; margin-bottom: 12px;">
            המערכת פועלת עבורכם!
          </div>
          <div style="font-size: 14px; color: #059669; line-height: 1.5;">
            נחפש תורים פנויים 24/7 ונודיע לכם מיד כשנמצא משהו מתאים
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin: 32px 0;">
          <div style="padding: 20px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
            <div style="font-size: 16px; font-weight: 600; color: #1e40af; margin-bottom: 4px;">חיפוש אוטומטי</div>
            <div style="font-size: 12px; color: #1e40af;">המערכת עובדת 24/7</div>
          </div>
          
          <div style="padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
            <div style="font-size: 16px; font-weight: 600; color: #d97706; margin-bottom: 4px;">התראות מיידיות</div>
            <div style="font-size: 12px; color: #d97706;">תקבלו הודעה מיד</div>
          </div>
          
          <div style="padding: 20px; background: rgba(168, 85, 247, 0.1); border-radius: 12px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 8px;">⚙️</div>
            <div style="font-size: 16px; font-weight: 600; color: #7c3aed; margin-bottom: 4px;">ניהול קל</div>
            <div style="font-size: 12px; color: #7c3aed;">שלטו על ההתראות</div>
          </div>
        </div>
        
        <div class="button-center">
          <a href="${params.manageUrl}" target="_blank" class="primary-button">
            🔧 ניהול ההתראות שלי
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-email">נשלח אל ${params.userEmail}</p>
        <div class="footer-links">
          <a href="${params.manageUrl}" target="_blank" class="footer-link">
            🔧 ניהול התראות
          </a>
          <a href="${params.unsubscribeUrl}" target="_blank" class="footer-link">
            📭 הסרת הרשמה
          </a>
        </div>
        <p class="footer-copyright">
          Tor-RamEl Automation &copy; ${new Date().getFullYear()} | תודה שבחרתם בנו!
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html: emailHtml, text: plainText };
};

/**
 * Generates a modern unsubscribe confirmation email template
 */
export const generateUnsubscribeEmailTemplate = (params: {
  userEmail: string;
  criteriaText?: string;
  unsubscribeDate?: string;
  manageUrl?: string;
}): { subject: string; html: string; text: string } => {
  const subject = '🚫 Tor-RamEl | ההרשמה בוטלה בהצלחה';
  const dateStr = params.unsubscribeDate || new Date().toLocaleDateString('he-IL');
  const plainText = `
🚫 Tor-RamEl - ההרשמה בוטלה

שלום,

ההרשמה שלך להתראות במספרת רם-אל בוטלה בהצלחה.

${params.criteriaText ? `פרטי הרשמה: ${params.criteriaText}\n` : ''}
כתובת מייל: ${params.userEmail}
בוטל בתאריך: ${dateStr}

תוכל להירשם שוב בכל עת באתר.
${params.manageUrl ? `ניהול התראות: ${params.manageUrl}` : ''}

תודה,
צוות Tor-RamEl
  `.trim();

  const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  ${generateEmailStyles()}
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="header">
        <h1 class="logo">Tor-RamEl</h1>
        <p class="header-subtitle">ההרשמה בוטלה בהצלחה</p>
      </div>
      <div class="content">
        <h2 class="content-title">🚫 ההרשמה בוטלה בהצלחה!</h2>
        <p class="content-subtitle">לא תקבל עוד התראות על הכתובת הזו.</p>
        <div class="appointment-item">
          <div class="date-section">
            <div class="date-primary">${params.userEmail}</div>
            <div class="date-secondary">${params.criteriaText || ''}</div>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%); color: white; padding: 16px 32px; border-radius: 16px; font-size: 18px; font-weight: 600;">
              🚫 בוטל בתאריך: ${dateStr}
            </div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://tor-ramel.netlify.app" target="_blank" class="primary-button">
            🔄 הירשם מחדש
          </a>
          ${params.manageUrl ? `<a href="${params.manageUrl}" target="_blank" class="primary-button" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); margin-right: 12px;">🔧 ניהול התראות</a>` : ''}
        </div>
      </div>
      <div class="footer">
        <p class="footer-email">${params.userEmail}</p>
        <div class="footer-links">
          <a href="https://tor-ramel.netlify.app" target="_blank" class="footer-link">🔗 חזרה לאתר</a>
        </div>
        <p class="footer-copyright">
          Tor-RamEl Automation &copy; ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html: emailHtml, text: plainText };
};
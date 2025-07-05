// =================================================================================
// APPOINTMENT NOTIFICATION EMAIL TEMPLATE - SIMPLIFIED VERSION
// =================================================================================

interface AppointmentData {
  date: string;
  available: boolean;
  times: string[];
}

interface EmailOptions {
  appointments: AppointmentData[];
  notificationId: string;
  actionToken: string;
  baseUrl: string;
}

// Helper functions
const formatHebrewDate = (dateStr: string): string => {
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = hebrewMonths[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ב${month} ${year}`;
};

const getDayNameHebrew = (dateStr: string): string => {
  const hebrewDayNames = [
    'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
  ];
  
  const date = new Date(dateStr + 'T00:00:00');
  return hebrewDayNames[date.getDay()];
};

const generateBookingUrl = (dateStr: string): string => {
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

export function generateAppointmentNotificationEmail(options: EmailOptions): { subject: string; html: string; text: string } {
  const { appointments, notificationId, actionToken, baseUrl } = options;
  
  // Sort appointments by date
  const sortedAppointments = [...appointments].sort((a, b) => a.date.localeCompare(b.date));
  
  // Generate subject with count
  const totalSlots = sortedAppointments.reduce((sum, apt) => sum + apt.times.length, 0);
  const subject = `🎯 נמצאו ${totalSlots} תורים פנויים במספרת רם-אל!`;
  
  // Generate HTML content
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-content {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      font-size: 28px;
      margin: 0 0 10px 0;
    }
    .header p {
      color: #64748b;
      font-size: 16px;
      margin: 0;
    }
    .appointments-list {
      margin: 30px 0;
    }
    .appointment-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
    }
    .appointment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .appointment-date {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
    .appointment-day {
      font-size: 14px;
      color: #64748b;
    }
    .appointment-times {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
    }
    .time-slot {
      background-color: #e0f2fe;
      color: #0369a1;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
    }
    .book-button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    .book-button:hover {
      background-color: #1d4ed8;
    }
    .action-section {
      background-color: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
      text-align: center;
    }
    .action-section h2 {
      color: #92400e;
      font-size: 20px;
      margin: 0 0 15px 0;
    }
    .action-section p {
      color: #78350f;
      margin: 0 0 20px 0;
      font-size: 14px;
    }
    .action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .action-button {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.2s;
    }
    .continue-button {
      background-color: #10b981;
      color: white;
    }
    .continue-button:hover {
      background-color: #059669;
    }
    .stop-button {
      background-color: #ef4444;
      color: white;
    }
    .stop-button:hover {
      background-color: #dc2626;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
    }
    .footer a {
      color: #64748b;
      text-decoration: underline;
    }
    @media (max-width: 600px) {
      .container {
        padding: 10px;
      }
      .email-content {
        padding: 20px;
      }
      .appointment-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .action-buttons {
        flex-direction: column;
        width: 100%;
      }
      .action-button {
        width: 100%;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-content">
      <div class="header">
        <h1>🎉 נמצאו תורים פנויים!</h1>
        <p>מצאנו ${totalSlots} תורים זמינים במספרת רם-אל</p>
      </div>
      
      <div class="appointments-list">
        ${sortedAppointments.map(appointment => `
          <div class="appointment-card">
            <div class="appointment-header">
              <div>
                <div class="appointment-date">${formatHebrewDate(appointment.date)}</div>
                <div class="appointment-day">יום ${getDayNameHebrew(appointment.date)}</div>
              </div>
            </div>
            <div class="appointment-times">
              ${appointment.times.map(time => `
                <span class="time-slot">${time}</span>
              `).join('')}
            </div>
            <a href="${generateBookingUrl(appointment.date)}" class="book-button" target="_blank">
              🚀 קבע תור לתאריך זה
            </a>
          </div>
        `).join('')}
      </div>
      
      <div class="action-section">
        <h2>📌 מצאת תור מתאים?</h2>
        <p>אנא בחר אחת מהאפשרויות הבאות:</p>
        <div class="action-buttons">
          <a href="${baseUrl}/api/notification-action?token=${actionToken}&action=continue" 
             class="action-button continue-button">
            ✅ המשך לחפש
          </a>
          <a href="${baseUrl}/api/notification-action?token=${actionToken}&action=stop" 
             class="action-button stop-button">
            🛑 מצאתי תור, עצור התראות
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>
          אם אינך רואה את הכפתורים, העתק את הקישורים הבאים:
        </p>
        <p style="direction: ltr; text-align: left; font-size: 11px;">
          המשך חיפוש: ${baseUrl}/api/notification-action?token=${actionToken}&action=continue<br>
          עצור התראות: ${baseUrl}/api/notification-action?token=${actionToken}&action=stop
        </p>
        <p style="margin-top: 20px;">
          מערכת התראות אוטומטית למספרת רם-אל
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  // Generate plain text version
  const text = `
נמצאו תורים פנויים במספרת רם-אל!
=====================================

סה"כ נמצאו ${totalSlots} תורים זמינים:

${sortedAppointments.map(appointment => `
📅 ${formatHebrewDate(appointment.date)} - יום ${getDayNameHebrew(appointment.date)}
⏰ שעות זמינות: ${appointment.times.join(', ')}
🔗 לקביעת תור: ${generateBookingUrl(appointment.date)}
`).join('\n')}

=====================================
מצאת תור מתאים?

✅ המשך לחפש: ${baseUrl}/api/notification-action?token=${actionToken}&action=continue
🛑 מצאתי תור, עצור התראות: ${baseUrl}/api/notification-action?token=${actionToken}&action=stop

=====================================
מערכת התראות אוטומטית למספרת רם-אל
  `.trim();
  
  return { subject, html, text };
} 
// Utility functions
const formatHebrewDate = (dateStr: string): string => {
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = hebrewMonths[date.getMonth()];
  
  return `${day} ב${month}`;
};

const getDayNameHebrew = (dateStr: string): string => {
  const hebrewDayNames = [
    'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
  ];
  
  const date = new Date(dateStr + 'T00:00:00');
  return hebrewDayNames[date.getDay()];
};

// Modern minimal appointment notification email template
export const generateAppointmentNotificationEmail = (
  matchingResults: Array<{date: string, times: string[]}>,
  responseTokens: {[key: string]: string} | null,
  currentPhase: number,
  maxPhases: number,
  subscriberEmail: string
): { html: string; subject: string; text: string } => {
  
  // Count total appointments
  const totalAppointments = matchingResults.reduce((sum, result) => sum + result.times.length, 0);
  const totalDays = matchingResults.length;
  
  // Generate modern, friendly subject
  const phaseIndicator = maxPhases > 1 ? ` (${currentPhase}/${maxPhases})` : '';
  const subject = `🎯 Tor-RamEl - מצאנו ${totalAppointments} תורים!${phaseIndicator}`;
  
  const baseUrl = process.env.DEPLOY_URL || 'https://tor-ramel.netlify.app';
  
  const token = responseTokens && responseTokens.batch ? responseTokens.batch : null;
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>תורים פנויים נמצאו!</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #1a202c;
          background: #f7fafc;
          padding: 16px;
          direction: rtl;
        }
        
        .container {
          max-width: 480px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .logo {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .phase {
          background: rgba(255,255,255,0.2);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          margin-top: 8px;
          display: inline-block;
        }
        
        .body {
          padding: 20px;
        }
        
        .message {
          font-size: 16px;
          color: #2d3748;
          text-align: center;
          margin-bottom: 24px;
        }
        
        .appointments {
          margin-bottom: 24px;
        }
        
        .appointment {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }
        
        .date {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }
        
        .times {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .time {
          background: #3182ce;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .response {
          background: #f0fff4;
          border: 1px solid #9ae6b4;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .response-title {
          font-size: 16px;
          font-weight: 600;
          color: #22543d;
          margin-bottom: 8px;
        }
        
        .response-text {
          font-size: 14px;
          color: #2f855a;
          margin-bottom: 12px;
        }
        
        .buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        
        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          display: inline-block;
        }
        
        .btn-yes {
          background: #48bb78;
          color: white;
        }
        
        .btn-no {
          background: #ed8936;
          color: white;
        }
        
        .footer {
          background: #f7fafc;
          padding: 16px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
          font-size: 12px;
          color: #718096;
        }
        
        .footer-link {
          color: #3182ce;
          text-decoration: none;
          margin: 0 4px;
        }
        
        @media (max-width: 480px) {
          .container {
            margin: 8px;
            border-radius: 8px;
          }
          
          .buttons {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎯 Tor-RamEl</div>
          <div class="subtitle">מערכת התראות חכמה</div>
          ${currentPhase > 1 ? `<div class="phase">התראה ${currentPhase} מתוך ${maxPhases}</div>` : ''}
        </div>
        
        <div class="body">
          <div class="message">
            🎉 מצאנו ${totalAppointments} תורים פנויים${totalDays > 1 ? ` ב-${totalDays} ימים` : ''}!<br>
            <strong>מחכים לך ברם-אל</strong>
          </div>
          
          <div class="appointments">
            ${matchingResults.map(appointment => `
              <div class="appointment">
                <div class="date">
                  ${getDayNameHebrew(appointment.date)} ${formatHebrewDate(appointment.date)}
                </div>
                <div class="times">
                  ${appointment.times.map(time => `<div class="time">${time}</div>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="response">
            <div class="response-title">מה תחליט?</div>
            <div class="response-text">
              אם התורים מתאימים לך - לחץ "מצאתי!"<br>
              אם לא מתאים - לחץ "לא מתאים" ונמשיך לחפש
            </div>
            <div class="buttons">
              ${token ? `
                <a href="${baseUrl}/appointment-response?token=${token}&action=taken" class="btn btn-yes">
                  🎯 מצאתי!
                </a>
                <a href="${baseUrl}/appointment-response?token=${token}&action=not_wanted" class="btn btn-no">
                  😕 לא מתאים
                </a>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            <a href="${baseUrl}/unsubscribe?token=${encodeURIComponent(subscriberEmail)}" class="footer-link">📵 הפסק התראות</a>
            •
            <a href="${baseUrl}" class="footer-link">🏠 אתר ראשי</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🎯 Tor-RamEl - מצאנו תורים פנויים!

מחכים לך ברם-אל!

מצאנו ${totalAppointments} תורים פנויים${totalDays > 1 ? ` ב-${totalDays} ימים שונים` : ''}:

${matchingResults.map(appointment => `
📅 ${getDayNameHebrew(appointment.date)} ${formatHebrewDate(appointment.date)}
⏰ ${appointment.times.join(', ')}
`).join('')}

מה תחליט?
${token ? `
🎯 מצאתי! ${baseUrl}/appointment-response?token=${token}&action=taken
😕 לא מתאים: ${baseUrl}/appointment-response?token=${token}&action=not_wanted
` : ''}

📵 הפסק התראות: ${baseUrl}/unsubscribe?token=${encodeURIComponent(subscriberEmail)}
🏠 אתר ראשי: ${baseUrl}

צוות Tor-RamEl
  `.trim();

  return { html, subject, text };
}; 
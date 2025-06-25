// Welcome email template for new subscriptions
export const generateWelcomeEmailTemplate = ({
  userEmail,
  unsubscribeUrl,
  manageUrl
}: {
  userEmail: string;
  unsubscribeUrl: string;
  manageUrl: string;
}): { subject: string; html: string; text: string } => {
  
  const subject = '✅ ההרשמה ל-Tor-RamEl התקבלה בהצלחה!';
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ברוכים הבאים ל-Tor-RamEl</title>
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
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 24px 20px;
          text-align: center;
        }
        
        .icon {
          font-size: 32px;
          margin-bottom: 8px;
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
        
        .body {
          padding: 24px 20px;
        }
        
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
          text-align: center;
        }
        
        .message {
          font-size: 15px;
          color: #4a5568;
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        
        .info-box {
          background: #f0fff4;
          border: 1px solid #9ae6b4;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        
        .info-title {
          font-size: 16px;
          font-weight: 600;
          color: #22543d;
          margin-bottom: 8px;
        }
        
        .info-list {
          list-style: none;
          padding: 0;
        }
        
        .info-item {
          padding: 4px 0;
          color: #2f855a;
          font-size: 14px;
        }
        
        .buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin: 20px 0;
        }
        
        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          display: inline-block;
        }
        
        .btn-primary {
          background: #3182ce;
          color: white;
        }
        
        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
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
          <div class="icon">✅</div>
          <div class="logo">Tor-RamEl</div>
          <div class="subtitle">מערכת התראות חכמה</div>
        </div>
        
        <div class="body">
          <div class="greeting">ברוכים הבאים!</div>
          
          <div class="message">
            ההרשמה שלך התקבלה בהצלחה.<br>
            נתחיל לחפש תורים פנויים ברם-אל ונשלח לך התראה ברגע שנמצא משהו מתאים.
          </div>
          
          <div class="info-box">
            <div class="info-title">איך זה עובד?</div>
            <ul class="info-list">
              <li class="info-item">🔍 בודקים תורים פנויים כל 5 דקות</li>
              <li class="info-item">📧 שולחים התראה ברגע שנמצא תור</li>
              <li class="info-item">⏰ עד 6 התראות (3×10 דקות, 3×שעה)</li>
              <li class="info-item">🎯 תגיב "מצאתי!" כשמצאת תור מתאים</li>
            </ul>
          </div>
          
          <div class="buttons">
            <a href="https://tor-ramel.netlify.app" class="btn btn-primary">🏠 אתר ראשי</a>
            <a href="${manageUrl}" class="btn btn-secondary">⚙️ ניהול</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            <a href="${unsubscribeUrl}" class="footer-link">📵 הפסק התראות</a>
            •
            <a href="https://tor-ramel.netlify.app" class="footer-link">🏠 אתר ראשי</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
✅ ההרשמה ל-Tor-RamEl התקבלה בהצלחה!

ברוכים הבאים!

ההרשמה שלך התקבלה בהצלחה.
נתחיל לחפש תורים פנויים ברם-אל ונשלח לך התראה ברגע שנמצא משהו מתאים.

איך זה עובד?
🔍 בודקים תורים פנויים כל 5 דקות
📧 שולחים התראה ברגע שנמצא תור
⏰ עד 6 התראות (3×10 דקות, 3×שעה)
🎯 תגיב "מצאתי!" כשמצאת תור מתאים

🏠 אתר ראשי: https://tor-ramel.netlify.app
⚙️ ניהול התראות: ${manageUrl}

📵 הפסק התראות: ${unsubscribeUrl}

צוות Tor-RamEl
  `.trim();

  return { subject, html, text };
}; 
// Unsubscribe confirmation email template
export const generateUnsubscribeEmailTemplate = ({
  userEmail,
  resubscribeUrl
}: {
  userEmail: string;
  resubscribeUrl: string;
}): { subject: string; html: string; text: string } => {
  
  const subject = '📵 הפסקת התראות Tor-RamEl';
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>התראות הופסקו</title>
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
          background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
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
          text-align: center;
        }
        
        .message {
          font-size: 16px;
          color: #2d3748;
          margin-bottom: 16px;
        }
        
        .submessage {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 24px;
        }
        
        .info-box {
          background: #fef5e7;
          border: 1px solid #f6ad55;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        
        .info-text {
          font-size: 14px;
          color: #c05621;
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
          <div class="icon">📵</div>
          <div class="logo">Tor-RamEl</div>
          <div class="subtitle">מערכת התראות חכמה</div>
        </div>
        
        <div class="body">
          <div class="message">
            ההתראות הופסקו בהצלחה
          </div>
          
          <div class="submessage">
            לא תקבל יותר התראות על תורים פנויים ברם-אל.
          </div>
          
          <div class="info-box">
            <div class="info-text">
              💡 אם תרצה להירשם שוב בעתיד, תוכל לחזור לאתר ולהירשם מחדש בכל עת.
            </div>
          </div>
          
          <div class="buttons">
            <a href="https://tor-ramel.netlify.app" class="btn btn-primary">🏠 אתר ראשי</a>
            <a href="${resubscribeUrl}" class="btn btn-secondary">🔄 הירשם שוב</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            תודה שהשתמשת בשירות Tor-RamEl!
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
📵 הפסקת התראות Tor-RamEl

ההתראות הופסקו בהצלחה

לא תקבל יותר התראות על תורים פנויים ברם-אל.

💡 אם תרצה להירשם שוב בעתיד, תוכל לחזור לאתר ולהירשם מחדש בכל עת.

🏠 אתר ראשי: https://tor-ramel.netlify.app
🔄 הירשם שוב: ${resubscribeUrl}

תודה שהשתמשת בשירות Tor-RamEl!
  `.trim();

  return { subject, html, text };
}; 
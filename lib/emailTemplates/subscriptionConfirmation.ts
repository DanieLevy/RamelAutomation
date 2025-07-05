// =================================================================================
// SUBSCRIPTION CONFIRMATION EMAIL TEMPLATE
// =================================================================================

interface SubscriptionData {
  id: string;
  type: 'single' | 'range';
  targetDate?: string;
  dateStart?: string;
  dateEnd?: string;
  email: string;
  stopToken?: string;
}

interface EmailOptions {
  subscription: SubscriptionData;
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

export function generateSubscriptionConfirmationEmail(options: EmailOptions): { subject: string; html: string; text: string } {
  const { subscription, baseUrl } = options;
  
  const subject = '✅ אישור הרשמה להתראות - מספרת רם-אל';
  
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
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .header h1 {
      color: #10b981;
      font-size: 28px;
      margin: 0 0 10px 0;
    }
    .header p {
      color: #64748b;
      font-size: 16px;
      margin: 0;
    }
    .welcome-section {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .welcome-section h2 {
      color: #166534;
      font-size: 20px;
      margin: 0 0 10px 0;
    }
    .welcome-section p {
      color: #15803d;
      margin: 0;
    }
    .subscription-details {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 25px;
      margin: 25px 0;
    }
    .subscription-details h3 {
      color: #1e293b;
      font-size: 18px;
      margin: 0 0 15px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #64748b;
    }
    .detail-value {
      color: #1e293b;
      font-weight: 500;
    }
    .date-highlight {
      background-color: #dbeafe;
      color: #1e40af;
      padding: 4px 12px;
      border-radius: 4px;
      display: inline-block;
    }
    .how-it-works {
      margin: 30px 0;
    }
    .how-it-works h3 {
      color: #1e293b;
      font-size: 20px;
      margin: 0 0 20px 0;
      text-align: center;
    }
    .step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .step-number {
      background-color: #2563eb;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-left: 15px;
      flex-shrink: 0;
    }
    .step-content {
      flex: 1;
    }
    .step-title {
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 5px 0;
    }
    .step-description {
      color: #64748b;
      margin: 0;
      font-size: 14px;
    }
    .action-buttons {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.2s;
      margin: 5px;
    }
    .primary-button {
      background-color: #2563eb;
      color: white;
    }
    .primary-button:hover {
      background-color: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    .secondary-button {
      background-color: #f3f4f6;
      color: #1f2937;
      border: 1px solid #e5e7eb;
    }
    .secondary-button:hover {
      background-color: #e5e7eb;
    }
    .tips-section {
      background-color: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .tips-section h4 {
      color: #92400e;
      font-size: 16px;
      margin: 0 0 10px 0;
    }
    .tips-section ul {
      margin: 0;
      padding-right: 20px;
      color: #78350f;
    }
    .tips-section li {
      margin-bottom: 8px;
      font-size: 14px;
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
      color: #3b82f6;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .unsubscribe-link {
      color: #ef4444;
      font-size: 12px;
      margin-top: 10px;
    }
    @media (max-width: 600px) {
      .container {
        padding: 10px;
      }
      .email-content {
        padding: 20px;
      }
      .detail-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .detail-label {
        margin-bottom: 5px;
      }
      .button {
        display: block;
        width: 100%;
        margin: 10px 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-content">
      <div class="header">
        <h1>✅ נרשמת בהצלחה!</h1>
        <p>מערכת ההתראות לתורים פנויים במספרת רם-אל</p>
      </div>
      
      <div class="welcome-section">
        <h2>ברוך הבא למערכת ההתראות האוטומטית! 🎉</h2>
        <p>מעכשיו תקבל התראות מיידיות כאשר יתפנו תורים בתאריכים שבחרת.</p>
      </div>
      
      <div class="subscription-details">
        <h3>📋 פרטי המינוי שלך:</h3>
        <div class="detail-row">
          <span class="detail-label">סוג מינוי:</span>
          <span class="detail-value">${subscription.type === 'single' ? 'תאריך בודד' : 'טווח תאריכים'}</span>
        </div>
        ${subscription.type === 'single' ? `
          <div class="detail-row">
            <span class="detail-label">תאריך מבוקש:</span>
            <span class="detail-value">
              <span class="date-highlight">
                ${formatHebrewDate(subscription.targetDate!)} - יום ${getDayNameHebrew(subscription.targetDate!)}
              </span>
            </span>
          </div>
        ` : `
          <div class="detail-row">
            <span class="detail-label">תאריך התחלה:</span>
            <span class="detail-value">
              <span class="date-highlight">
                ${formatHebrewDate(subscription.dateStart!)} - יום ${getDayNameHebrew(subscription.dateStart!)}
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">תאריך סיום:</span>
            <span class="detail-value">
              <span class="date-highlight">
                ${formatHebrewDate(subscription.dateEnd!)} - יום ${getDayNameHebrew(subscription.dateEnd!)}
              </span>
            </span>
          </div>
        `}
        <div class="detail-row">
          <span class="detail-label">כתובת מייל:</span>
          <span class="detail-value">${subscription.email}</span>
        </div>
      </div>
      
      <div class="how-it-works">
        <h3>🚀 איך זה עובד?</h3>
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">סריקה אוטומטית</div>
            <div class="step-description">המערכת סורקת את לוח התורים כל 30 דקות</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">זיהוי תורים פנויים</div>
            <div class="step-description">כשנמצא תור פנוי בתאריכים שלך, נשלח לך מייל מיידי</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">קביעת תור מהירה</div>
            <div class="step-description">לחץ על הקישור במייל כדי לקבוע תור באתר המספרה</div>
          </div>
        </div>
      </div>
      
      <div class="tips-section">
        <h4>💡 טיפים חשובים:</h4>
        <ul>
          <li>ודא שהמייל שלנו לא נכנס לתיקיית הספאם</li>
          <li>תורים פנויים נתפסים מהר - פעל במהירות כשתקבל התראה</li>
          <li>אפשר להירשם למספר תאריכים במקביל</li>
          <li>המערכת תפסיק לשלוח התראות אוטומטית לאחר שהתאריך יעבור</li>
        </ul>
      </div>
      
      <div class="action-buttons">
        <a href="${baseUrl}/notifications" class="button primary-button">
          🔔 ניהול ההתראות שלי
        </a>
        <a href="${baseUrl}" class="button secondary-button">
          🏠 למסך הבית
        </a>
      </div>
      
      <div class="footer">
        <p>
          <strong>שאלות? בעיות?</strong><br>
          ניתן לנהל את כל ההתראות שלך ב<a href="${baseUrl}/notifications">לוח הבקרה</a>
        </p>
        ${subscription.stopToken ? `
          <p class="unsubscribe-link">
            <a href="${baseUrl}/unsubscribe?token=${subscription.stopToken}">
              ביטול מינוי להתראה זו
            </a>
          </p>
        ` : ''}
        <p style="margin-top: 20px; color: #9ca3af;">
          מערכת התראות אוטומטית למספרת רם-אל<br>
          פותחה באהבה עבור הקהילה 💙
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  // Generate plain text version
  const text = `
אישור הרשמה להתראות - מספרת רם-אל
=====================================

✅ נרשמת בהצלחה!

פרטי המינוי שלך:
-----------------
${subscription.type === 'single' 
  ? `תאריך מבוקש: ${formatHebrewDate(subscription.targetDate!)} - יום ${getDayNameHebrew(subscription.targetDate!)}`
  : `טווח תאריכים: ${formatHebrewDate(subscription.dateStart!)} עד ${formatHebrewDate(subscription.dateEnd!)}`
}
כתובת מייל: ${subscription.email}

איך זה עובד?
-----------
1. המערכת סורקת את לוח התורים כל 30 דקות
2. כשנמצא תור פנוי בתאריכים שלך, נשלח לך מייל מיידי
3. לחץ על הקישור במייל כדי לקבוע תור באתר המספרה

טיפים חשובים:
------------
• ודא שהמייל שלנו לא נכנס לתיקיית הספאם
• תורים פנויים נתפסים מהר - פעל במהירות כשתקבל התראה
• אפשר להירשם למספר תאריכים במקביל
• המערכת תפסיק לשלוח התראות אוטומטית לאחר שהתאריך יעבור

ניהול התראות: ${baseUrl}/notifications
למסך הבית: ${baseUrl}

${subscription.stopToken ? `ביטול מינוי: ${baseUrl}/unsubscribe?token=${subscription.stopToken}` : ''}

=====================================
מערכת התראות אוטומטית למספרת רם-אל
  `.trim();
  
  return { subject, html, text };
} 
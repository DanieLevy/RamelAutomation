// Modern minimal confirmation email template
export const generateConfirmationEmailTemplate = ({
  userEmail,
  appointmentDate,
  appointmentTime,
  action
}: {
  userEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  action: 'taken' | 'cancelled';
}): { subject: string; html: string; text: string } => {
  
  const isTaken = action === 'taken';
  const subject = isTaken 
    ? `אישור: התור שלך נקבע בהצלחה! ✅`
    : `אישור: התור בוטל 🗓️`;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tor-ramel.netlify.app';
  
  // Format date for display
  const formatDate = (dateStr: string): string => {
    const hebrewMonths = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const month = hebrewMonths[date.getMonth()];
    const dayName = hebrewDays[date.getDay()];
    
    return `יום ${dayName}, ${day} ב${month}`;
  };
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>${isTaken ? 'אישור תור' : 'ביטול תור'} - Tor-RamEl</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style type="text/css">
        /* CSS Reset */
        body, table, td, div, p, a { 
          -webkit-text-size-adjust: 100%; 
          -ms-text-size-adjust: 100%; 
        }
        table, td { 
          mso-table-lspace: 0pt; 
          mso-table-rspace: 0pt; 
        }
        
        /* Base Styles */
        body {
          margin: 0 !important;
          padding: 0 !important;
          min-width: 100% !important;
          background-color: #f3f4f6;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          direction: rtl;
        }
        
        /* Typography */
        h1, h2, h3, p {
          margin: 0;
          padding: 0;
        }
        
        /* Links */
        a {
          color: #2563EB;
          text-decoration: none;
        }
        
        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            max-width: 100% !important;
          }
          .content-section {
            padding: 16px !important;
          }
          .btn {
            display: block !important;
            width: 100% !important;
          }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;word-spacing:normal;background-color:#f3f4f6;">
      <div role="article" aria-roledescription="email" lang="he" dir="rtl" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
        
        <!--[if mso]>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center">
        <![endif]-->
        
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;padding:20px 0;width:100%;max-width:600px;">
          <tr>
            <td>
              <!-- Email Container -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding:24px 24px 20px 24px;text-align:center;">
                    <div style="background-color:${isTaken ? '#10B981' : '#6B7280'};color:#ffffff;width:64px;height:64px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:16px;">
                      ${isTaken ? '✓' : '✗'}
                    </div>
                    <h1 style="font-size:24px;font-weight:600;color:#111827;margin-bottom:8px;">
                      ${isTaken ? 'התור שלך נקבע!' : 'התור בוטל'}
                    </h1>
                    <p style="font-size:14px;color:#6B7280;">
                      ${isTaken ? 'ההתראות של Tor-RamEl הופסקו אוטומטית' : 'אישור ביטול התור'}
                    </p>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td class="content-section" style="padding:32px 24px;">
                    
                    <!-- Appointment Details -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:${isTaken ? '#D1FAE5' : '#F3F4F6'};border:1px solid ${isTaken ? '#A7F3D0' : '#E5E7EB'};border-radius:8px;padding:20px;text-align:center;">
                          <p style="font-size:14px;color:#374151;margin-bottom:8px;">
                            ${isTaken ? 'פרטי התור שנקבע:' : 'פרטי התור שבוטל:'}
                          </p>
                          <h2 style="font-size:18px;font-weight:600;color:#111827;margin-bottom:4px;">
                            ${formatDate(appointmentDate)}
                          </h2>
                          <p style="font-size:24px;font-weight:700;color:${isTaken ? '#059669' : '#6B7280'};">
                            ${appointmentTime}
                          </p>
                          <p style="font-size:14px;color:#6B7280;margin-top:8px;">
                            📍 רם-אל - מספרה לגברים
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    ${isTaken ? `
                    <!-- Next Steps -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                      <tr>
                        <td>
                          <h3 style="font-size:16px;font-weight:600;color:#111827;margin-bottom:12px;">מה עכשיו?</h3>
                          <ul style="margin:0;padding-right:20px;color:#374151;font-size:14px;line-height:1.6;">
                            <li style="margin-bottom:8px;">שמור את פרטי התור</li>
                            <li style="margin-bottom:8px;">הגע 5 דקות לפני הזמן</li>
                            <li style="margin-bottom:8px;">במקרה של שינוי - הודע מראש</li>
                            <li style="margin-bottom:8px;">נתראה ברם-אל! 💈</li>
                          </ul>
                        </td>
                      </tr>
                    </table>
                    ` : `
                    <!-- Reschedule Option -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <p style="font-size:14px;color:#374151;line-height:1.5;margin-bottom:16px;">
                            רוצה לקבוע תור חדש?<br>
                            תוכל להירשם שוב לקבלת התראות
                          </p>
                          <a href="${baseUrl}" 
                             class="btn"
                             style="display:inline-block;background-color:#2563EB;color:#ffffff;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;text-align:center;">
                            🔄 חפש תור חדש
                          </a>
                        </td>
                      </tr>
                    </table>
                    `}
                    
                    <!-- Thank You Message -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <p style="font-size:14px;color:#6B7280;line-height:1.5;">
                            ${isTaken 
                              ? 'תודה שהשתמשת ב-Tor-RamEl! 🎯<br>שמחנו לעזור לך למצוא תור' 
                              : 'מקווים לעזור לך למצוא תור בעתיד'}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding:20px 24px;border-top:1px solid #E5E7EB;background-color:#F9FAFB;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <p style="font-size:12px;color:#6B7280;line-height:1.5;">
                            ${isTaken ? 'אישור אוטומטי' : 'אישור ביטול'} מ-Tor-RamEl<br>
                            <a href="${baseUrl}" style="color:#6B7280;text-decoration:underline;">אתר ראשי</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
        
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
        
      </div>
    </body>
    </html>
  `;

  const text = `
${isTaken ? 'התור שלך נקבע!' : 'התור בוטל'} - Tor-RamEl
${'='.repeat(40)}

${isTaken ? '✓ התור שלך נקבע בהצלחה!' : '✗ התור בוטל'}

${isTaken ? 'פרטי התור שנקבע:' : 'פרטי התור שבוטל:'}
${formatDate(appointmentDate)}
שעה: ${appointmentTime}
📍 רם-אל - מספרה לגברים

${isTaken ? `
מה עכשיו?
- שמור את פרטי התור
- הגע 5 דקות לפני הזמן
- במקרה של שינוי - הודע מראש
- נתראה ברם-אל! 💈

ההתראות של Tor-RamEl הופסקו אוטומטית.
תודה שהשתמשת בשירות! 🎯
` : `
רוצה לקבוע תור חדש?
תוכל להירשם שוב לקבלת התראות:
${baseUrl}

מקווים לעזור לך למצוא תור בעתיד.
`}

_______________
${isTaken ? 'אישור אוטומטי' : 'אישור ביטול'} מ-Tor-RamEl
  `.trim();

  return { subject, html, text };
}; 
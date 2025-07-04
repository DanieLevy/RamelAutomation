// Modern minimal reminder email template
export const generateReminderEmailTemplate = ({
  userEmail,
  appointmentDate,
  appointmentTime,
  unsubscribeUrl
}: {
  userEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } => {
  
  const subject = `תזכורת: התור שלך מחר ב-${appointmentTime} 🔔`;
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
      <title>תזכורת לתור - Tor-RamEl</title>
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
        
        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            max-width: 100% !important;
          }
          .content-section {
            padding: 16px !important;
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
                  <td style="background-color:#FEF3C7;padding:24px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">🔔</div>
                    <h1 style="font-size:24px;font-weight:600;color:#92400E;">תזכורת: יש לך תור מחר!</h1>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td class="content-section" style="padding:32px 24px;">
                    
                    <!-- Appointment Details -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:#F3F4F6;border-radius:8px;padding:24px;text-align:center;">
                          <p style="font-size:14px;color:#6B7280;margin-bottom:8px;">התור שלך ברם-אל:</p>
                          <h2 style="font-size:20px;font-weight:600;color:#111827;margin-bottom:8px;">
                            ${formatDate(appointmentDate)}
                          </h2>
                          <div style="font-size:32px;font-weight:700;color:#2563EB;margin-bottom:8px;">
                            ${appointmentTime}
                          </div>
                          <p style="font-size:14px;color:#6B7280;">
                            📍 רם-אל - מספרה לגברים
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Important Notes -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                      <tr>
                        <td>
                          <h3 style="font-size:16px;font-weight:600;color:#111827;margin-bottom:12px;">כמה דברים חשובים:</h3>
                          <ul style="margin:0;padding-right:20px;color:#374151;font-size:14px;line-height:1.6;">
                            <li style="margin-bottom:8px;">הגע 5 דקות לפני הזמן</li>
                            <li style="margin-bottom:8px;">במקרה של ביטול - הודע מראש</li>
                            <li style="margin-bottom:8px;">שמור את האישור הזה כתזכורת</li>
                          </ul>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Call to Action -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <p style="font-size:14px;color:#6B7280;line-height:1.5;">
                            נתראה מחר! 💈
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
                            תזכורת אוטומטית מ-Tor-RamEl<br>
                            <a href="${unsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">הפסק תזכורות</a>
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
תזכורת: התור שלך מחר! 🔔
========================

התור שלך ברם-אל:
${formatDate(appointmentDate)}
שעה: ${appointmentTime}

📍 רם-אל - מספרה לגברים

כמה דברים חשובים:
- הגע 5 דקות לפני הזמן
- במקרה של ביטול - הודע מראש
- שמור את האישור הזה כתזכורת

נתראה מחר! 💈

_______________
תזכורת אוטומטית מ-Tor-RamEl
הפסק תזכורות: ${unsubscribeUrl}
  `.trim();

  return { subject, html, text };
}; 
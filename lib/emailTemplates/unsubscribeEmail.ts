// Modern minimal unsubscribe confirmation email template
export const generateUnsubscribeEmailTemplate = ({
  userEmail,
  resubscribeUrl
}: {
  userEmail: string;
  resubscribeUrl: string;
}): { subject: string; html: string; text: string } => {
  
  const subject = 'ההתראות הופסקו - Tor-RamEl';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tor-ramel.netlify.app';
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>התראות הופסקו - Tor-RamEl</title>
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
        img { 
          -ms-interpolation-mode: bicubic; 
          border: 0; 
          outline: none; 
          text-decoration: none; 
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
        
        /* Hover Effects */
        @media (hover: hover) {
          .btn-primary:hover {
            background-color: #1D4ED8 !important;
          }
          .btn-secondary:hover {
            background-color: #E5E7EB !important;
          }
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
        
        <!-- Preheader Text -->
        <div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
          ההתראות הופסקו. לא תקבל יותר התראות על תורים פנויים ברם-אל.
        </div>
        
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;padding:20px 0;width:100%;max-width:600px;">
          <tr>
            <td>
              <!-- Email Container -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding:24px 24px 20px 24px;text-align:center;">
                    <div style="font-size:40px;margin-bottom:12px;">👋</div>
                    <h1 style="font-size:24px;font-weight:600;color:#111827;margin-bottom:8px;">ההתראות הופסקו</h1>
                    <p style="font-size:14px;color:#6B7280;">לא תקבל יותר התראות מ-Tor-RamEl</p>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding:0 24px;">
                    <div style="height:1px;background-color:#E5E7EB;"></div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td class="content-section" style="padding:32px 24px;">
                    
                    <!-- Confirmation Message -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
                      <tr>
                        <td align="center">
                          <div style="background-color:#FEF3C7;color:#92400E;padding:16px;border-radius:6px;margin-bottom:24px;">
                            <p style="font-size:14px;line-height:1.5;">
                              <strong>ההרשמה שלך בוטלה בהצלחה</strong><br>
                              לא נשלח לך יותר התראות על תורים פנויים
                            </p>
                          </div>
                          
                          <p style="font-size:16px;color:#374151;line-height:1.5;margin-bottom:8px;">
                            מקווים שמצאת את התור שחיפשת! 🎯
                          </p>
                          <p style="font-size:14px;color:#6B7280;line-height:1.5;">
                            אם תרצה להירשם שוב בעתיד,<br>
                            תמיד נשמח לעזור לך למצוא תור
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Resubscribe Option -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                      <tr>
                        <td style="background-color:#F3F4F6;border-radius:6px;padding:20px;text-align:center;">
                          <h3 style="font-size:16px;font-weight:600;color:#111827;margin-bottom:8px;">שינית דעתך?</h3>
                          <p style="font-size:14px;color:#6B7280;margin-bottom:16px;">
                            תוכל להירשם מחדש בכל עת
                          </p>
                          <a href="${resubscribeUrl}" 
                             class="btn btn-primary"
                             style="display:inline-block;background-color:#2563EB;color:#ffffff;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;text-align:center;"
                             role="button">
                            🔄 הירשם מחדש
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Feedback -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <p style="font-size:14px;color:#6B7280;line-height:1.5;">
                            יש לך הצעות לשיפור?<br>
                            נשמח לשמוע ממך ב-<a href="mailto:support@tor-ramel.com" style="color:#2563EB;text-decoration:underline;">support@tor-ramel.com</a>
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
                          <p style="font-size:12px;color:#6B7280;line-height:1.5;margin-bottom:8px;">
                            נשלח ל: ${userEmail}
                          </p>
                          <p style="font-size:12px;line-height:1.5;">
                            <a href="${baseUrl}" style="color:#6B7280;text-decoration:underline;">אתר ראשי</a>
                            <span style="color:#D1D5DB;margin:0 8px;">•</span>
                            <a href="${baseUrl}/about" style="color:#6B7280;text-decoration:underline;">אודות</a>
                          </p>
                          <p style="font-size:12px;color:#6B7280;margin-top:8px;">
                            תודה שהשתמשת ב-Tor-RamEl! ❤️
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
ההתראות הופסקו - Tor-RamEl
===========================

👋 ההתראות הופסקו

ההרשמה שלך בוטלה בהצלחה
לא נשלח לך יותר התראות על תורים פנויים

מקווים שמצאת את התור שחיפשת! 🎯

אם תרצה להירשם שוב בעתיד,
תמיד נשמח לעזור לך למצוא תור

שינית דעתך?
-------------
תוכל להירשם מחדש בכל עת:
🔄 ${resubscribeUrl}

יש לך הצעות לשיפור?
נשמח לשמוע ממך ב-support@tor-ramel.com

_______________
נשלח ל: ${userEmail}

אתר ראשי: ${baseUrl}

תודה שהשתמשת ב-Tor-RamEl! ❤️
  `.trim();

  return { subject, html, text };
}; 
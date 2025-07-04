// Modern minimal welcome email template
export const generateWelcomeEmailTemplate = ({
  userEmail,
  unsubscribeUrl,
  manageUrl
}: {
  userEmail: string;
  unsubscribeUrl: string;
  manageUrl: string;
}): { subject: string; html: string; text: string } => {
  
  const subject = 'ברוכים הבאים ל-Tor-RamEl ✨';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tor-ramel.netlify.app';
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>ברוכים הבאים - Tor-RamEl</title>
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
          .step-card:hover {
            border-color: #2563EB !important;
            background-color: #EFF6FF !important;
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
          .step-card {
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
          ההרשמה שלך אושרה! עכשיו נתחיל לחפש תורים פנויים ברם-אל עבורך.
        </div>
        
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;padding:20px 0;width:100%;max-width:600px;">
          <tr>
            <td>
              <!-- Email Container -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding:24px 24px 20px 24px;border-bottom:1px solid #E5E7EB;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <div style="font-size:40px;margin-bottom:12px;">✨</div>
                          <h1 style="font-size:24px;font-weight:600;color:#111827;margin-bottom:4px;">ברוכים הבאים ל-Tor-RamEl!</h1>
                          <p style="font-size:14px;color:#6B7280;">מערכת התראות חכמה לתורים ברם-אל</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td class="content-section" style="padding:32px 24px;">
                    
                    <!-- Welcome Message -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
                      <tr>
                        <td align="center">
                          <div style="background-color:#10B981;color:#ffffff;width:48px;height:48px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px;">✓</div>
                          <h2 style="font-size:20px;font-weight:600;color:#111827;margin-bottom:8px;">ההרשמה שלך אושרה!</h2>
                          <p style="font-size:16px;color:#6B7280;line-height:1.5;">
                            נתחיל לחפש תורים פנויים עבורך<br>
                            ונשלח התראה ברגע שנמצא משהו מתאים
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- How It Works -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
                      <tr>
                        <td>
                          <h3 style="font-size:18px;font-weight:600;color:#111827;margin-bottom:16px;text-align:center;">איך זה עובד?</h3>
                        </td>
                      </tr>
                      
                      <!-- Step 1 -->
                      <tr>
                        <td style="padding-bottom:12px;">
                          <div class="step-card" style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:20px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td width="48" style="vertical-align:top;">
                                  <div style="background-color:#2563EB;color:#ffffff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;">1</div>
                                </td>
                                <td style="padding-right:12px;">
                                  <h4 style="font-size:16px;font-weight:600;color:#111827;margin-bottom:4px;">בדיקה אוטומטית</h4>
                                  <p style="font-size:14px;color:#6B7280;line-height:1.4;">המערכת בודקת תורים פנויים כל 5 דקות</p>
                                </td>
                              </tr>
                            </table>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Step 2 -->
                      <tr>
                        <td style="padding-bottom:12px;">
                          <div class="step-card" style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:20px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td width="48" style="vertical-align:top;">
                                  <div style="background-color:#2563EB;color:#ffffff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;">2</div>
                                </td>
                                <td style="padding-right:12px;">
                                  <h4 style="font-size:16px;font-weight:600;color:#111827;margin-bottom:4px;">התראה מיידית</h4>
                                  <p style="font-size:14px;color:#6B7280;line-height:1.4;">ברגע שנמצא תור - תקבל מייל מפורט</p>
                                </td>
                              </tr>
                            </table>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Step 3 -->
                      <tr>
                        <td style="padding-bottom:12px;">
                          <div class="step-card" style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:20px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td width="48" style="vertical-align:top;">
                                  <div style="background-color:#2563EB;color:#ffffff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;">3</div>
                                </td>
                                <td style="padding-right:12px;">
                                  <h4 style="font-size:16px;font-weight:600;color:#111827;margin-bottom:4px;">פעולה מהירה</h4>
                                  <p style="font-size:14px;color:#6B7280;line-height:1.4;">לחץ "מצאתי!" כשתפסת תור והמערכת תפסיק לחפש</p>
                                </td>
                              </tr>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Settings Info -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                      <tr>
                        <td style="background-color:#EFF6FF;border-radius:6px;padding:16px;text-align:center;">
                          <p style="font-size:14px;color:#1E40AF;line-height:1.5;">
                            <strong>ההגדרות שלך:</strong><br>
                            תקבל עד 6 התראות (3 כל 10 דקות, 3 כל שעה)<br>
                            ניתן לשנות את ההגדרות בכל עת
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
                      <tr>
                        <td align="center">
                          <a href="${manageUrl}" 
                             class="btn btn-primary"
                             style="display:inline-block;background-color:#2563EB;color:#ffffff;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;text-align:center;"
                             role="button">
                            ⚙️ נהל את ההגדרות שלי
                          </a>
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
                            <a href="${unsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">הפסק לקבל התראות</a>
                            <span style="color:#D1D5DB;margin:0 8px;">•</span>
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
ברוכים הבאים ל-Tor-RamEl! ✨
=============================

✓ ההרשמה שלך אושרה!

נתחיל לחפש תורים פנויים עבורך ונשלח התראה ברגע שנמצא משהו מתאים.

איך זה עובד?
-------------

1. בדיקה אוטומטית
   המערכת בודקת תורים פנויים כל 5 דקות

2. התראה מיידית
   ברגע שנמצא תור - תקבל מייל מפורט

3. פעולה מהירה
   לחץ "מצאתי!" כשתפסת תור והמערכת תפסיק לחפש

ההגדרות שלך:
תקבל עד 6 התראות (3 כל 10 דקות, 3 כל שעה)
ניתן לשנות את ההגדרות בכל עת

⚙️ נהל את ההגדרות שלי: ${manageUrl}

_______________
נשלח ל: ${userEmail}

הפסק התראות: ${unsubscribeUrl}
אתר ראשי: ${baseUrl}

Tor-RamEl - מערכת התראות חכמה לתורים
  `.trim();

  return { subject, html, text };
}; 
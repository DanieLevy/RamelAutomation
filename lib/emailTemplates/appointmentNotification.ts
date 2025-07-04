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
  subscriberEmail: string,
  unsubscribeToken: string
): { html: string; subject: string; text: string } => {
  
  // Count total appointments
  const totalAppointments = matchingResults.reduce((sum, result) => sum + result.times.length, 0);
  const totalDays = matchingResults.length;
  const isUrgent = matchingResults.some(result => {
    const appointmentDate = new Date(result.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate.getTime() === today.getTime();
  });
  
  // Generate modern subject with urgency indicator
  const urgencyEmoji = isUrgent ? '⚡ ' : '';
  const phaseIndicator = maxPhases > 1 ? ` (${currentPhase}/${maxPhases})` : '';
  const subject = `${urgencyEmoji}נמצאו ${totalAppointments} תורים פנויים${phaseIndicator} - Tor-RamEl`;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tor-ramel.netlify.app';
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>תורים פנויים - Tor-RamEl</title>
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
        
        /* Hover Effects - Progressive Enhancement */
        @media (hover: hover) {
          .btn-primary:hover {
            background-color: #1D4ED8 !important;
          }
          .btn-secondary:hover {
            background-color: #E5E7EB !important;
          }
          .appointment-card:hover {
            border-color: #2563EB !important;
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
          .appointment-card {
            padding: 12px !important;
          }
          .btn {
            display: block !important;
            width: 100% !important;
            margin-bottom: 8px !important;
          }
          .btn-wrapper {
            display: block !important;
            width: 100% !important;
            text-align: center !important;
          }
          .phase-indicator {
            font-size: 11px !important;
          }
        }
        
        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          /* Keep light theme for better email client support */
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
          ${isUrgent ? '⚡ דחוף! ' : ''}נמצאו ${totalAppointments} תורים פנויים${totalDays > 1 ? ` ב-${totalDays} ימים` : ''} - בדוק עכשיו!
        </div>
        
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;padding:20px 0;width:100%;max-width:600px;">
          <tr>
            <td>
              <!-- Email Container -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #E5E7EB;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="right" style="vertical-align:middle;">
                          <span style="font-size:20px;font-weight:600;color:#111827;">🎯 Tor-RamEl</span>
                        </td>
                        ${currentPhase > 1 ? `
                        <td align="left" style="vertical-align:middle;">
                          <span class="phase-indicator" style="background-color:#EFF6FF;color:#2563EB;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:500;">
                            התראה ${currentPhase}/${maxPhases}
                          </span>
                        </td>
                        ` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td class="content-section" style="padding:32px 24px;">
                    
                    <!-- Success Message -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          ${isUrgent ? '<p style="font-size:14px;color:#F59E0B;font-weight:600;margin-bottom:8px;">⚡ תורים דחופים להיום!</p>' : ''}
                          <h1 style="font-size:24px;font-weight:600;color:#111827;line-height:1.25;margin-bottom:8px;">
                            מצאנו ${totalAppointments} ${totalAppointments === 1 ? 'תור פנוי' : 'תורים פנויים'}!
                          </h1>
                          <p style="font-size:16px;color:#6B7280;line-height:1.5;">
                            ${totalDays > 1 ? `ב-${totalDays} ימים שונים ` : ''}ברם-אל מחכים לך
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Appointments List -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                      ${matchingResults.map(appointment => {
                        const isToday = new Date(appointment.date + 'T00:00:00').toDateString() === new Date().toDateString();
                        return `
                        <tr>
                          <td style="padding-bottom:12px;">
                            <div class="appointment-card" style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:16px;${isToday ? 'border-color:#F59E0B;' : ''}">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                  <td>
                                    <p style="font-size:16px;font-weight:600;color:#111827;margin-bottom:8px;">
                                      ${isToday ? '⚡ ' : '📅 '}${getDayNameHebrew(appointment.date)}, ${formatHebrewDate(appointment.date)}
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <div style="margin-top:8px;">
                                      ${appointment.times.map(time => `
                                        <span style="display:inline-block;background-color:#2563EB;color:#ffffff;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:500;margin:2px;">
                                          ${time}
                                        </span>
                                      `).join('')}
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </div>
                          </td>
                        </tr>
                        `;
                      }).join('')}
                    </table>
                    
                    <!-- Action Section -->
                    ${responseTokens && Object.keys(responseTokens).length > 0 ? `
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
                      <tr>
                        <td style="background-color:#EFF6FF;border-radius:6px;padding:20px;text-align:center;">
                          <p style="font-size:16px;font-weight:600;color:#1E40AF;margin-bottom:12px;">
                            האם אחד התורים מתאים לך?
                          </p>
                          <p style="font-size:14px;color:#3730A3;margin-bottom:16px;line-height:1.5;">
                            לחץ "מצאתי!" אם תפסת תור<br>
                            או "לא מתאים" ונמשיך לחפש
                          </p>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                            <tr>
                              <td class="btn-wrapper" style="padding-left:8px;">
                                <a href="${baseUrl}/appointment-response?token=${Object.values(responseTokens)[0]}&action=taken" 
                                   class="btn btn-primary"
                                   style="display:inline-block;background-color:#10B981;color:#ffffff;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;text-align:center;"
                                   role="button"
                                   aria-label="מצאתי תור מתאים">
                                  ✓ מצאתי!
                                </a>
                              </td>
                              <td class="btn-wrapper">
                                <a href="${baseUrl}/appointment-response?token=${Object.values(responseTokens)[0]}&action=not_wanted" 
                                   class="btn btn-secondary"
                                   style="display:inline-block;background-color:#F3F4F6;color:#374151;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;text-decoration:none;text-align:center;border:1px solid #D1D5DB;"
                                   role="button"
                                   aria-label="התורים לא מתאימים">
                                  לא מתאים
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding:20px 24px;border-top:1px solid #E5E7EB;background-color:#F9FAFB;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <p style="font-size:12px;color:#6B7280;line-height:1.5;margin-bottom:8px;">
                            נשלח ל: ${subscriberEmail}
                          </p>
                          <p style="font-size:12px;line-height:1.5;">
                            <a href="${baseUrl}/unsubscribe?token=${unsubscribeToken}" style="color:#6B7280;text-decoration:underline;">הפסק לקבל התראות</a>
                            <span style="color:#D1D5DB;margin:0 8px;">•</span>
                            <a href="${baseUrl}/manage?email=${encodeURIComponent(subscriberEmail)}" style="color:#6B7280;text-decoration:underline;">נהל הגדרות</a>
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

  // Plain text version
  const text = `
Tor-RamEl - תורים פנויים${isUrgent ? ' ⚡ דחוף!' : ''}
=====================================

${isUrgent ? '⚡ תורים דחופים להיום!\n\n' : ''}מצאנו ${totalAppointments} ${totalAppointments === 1 ? 'תור פנוי' : 'תורים פנויים'}${totalDays > 1 ? ` ב-${totalDays} ימים שונים` : ''}!

התורים הפנויים:
${matchingResults.map(appointment => {
  const isToday = new Date(appointment.date + 'T00:00:00').toDateString() === new Date().toDateString();
  return `
${isToday ? '⚡ ' : '📅 '}${getDayNameHebrew(appointment.date)}, ${formatHebrewDate(appointment.date)}
שעות: ${appointment.times.join(', ')}`;
}).join('\n')}

${responseTokens && Object.keys(responseTokens).length > 0 ? `
האם אחד התורים מתאים לך?
-------------------------
✓ מצאתי! - ${baseUrl}/appointment-response?token=${Object.values(responseTokens)[0]}&action=taken
לא מתאים - ${baseUrl}/appointment-response?token=${Object.values(responseTokens)[0]}&action=not_wanted
` : ''}

${currentPhase > 1 ? `זו התראה ${currentPhase} מתוך ${maxPhases}\n` : ''}

_______________
נשלח ל: ${subscriberEmail}

הפסק התראות: ${baseUrl}/unsubscribe?token=${unsubscribeToken}
נהל הגדרות: ${baseUrl}/manage?email=${encodeURIComponent(subscriberEmail)}
אתר ראשי: ${baseUrl}

Tor-RamEl - מערכת התראות חכמה לתורים
  `.trim();

  return { html, subject, text };
}; 
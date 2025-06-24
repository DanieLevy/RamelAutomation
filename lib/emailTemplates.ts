// Modern & Improved Email Templates for Tor-RamEl - TypeScript Version
// Design focuses on clarity, trust, and a premium user experience.
// Fully responsive with dark mode support.

// =================================================================================
// TYPE DEFINITIONS (Preserved from your original file)
// =================================================================================

interface AppointmentResult {
  date: string;
  available: boolean;
  times: string[];
}

interface EmailTemplateParams {
  matchingResults: AppointmentResult[];
  notificationCount: number;
  unsubscribeUrl: string;
  userEmail: string;
  criteriaType: 'single' | 'range'; // This parameter is preserved but not used in the new design
}

// =================================================================================
// HELPER FUNCTIONS (Preserved from your original file)
// =================================================================================

/**
 * Gets the Hebrew day name from a date string (e.g., '2024-12-25').
 * @param {string} dateStr - The date in YYYY-MM-DD format.
 * @returns {string} The full day name in Hebrew.
 */
const getDayNameHebrew = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00'); // Ensure parsing as local date
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long'
  }).format(date);
};

/**
 * Formats a date string into a full Hebrew date.
 * @param {string} dateStr - The date in YYYY-MM-DD format.
 * @returns {string} The formatted date (e.g., '25 בדצמבר 2024').
 */
const formatHebrewDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

/**
 * Generates the direct booking URL for a specific date.
 * @param {string} dateStr - The date in YYYY-MM-DD format.
 * @returns {string} The complete URL to the booking page for that date.
 */
const generateBookingUrl = (dateStr: string): string => {
  const baseUrl = 'https://mytor.co.il/home.php';
  const params = new URLSearchParams({
    i: 'cmFtZWwzMw==',
    s: 'MjY1',
    mm: 'y',
    lang: 'he',
    datef: dateStr,
    signup: 'הצג'
  });
  return `${baseUrl}?${params.toString()}`;
};


// =================================================================================
// CORE EMAIL GENERATION LOGIC (Completely Revamped)
// =================================================================================

/**
 * Generates a modern, responsive, and beautifully designed HTML email.
 * @param {EmailTemplateParams} params - The parameters for the email.
 * @returns {{subject: string, html: string, text: string}} The complete email object.
 */
export const generateModernEmailTemplate = ({
  matchingResults,
  notificationCount,
  unsubscribeUrl,
  userEmail,
}: EmailTemplateParams): { subject: string; html: string; text: string } => {
  // --- Dynamic Content Calculation ---
  const isMultipleDates = matchingResults.length > 1;
  const dayName = getDayNameHebrew(matchingResults[0].date);

  // --- Improved Subject Lines ---
  let subject = '';
  if (notificationCount === 0) {
    subject = isMultipleDates ?
      `Tor-RamEl | מצאנו ${matchingResults.length} תאריכים עם תורים פנויים!` :
      `Tor-RamEl | מצאנו תור פנוי ביום ${dayName}!`;
  } else {
    subject = `Tor-RamEl | תזכורת: התורים שחיפשת עדיין זמינים`;
  }

  // --- Polished Plain Text Version ---
  const plainText = `
שלום,

מצאנו תורים פנויים עבורך במספרת רם-אל.
${matchingResults.map(apt =>
`
📅 ${formatHebrewDate(apt.date)} (יום ${getDayNameHebrew(apt.date)})
⏰ שעות זמינות: ${apt.times.join(', ')}
🔗 לקביעת תור ליום זה: ${generateBookingUrl(apt.date)}
`).join('\n')}

- - - - - - - - - -

לניהול ההתראות או לקביעה מהירה, בקר באתר שלנו:
https://tor-ramel.netlify.app/manage?email=${encodeURIComponent(userEmail)}

תודה,
צוות Tor-RamEl

להסרה מהתראות: ${unsubscribeUrl}
  `.trim();

  // --- Revamped HTML Email Template ---
  const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');

    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f4f4f9; /* Light purple-ish gray background */
      font-family: 'Assistant', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #333333;
    }
    .main-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e9e9f0;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 32px;
      text-align: center;
      background-color: #4a4a68; /* A deep, professional purple-slate color */
      color: #ffffff;
    }
    .content {
      padding: 24px 32px;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #888888;
      background-color: #f9f9fc;
    }
    .appointment-card {
      background-color: #ffffff;
      border: 1px solid #e9e9f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      transition: all 0.2s ease-in-out;
    }
    .appointment-card:hover { /* Hover effect for desktop clients */
        border-color: #c8c8d8;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }
    .date-header {
      text-align: center;
      margin-bottom: 16px;
    }
    .time-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
      gap: 8px;
      margin-top: 16px;
    }
    .time-slot {
      background-color: #f9f9fc;
      color: #333333;
      font-weight: 600;
      text-align: center;
      padding: 10px 5px;
      border-radius: 8px;
      border: 1px solid #e9e9f0;
    }
    .cta-button {
      display: inline-block;
      background-color: #5d5dff; /* A vibrant, modern blue */
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin-top: 20px;
      transition: background-color 0.2s ease;
    }
    .cta-button:hover {
        background-color: #4a4ae6; /* Slightly darker on hover */
    }
    .secondary-link {
        color: #888888;
        text-decoration: none;
        font-size: 12px;
    }
    .secondary-link:hover {
        text-decoration: underline;
    }

    /* Dark Mode Styles */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #121212;
        color: #e0e0e0;
      }
      .card {
        background-color: #1e1e1e;
        border-color: #333333;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      .header {
        background-color: #2a2a3a;
      }
      .content { color: #e0e0e0; }
      .footer {
        background-color: #191919;
        color: #a0a0a0;
      }
      .appointment-card {
        background-color: #252525;
        border-color: #444444;
      }
      .time-slot {
        background-color: #333333;
        color: #e0e0e0;
        border-color: #555555;
      }
      .secondary-link { color: #a0a0a0; }
    }

    /* Mobile Responsive */
    @media (max-width: 600px) {
      .main-container { padding: 10px; }
      .content { padding: 16px 20px; }
      .header { padding: 24px; }
      .time-grid { grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)); }
    }
  </style>
</head>
<body>
  <div class="main-container">
    <div class="card">
      <!-- === HEADER === -->
      <div class="header">
        <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 4px 0; color: #ffffff;">Tor-RamEl</h1>
        <p style="font-size: 16px; margin: 0; color: #d0d0ff;">התראה על תורים פנויים</p>
      </div>

      <!-- === MAIN CONTENT === -->
      <div class="content">
        <h2 style="font-size: 22px; font-weight: 700; color: inherit; text-align: center; margin-top: 0; margin-bottom: 8px;">
          ${notificationCount === 0 ? 'מצאנו תורים חדשים!' : 'התורים שחיפשת עדיין זמינים'} ✨
        </h2>
        <p style="font-size: 15px; color: inherit; text-align: center; margin: 0 0 24px 0; opacity: 0.8;">
          שלום, אלו התורים הפנויים שמצאנו עבורך במספרת רם-אל.
        </p>

        <!-- === APPOINTMENT CARDS === -->
        ${matchingResults.map(appointment => `
          <div class="appointment-card">
            <div class="date-header">
              <div style="font-size: 18px; font-weight: 700; color: inherit;">${formatHebrewDate(appointment.date)}</div>
              <div style="font-size: 14px; font-weight: 600; color: inherit; opacity: 0.7;">יום ${getDayNameHebrew(appointment.date)}</div>
            </div>
            <div class="time-grid">
              ${appointment.times.map(time => `<div class="time-slot">${time}</div>`).join('')}
            </div>
            <div style="text-align: center;">
                <a href="${generateBookingUrl(appointment.date)}" target="_blank" class="cta-button">
                    לקביעת תור ליום זה
                </a>
            </div>
          </div>
        `).join('')}

      </div>

      <!-- === FOOTER === -->
      <div class="footer">
        <p style="margin: 0 0 16px 0;">נשלח אל ${userEmail}</p>
        <p style="margin: 0 0 16px 0;">
          <a href="https://tor-ramel.netlify.app/manage?email=${encodeURIComponent(userEmail)}" target="_blank" class="secondary-link">ניהול התראות</a>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <a href="${unsubscribeUrl}" target="_blank" class="secondary-link">הסר הרשמה</a>
        </p>
        <p style="margin: 0; font-size: 11px; opacity: 0.7;">
          Tor-RamEl Automation &copy; ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html: emailHtml, text: plainText };
};

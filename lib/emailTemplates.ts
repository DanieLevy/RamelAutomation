// =================================================================================
// EMAIL TEMPLATES - MAIN ENTRY POINT
// =================================================================================

// Import template modules
export { generateAppointmentNotificationEmail } from './emailTemplates/appointmentNotification';
export { generateSubscriptionConfirmationEmail } from './emailTemplates/subscriptionConfirmation';

// Common utilities used across templates
export const formatHebrewDate = (dateStr: string): string => {
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

export const getDayNameHebrew = (dateStr: string): string => {
  const hebrewDayNames = [
    'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
  ];
  
  const date = new Date(dateStr + 'T00:00:00');
  return hebrewDayNames[date.getDay()];
};

export const generateBookingUrl = (dateStr: string): string => {
  const baseUrl = 'https://mytor.co.il/home.php';
  const params = new URLSearchParams({
    i: 'cmFtZWwzMw==',  // ramel33 encoded
    s: 'MjY1',         // 265
    mm: 'y',
    lang: 'he',
    datef: dateStr,
    signup: 'הצג'      // Hebrew for "Show"
  });
  
  return `${baseUrl}?${params.toString()}`;
};
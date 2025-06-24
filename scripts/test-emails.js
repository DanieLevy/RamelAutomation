const nodemailer = require('nodemailer');
const { generateEmailContent } = require('../lib/emailTemplates');

// Email configuration
const EMAIL_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'daniellofficial@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'vpbnuduyocmopyaa'
  }
};

const TEST_EMAIL = 'daniellofficial@gmail.com';

// Test scenarios
const TEST_SCENARIOS = {
  1: {
    name: 'תור בודד - זמין חדש',
    type: 'single',
    urgency: 'new',
    appointment: {
      date: '2025-01-15',
      time: '10:30'
    },
    totalNotificationCount: 1
  },
  2: {
    name: 'תור בודד - תזכורת',
    type: 'single',
    urgency: 'reminder',
    appointment: {
      date: '2025-01-20',
      time: '14:15'
    },
    totalNotificationCount: 3
  },
  3: {
    name: 'תור בודד - תזכורת',
    type: 'single',
    urgency: 'reminder',
    appointment: {
      date: '2025-01-25',
      time: '09:00'
    },
    totalNotificationCount: 2
  },
  4: {
    name: 'תור בודד - תזכורת נוספת',
    type: 'single',
    urgency: 'followup',
    appointment: {
      date: '2025-01-30',
      time: '16:45'
    },
    totalNotificationCount: 4
  },
  5: {
    name: 'טווח תורים - זמין חדש',
    type: 'range',
    urgency: 'new',
    appointments: [
      { date: '2025-02-01', time: '10:00' },
      { date: '2025-02-02', time: '11:30' },
      { date: '2025-02-03', time: '13:15' }
    ],
    totalNotificationCount: 1
  },
  6: {
    name: 'טווח תורים - תזכורת',
    type: 'range',
    urgency: 'reminder',
    appointments: [
      { date: '2025-02-05', time: '08:30' },
      { date: '2025-02-06', time: '10:00' },
      { date: '2025-02-07', time: '14:30' },
      { date: '2025-02-08', time: '16:15' }
    ],
    totalNotificationCount: 4
  },
  7: {
    name: 'טווח תורים - תזכורת',
    type: 'range',
    urgency: 'reminder',
    appointments: [
      { date: '2025-02-10', time: '09:15' },
      { date: '2025-02-11', time: '11:00' },
      { date: '2025-02-12', time: '13:45' },
      { date: '2025-02-13', time: '15:30' },
      { date: '2025-02-14', time: '17:00' }
    ],
    totalNotificationCount: 2
  },
  8: {
    name: 'טווח תורים - תזכורת נוספת',
    type: 'range',
    urgency: 'followup',
    appointments: [
      { date: '2025-02-15', time: '08:00' },
      { date: '2025-02-16', time: '09:30' },
      { date: '2025-02-17', time: '11:15' },
      { date: '2025-02-18', time: '13:00' },
      { date: '2025-02-19', time: '14:45' },
      { date: '2025-02-20', time: '16:30' }
    ],
    totalNotificationCount: 5
  }
};

function displayMenu() {
  console.log('\n🎯 מערכת בדיקת מיילים - תור רם-אל');
  console.log('='.repeat(50));
  console.log('בחר תרחיש לבדיקה:\n');
  
  Object.entries(TEST_SCENARIOS).forEach(([key, scenario]) => {
    const urgencyEmoji = {
      'new': '🆕',
      'reminder': '⏰',
      'followup': '📧'
    }[scenario.urgency];
    
    console.log(`${key}. ${urgencyEmoji} ${scenario.name}`);
  });
  
  console.log('\n0. יציאה');
  console.log('='.repeat(50));
}

async function createTransporter() {
  const transporter = nodemailer.createTransport(EMAIL_CONFIG);
  
  try {
    await transporter.verify();
    console.log('✅ חיבור למייל הוקם בהצלחה');
    return transporter;
  } catch (error) {
    console.error('❌ שגיאה בחיבור למייל:', error.message);
    console.log('\n💡 הוראות הגדרה:');
    console.log('1. הגדר משתני סביבה: EMAIL_USER ו-EMAIL_PASSWORD');
    console.log('2. עבור Gmail: השתמש ב-App Password (לא הסיסמה הרגילה)');
    console.log('3. הפעל 2-Factor Authentication ב-Gmail');
    return null;
  }
}

async function sendTestEmail(transporter, scenario) {
  try {
    console.log(`\n📧 שולח מייל: ${scenario.name}...`);
    
    const emailData = scenario.type === 'single' 
      ? {
          appointment: scenario.appointment,
          totalNotificationCount: scenario.totalNotificationCount,
          urgency: scenario.urgency
        }
      : {
          appointments: scenario.appointments,
          totalNotificationCount: scenario.totalNotificationCount,
          urgency: scenario.urgency
        };
    
    const { subject, html } = generateEmailContent(emailData);
    
    const mailOptions = {
      from: {
        name: 'תור רם-אל',
        address: EMAIL_CONFIG.auth.user
      },
      to: TEST_EMAIL,
      subject: `[TEST] ${subject}`,
      html: html,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal'
      }
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ מייל נשלח בהצלחה!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📧 נשלח אל: ${TEST_EMAIL}`);
    
    return true;
  } catch (error) {
    console.error('❌ שגיאה בשליחת המייל:', error.message);
    return false;
  }
}

function formatScenarioDetails(scenario) {
  console.log(`\n📋 פרטי התרחיש: ${scenario.name}`);
  console.log('-'.repeat(30));
  console.log(`🎯 סוג: ${scenario.type === 'single' ? 'תור בודד' : 'טווח תורים'}`);
  console.log(`⚡ דחיפות: ${scenario.urgency}`);
  console.log(`📊 מספר התראות כולל: ${scenario.totalNotificationCount}`);
  
  if (scenario.type === 'single') {
    console.log(`📅 תאריך: ${scenario.appointment.date}`);
    console.log(`⏰ שעה: ${scenario.appointment.time}`);
  } else {
    console.log(`📅 תורים (${scenario.appointments.length}):`);
    scenario.appointments.forEach((apt, index) => {
      console.log(`   ${index + 1}. ${apt.date} בשעה ${apt.time}`);
    });
  }
}

async function runInteractiveMode() {
  console.log('🚀 מתחיל מערכת בדיקת מיילים...\n');
  
  const transporter = await createTransporter();
  if (!transporter) {
    process.exit(1);
  }
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise((resolve) => {
      readline.question(question, resolve);
    });
  };
  
  while (true) {
    displayMenu();
    const choice = await askQuestion('\nבחר אפשרות (0-8): ');
    
    if (choice === '0') {
      console.log('\n👋 להתראות!');
      break;
    }
    
    const scenario = TEST_SCENARIOS[choice];
    if (!scenario) {
      console.log('❌ בחירה לא תקינה. נסה שוב.');
      continue;
    }
    
    formatScenarioDetails(scenario);
    
    const confirm = await askQuestion('\n❓ האם לשלוח את המייל? (y/n): ');
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      await sendTestEmail(transporter, scenario);
    } else {
      console.log('⏭️ מדלג על שליחת המייל');
    }
    
    const continueChoice = await askQuestion('\n🔄 להמשיך לתרחיש הבא? (y/n): ');
    if (continueChoice.toLowerCase() !== 'y' && continueChoice.toLowerCase() !== 'yes') {
      console.log('\n👋 להתראות!');
      break;
    }
  }
  
  readline.close();
}

async function runBatchMode() {
  console.log('🚀 מריץ בדיקה של כל התרחישים...\n');
  
  const transporter = await createTransporter();
  if (!transporter) {
    process.exit(1);
  }
  
  let successCount = 0;
  let totalCount = Object.keys(TEST_SCENARIOS).length;
  
  for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
    console.log(`\n📋 תרחיש ${key}/${totalCount}:`);
    formatScenarioDetails(scenario);
    
    const success = await sendTestEmail(transporter, scenario);
    if (success) {
      successCount++;
    }
    
    // Wait between emails to avoid rate limiting
    if (key < totalCount) {
      console.log('⏳ ממתין 2 שניות...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n📊 סיכום:`);
  console.log(`✅ הצליחו: ${successCount}/${totalCount}`);
  console.log(`❌ נכשלו: ${totalCount - successCount}/${totalCount}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--batch') || args.includes('-b')) {
    await runBatchMode();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('\n🎯 מערכת בדיקת מיילים - תור רם-אל');
    console.log('='.repeat(50));
    console.log('שימוש:');
    console.log('  node test-emails.js          - מצב אינטראקטיבי');
    console.log('  node test-emails.js --batch  - שליחת כל התרחישים');
    console.log('  node test-emails.js --help   - הצגת עזרה');
    console.log('\nדרישות:');
    console.log('  EMAIL_USER=your-email@gmail.com');
    console.log('  EMAIL_PASSWORD=your-app-password');
  } else {
    await runInteractiveMode();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 יציאה...');
  process.exit(0);
});

main().catch(console.error);
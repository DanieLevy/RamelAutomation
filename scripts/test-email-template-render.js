require('dotenv').config({ path: '.env.local' });
const { generateAppointmentNotificationEmail } = require('../lib/emailTemplates/appointmentNotification');

async function testEmailTemplateRendering() {
  console.log('🧪 Testing email template rendering...\n');
  
  // Test data
  const testCases = [
    {
      name: 'Single appointment with multiple times',
      appointments: [
        {
          date: '2025-07-15',
          available: true,
          times: ['09:00', '10:30', '14:00', '15:30']
        }
      ],
      actionToken: 'test-action-token-123',
      notificationId: 'test-notification-id'
    },
    {
      name: 'Multiple appointments across different dates',
      appointments: [
        {
          date: '2025-07-15',
          available: true,
          times: ['09:00', '10:30']
        },
        {
          date: '2025-07-17',
          available: true,
          times: ['11:00', '14:00', '16:00']
        },
        {
          date: '2025-07-20',
          available: true,
          times: ['13:00']
        }
      ],
      actionToken: 'test-action-token-789',
      notificationId: 'test-notification-id-2'
    },
    {
      name: 'Single appointment with one time slot',
      appointments: [
        {
          date: '2025-07-25',
          available: true,
          times: ['15:00']
        }
      ],
      actionToken: 'test-action-token-345',
      notificationId: 'test-notification-id-3'
    }
  ];
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tor-ramel.netlify.app';
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log('━'.repeat(60));
    
    try {
      // Generate the email
      const email = generateAppointmentNotificationEmail({
        appointments: testCase.appointments,
        actionToken: testCase.actionToken,
        notificationId: testCase.notificationId,
        baseUrl: baseUrl
      });
      
      console.log('📧 Subject:', email.subject);
      console.log('\n📝 Text Version Preview:');
      console.log('─'.repeat(40));
      console.log(email.text.substring(0, 300) + '...');
      console.log('─'.repeat(40));
      
      // Check that HTML contains expected elements
      const htmlChecks = [
        { 
          name: 'Continue button', 
          check: email.html.includes(`token=${testCase.actionToken}&action=continue`) 
        },
        { 
          name: 'Stop button', 
          check: email.html.includes(`token=${testCase.actionToken}&action=stop`) 
        },
        { 
          name: 'Appointment dates', 
          check: testCase.appointments.every(apt => email.html.includes(apt.date)) 
        },
        { 
          name: 'Appointment times', 
          check: testCase.appointments.every(apt => 
            apt.times.every(time => email.html.includes(time))
          ) 
        },
        { 
          name: 'RTL direction', 
          check: email.html.includes('dir="rtl"') 
        },
        { 
          name: 'Hebrew text', 
          check: email.html.includes('נמצאו תורים פנויים') 
        },
        {
          name: 'Booking links',
          check: testCase.appointments.every(apt => 
            email.html.includes(generateBookingUrl(apt.date))
          )
        }
      ];
      
      console.log('\n✅ HTML Validation:');
      htmlChecks.forEach(check => {
        console.log(`   ${check.check ? '✅' : '❌'} ${check.name}`);
      });
      
      // Save HTML to file for visual inspection
      const fs = require('fs');
      const filename = `test-email-${testCase.name.replace(/\s+/g, '-').toLowerCase()}.html`;
      fs.writeFileSync(filename, email.html);
      console.log(`\n💾 HTML saved to: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Error rendering template: ${error.message}`);
    }
  }
  
  // Test edge cases
  console.log('\n\n🔍 Testing edge cases...');
  
  // Empty appointments
  try {
    console.log('\n📋 Edge Case: Empty appointments array');
    const email = generateAppointmentNotificationEmail({
      appointments: [],
      actionToken: 'token1',
      notificationId: 'id1',
      baseUrl: baseUrl
    });
    console.log(`   Subject: ${email.subject}`);
    console.log('   ✅ Handled empty appointments (shows 0 תורים)');
  } catch (error) {
    console.log('   ❌ Error with empty appointments:', error.message);
  }
  
  // Appointment with no times
  try {
    console.log('\n📋 Edge Case: Appointment with empty times array');
    const email = generateAppointmentNotificationEmail({
      appointments: [{date: '2025-07-15', available: true, times: []}],
      actionToken: 'token2',
      notificationId: 'id2',
      baseUrl: baseUrl
    });
    console.log('   ✅ Handled appointment with no times');
  } catch (error) {
    console.log('   ❌ Error with empty times:', error.message);
  }
  
  console.log('\n\n✅ Email template testing completed!');
  console.log('📌 Check the generated HTML files to visually inspect the emails');
}

// Helper function used in tests
function generateBookingUrl(dateStr) {
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
}

// Run the tests
testEmailTemplateRendering().catch(console.error); 
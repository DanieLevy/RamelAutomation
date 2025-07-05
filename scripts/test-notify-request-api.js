require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const baseUrl = 'https://tor-ramel.netlify.app';

async function testNotifyRequestAPI() {
  console.log('🧪 Testing /api/notify-request endpoint comprehensively...\n');
  
  const testCases = [
    // Valid single day subscription
    {
      name: '✅ Valid single day subscription',
      data: {
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
      },
      expectSuccess: true
    },
    
    // Valid date range subscription
    {
      name: '✅ Valid date range subscription',
      data: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days
        dateEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +14 days
      },
      expectSuccess: true
    },
    
    // Invalid email
    {
      name: '❌ Invalid email format',
      data: {
        email: 'notanemail',
        subscriptionType: 'single',
        targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectSuccess: false,
      expectedError: 'כתובת מייל לא תקינה'
    },
    
    // Missing email
    {
      name: '❌ Missing email',
      data: {
        subscriptionType: 'single',
        targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectSuccess: false,
      expectedError: 'כתובת מייל לא תקינה'
    },
    
    // Invalid subscription type
    {
      name: '❌ Invalid subscription type',
      data: {
        email: 'test@example.com',
        subscriptionType: 'invalid',
        targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectSuccess: false,
      expectedError: 'סוג מינוי לא תקין'
    },
    
    // Past date for single subscription
    {
      name: '❌ Past date for single subscription',
      data: {
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Yesterday
      },
      expectSuccess: false,
      expectedError: 'לא ניתן לבחור תאריך שעבר'
    },
    
    // Missing dates for range subscription
    {
      name: '❌ Missing dates for range subscription',
      data: {
        email: 'test@example.com',
        subscriptionType: 'range'
      },
      expectSuccess: false,
      expectedError: 'יש לבחור טווח תאריכים'
    },
    
    // Date range exceeds 30 days
    {
      name: '❌ Date range exceeds 30 days',
      data: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateEnd: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectSuccess: false,
      expectedError: 'טווח התאריכים לא יכול לעלות על 30 יום'
    },
    
    // End date before start date
    {
      name: '❌ End date before start date',
      data: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      expectSuccess: false,
      expectedError: 'תאריך סיום חייב להיות אחרי תאריך התחלה'
    }
  ];
  
  // Run all test cases
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`   Data: ${JSON.stringify(testCase.data)}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/notify-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });
      
      const result = await response.json();
      
      if (testCase.expectSuccess) {
        if (result.success) {
          console.log(`   ✅ Success as expected: ${result.message}`);
          
          // Verify database record was created
          if (result.subscription && result.subscription.id) {
            const { data: dbRecord } = await supabase
              .from('notifications_simple')
              .select('*')
              .eq('id', result.subscription.id)
              .single();
            
            if (dbRecord) {
              console.log(`   ✅ Database record verified`);
              
              // Clean up test data
              await supabase
                .from('notifications_simple')
                .delete()
                .eq('id', result.subscription.id);
              
              console.log(`   🧹 Test data cleaned up`);
            }
          }
        } else {
          console.log(`   ❌ Expected success but got error: ${result.error}`);
        }
      } else {
        if (!result.success) {
          if (result.error === testCase.expectedError) {
            console.log(`   ✅ Got expected error: ${result.error}`);
          } else {
            console.log(`   ⚠️  Got different error: ${result.error} (expected: ${testCase.expectedError})`);
          }
        } else {
          console.log(`   ❌ Expected error but got success`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }
  
  // Test duplicate subscription prevention
  console.log('\n\n🔍 Testing duplicate subscription prevention...');
  const testEmail = 'duplicate-test@example.com';
  const testDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  try {
    // Create first subscription
    const response1 = await fetch(`${baseUrl}/api/notify-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        subscriptionType: 'single',
        targetDate: testDate
      })
    });
    
    const result1 = await response1.json();
    if (result1.success) {
      console.log('   ✅ First subscription created');
      
      // Try to create duplicate
      const response2 = await fetch(`${baseUrl}/api/notify-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          subscriptionType: 'single',
          targetDate: testDate
        })
      });
      
      const result2 = await response2.json();
      if (!result2.success && result2.error === 'כבר קיים מינוי פעיל לתאריך זה') {
        console.log('   ✅ Duplicate prevention working correctly');
      } else {
        console.log('   ❌ Duplicate prevention failed');
      }
      
      // Clean up
      await supabase
        .from('notifications_simple')
        .delete()
        .eq('email', testEmail);
      
      console.log('   🧹 Test data cleaned up');
    }
  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}`);
  }
  
  console.log('\n\n✅ API testing completed!');
}

// Run the tests
testNotifyRequestAPI().catch(console.error); 
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testSimplifiedNotifications() {
  console.log('🧪 Testing Simplified Notification System\n');
  
  // Test 1: Create single day subscription
  console.log('1️⃣ Testing single day subscription...');
  try {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 7); // 7 days from now
    
    const response = await fetch(`${BASE_URL}/api/notify-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: targetDate.toISOString().split('T')[0]
      })
    });
    
    const data = await response.json();
    console.log('✅ Single day subscription:', data);
  } catch (error) {
    console.error('❌ Single day subscription failed:', error);
  }
  
  // Test 2: Create date range subscription
  console.log('\n2️⃣ Testing date range subscription...');
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Tomorrow
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 14); // 2 weeks
    
    const response = await fetch(`${BASE_URL}/api/notify-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test2@example.com',
        subscriptionType: 'range',
        dateStart: startDate.toISOString().split('T')[0],
        dateEnd: endDate.toISOString().split('T')[0]
      })
    });
    
    const data = await response.json();
    console.log('✅ Date range subscription:', data);
  } catch (error) {
    console.error('❌ Date range subscription failed:', error);
  }
  
  // Test 3: Test process-notifications with sample appointments
  console.log('\n3️⃣ Testing notification processing...');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const appointments = [
      {
        date: tomorrow.toISOString().split('T')[0],
        available: true,
        times: ['09:00', '10:30', '14:00']
      },
      {
        date: nextWeek.toISOString().split('T')[0],
        available: true,
        times: ['11:00', '15:30']
      }
    ];
    
    const response = await fetch(`${BASE_URL}/api/process-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointments })
    });
    
    const data = await response.json();
    console.log('✅ Process notifications result:', data);
  } catch (error) {
    console.error('❌ Process notifications failed:', error);
  }
  
  // Test 4: Test notification action (continue)
  console.log('\n4️⃣ Testing notification action...');
  console.log('⚠️  Note: You need a valid action token from an email to test this properly');
  console.log('    Example URL: /api/notification-action?token=XXXX&action=continue');
  
  // Test 5: Test unsubscribe
  console.log('\n5️⃣ Testing unsubscribe...');
  console.log('⚠️  Note: You need a valid stop_token from the database to test this properly');
  console.log('    Example URL: /api/unsubscribe?token=XXXX');
  
  console.log('\n✅ Test script completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Run the SQL migration in Supabase');
  console.log('2. Check the Supabase dashboard for created records');
  console.log('3. Test with real email addresses to receive notifications');
  console.log('4. Monitor the auto-check function logs in Netlify');
}

// Run tests
testSimplifiedNotifications().catch(console.error); 
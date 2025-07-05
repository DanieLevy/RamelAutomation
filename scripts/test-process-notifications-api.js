require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const baseUrl = 'https://tor-ramel.netlify.app';

async function testProcessNotificationsAPI() {
  console.log('🧪 Testing /api/process-notifications endpoint...\n');
  
  // First, create test subscriptions
  console.log('📋 Setting up test subscriptions...');
  
  const testEmail = 'process-test@example.com';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  
  // Create subscriptions directly in database
  const { data: singleSub, error: singleError } = await supabase
    .from('notifications_simple')
    .insert({
      email: testEmail,
      subscription_type: 'single',
      target_date: tomorrowStr,
      status: 'active'
    })
    .select()
    .single();
  
  if (singleError) {
    console.error('Failed to create test subscription:', singleError);
    return;
  }
  
  const { data: rangeSub, error: rangeError } = await supabase
    .from('notifications_simple')
    .insert({
      email: testEmail,
      subscription_type: 'range',
      date_start: tomorrowStr,
      date_end: nextWeekStr,
      status: 'active'
    })
    .select()
    .single();
  
  if (rangeError) {
    console.error('Failed to create range subscription:', rangeError);
    return;
  }
  
  console.log('✅ Test subscriptions created');
  
  // Test 1: Process with appointments matching subscriptions
  console.log('\n🔍 Test 1: Processing with matching appointments...');
  
  const mockAppointments = [
    { date: tomorrowStr, available: true, times: ['09:00', '10:30', '14:00'] },
    { date: nextWeekStr, available: true, times: ['11:00', '15:30'] }
  ];
  
  try {
    const response = await fetch(`${baseUrl}/api/process-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
      },
      body: JSON.stringify({ appointments: mockAppointments })
    });
    
    const result = await response.json();
    console.log('   Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`   ✅ Processing successful`);
      console.log(`   📧 Emails queued: ${result.emailsQueued || 0}`);
      console.log(`   📧 Emails sent: ${result.emailsSent || 0}`);
      console.log(`   📧 Emails skipped: ${result.emailsSkipped || 0}`);
      
      // Check sent_appointments table
      const { data: sentAppointments } = await supabase
        .from('sent_appointments')
        .select('*')
        .or(`notification_id.eq.${singleSub.id},notification_id.eq.${rangeSub.id}`)
        .order('sent_at', { ascending: false });
      
      console.log(`   📊 Sent appointments tracked: ${sentAppointments?.length || 0}`);
      
      // Check email queue
      const { data: emailQueue } = await supabase
        .from('email_queue')
        .select('id, email_to, status, email_subject')
        .eq('email_to', testEmail)
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log(`   📬 Emails in queue: ${emailQueue?.length || 0}`);
      emailQueue?.forEach(email => {
        console.log(`      - ${email.email_subject} (${email.status})`);
      });
    }
  } catch (error) {
    console.error('   ❌ Test failed:', error.message);
  }
  
  // Test 2: Try processing same appointments again (should skip)
  console.log('\n🔍 Test 2: Re-processing same appointments (duplicate prevention)...');
  
  try {
    const response = await fetch(`${baseUrl}/api/process-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
      },
      body: JSON.stringify({ appointments: mockAppointments })
    });
    
    const result = await response.json();
    
    if (result.success && result.emailsSkipped > 0) {
      console.log(`   ✅ Duplicate prevention working: ${result.emailsSkipped} emails skipped`);
    } else {
      console.log(`   ⚠️  Unexpected result:`, result);
    }
  } catch (error) {
    console.error('   ❌ Test failed:', error.message);
  }
  
  // Test 3: Process with no appointments
  console.log('\n🔍 Test 3: Processing with no appointments...');
  
  try {
    const response = await fetch(`${baseUrl}/api/process-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
      },
      body: JSON.stringify({ appointments: [] })
    });
    
    const result = await response.json();
    
    if (result.success && result.message.includes('No appointments')) {
      console.log('   ✅ Correctly handled no appointments');
    } else {
      console.log('   ⚠️  Unexpected result:', result);
    }
  } catch (error) {
    console.error('   ❌ Test failed:', error.message);
  }
  
  // Test 4: Invalid authorization
  console.log('\n🔍 Test 4: Testing authorization...');
  
  try {
    const response = await fetch(`${baseUrl}/api/process-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({ appointments: mockAppointments })
    });
    
    if (response.status === 401) {
      console.log('   ✅ Authorization check working correctly');
    } else {
      console.log(`   ⚠️  Expected 401 but got ${response.status}`);
    }
  } catch (error) {
    console.error('   ❌ Test failed:', error.message);
  }
  
  // Test 5: Check user notification actions
  console.log('\n🔍 Test 5: Checking user notification actions...');
  
  const { data: userActions } = await supabase
    .from('user_notification_actions')
    .select('*')
    .or(`notification_id.eq.${singleSub.id},notification_id.eq.${rangeSub.id}`)
    .order('created_at', { ascending: false });
  
  console.log(`   📊 User actions created: ${userActions?.length || 0}`);
  userActions?.forEach(action => {
    console.log(`      - Action: ${action.action}, Token: ${action.action_token}`);
  });
  
  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete subscriptions (this will cascade delete related records)
  await supabase
    .from('notifications_simple')
    .delete()
    .eq('email', testEmail);
  
  // Delete any emails from queue
  await supabase
    .from('email_queue')
    .delete()
    .eq('email_to', testEmail);
  
  console.log('✅ Test data cleaned up');
  console.log('\n✅ Process notifications API testing completed!');
}

// Run the tests
testProcessNotificationsAPI().catch(console.error); 
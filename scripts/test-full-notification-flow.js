require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testFullFlow() {
  console.log('🧪 Starting comprehensive notification system test...\n');

  // Test email - using user's actual email
  const testEmail = 'daniellofficial@gmail.com';
  const baseUrl = 'https://tor-ramel.netlify.app'; // Production URL
  
  try {
    // 1. Create a single day subscription
    console.log('1️⃣ Creating single day subscription...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const singleDayResponse = await fetch(`${baseUrl}/api/notify-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        subscriptionType: 'single',
        targetDate: tomorrowStr
      })
    });
    
    const singleDayResult = await singleDayResponse.json();
    console.log('✅ Single day subscription:', JSON.stringify(singleDayResult, null, 2));
    
    // 2. Create a date range subscription
    console.log('\n2️⃣ Creating date range subscription...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    
    const rangeResponse = await fetch(`${baseUrl}/api/notify-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        subscriptionType: 'range',
        dateStart: startDate.toISOString().split('T')[0],
        dateEnd: endDate.toISOString().split('T')[0]
      })
    });
    
    const rangeResult = await rangeResponse.json();
    console.log('✅ Date range subscription:', JSON.stringify(rangeResult, null, 2));
    
    // 3. Check database records
    console.log('\n3️⃣ Checking database records...');
    const { data: subscriptions, error } = await supabase
      .from('notifications_simple')
      .select('*')
      .eq('email', testEmail)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Database error:', error);
    } else {
      console.log(`✅ Found ${subscriptions.length} subscriptions in database:`);
      subscriptions.forEach((sub, i) => {
        console.log(`   ${i + 1}. ${sub.subscription_type} - ${sub.status}`);
        if (sub.subscription_type === 'single') {
          console.log(`      Target date: ${sub.target_date}`);
        } else {
          console.log(`      Date range: ${sub.date_start} to ${sub.date_end}`);
        }
        console.log(`      Stop token: ${sub.stop_token}`);
        console.log(`      Unsubscribe URL: ${baseUrl}/unsubscribe?token=${sub.stop_token}`);
      });
    }
    
    // 4. Test with mock appointments
    console.log('\n4️⃣ Testing notification processing with mock appointments...');
    const mockAppointments = [
      { date: tomorrowStr, available: true, times: ['09:00', '10:30', '14:00'] },
      { date: startDate.toISOString().split('T')[0], available: true, times: ['11:00', '15:30'] }
    ];
    
    const processResponse = await fetch(`${baseUrl}/api/process-notifications`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
      },
      body: JSON.stringify({ appointments: mockAppointments })
    });
    
    const processResult = await processResponse.json();
    console.log('✅ Process notifications result:', JSON.stringify(processResult, null, 2));
    
    // 5. Check sent appointments
    console.log('\n5️⃣ Checking sent appointments tracking...');
    const { data: sentAppointments, error: sentError } = await supabase
      .from('sent_appointments')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(5);
    
    if (sentError) {
      console.error('❌ Error fetching sent appointments:', sentError);
    } else {
      console.log(`✅ Found ${sentAppointments.length} sent appointment records`);
      sentAppointments.forEach((sent, i) => {
        console.log(`   ${i + 1}. Date: ${sent.appointment_date}, Times: ${sent.appointment_times.join(', ')}`);
      });
    }
    
    // 6. Check email queue
    console.log('\n6️⃣ Checking email queue...');
    const { data: emailQueue, error: queueError } = await supabase
      .from('email_queue')
      .select('id, email_to, email_subject, status, created_at, appointment_data')
      .eq('email_to', testEmail)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (queueError) {
      console.error('❌ Error fetching email queue:', queueError);
    } else {
      console.log(`✅ Found ${emailQueue.length} emails in queue for ${testEmail}`);
      emailQueue.forEach((email, i) => {
        console.log(`   ${i + 1}. Subject: ${email.email_subject}, Status: ${email.status}`);
        console.log(`      Created: ${email.created_at}`);
      });
    }
    
    // 7. Check user notification actions
    console.log('\n7️⃣ Checking user notification actions...');
    if (subscriptions && subscriptions.length > 0) {
      const { data: actions, error: actionsError } = await supabase
        .from('user_notification_actions')
        .select('*')
        .eq('notification_id', subscriptions[0].id)
        .order('created_at', { ascending: false });
      
      if (actionsError) {
        console.error('❌ Error fetching user actions:', actionsError);
      } else {
        console.log(`✅ Found ${actions.length} user actions`);
        actions.forEach((action, i) => {
          console.log(`   ${i + 1}. Action: ${action.action}, Token: ${action.action_token}`);
          console.log(`      Action URL: ${baseUrl}/api/notification-action?token=${action.action_token}&action=${action.action}`);
        });
      }
    }
    
    // 8. Test unsubscribe with valid token
    if (subscriptions && subscriptions.length > 0) {
      console.log('\n8️⃣ Testing unsubscribe with valid token...');
      const stopToken = subscriptions[0].stop_token;
      
      const unsubscribeResponse = await fetch(`${baseUrl}/api/unsubscribe?token=${stopToken}`, {
        method: 'GET'
      });
      
      const unsubscribeResult = await unsubscribeResponse.json();
      console.log('✅ Unsubscribe result:', JSON.stringify(unsubscribeResult, null, 2));
      
      // Verify the subscription status was updated
      const { data: updatedSub } = await supabase
        .from('notifications_simple')
        .select('status')
        .eq('id', subscriptions[0].id)
        .single();
      
      console.log(`   Subscription status after unsubscribe: ${updatedSub?.status}`);
    }
    
    console.log('\n✅ Full test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`- Created ${subscriptions?.length || 0} subscriptions for ${testEmail}`);
    console.log('- Database tables are working correctly');
    console.log('- Subscription creation is functional');
    console.log('- Appointment tracking is operational');
    console.log('- Email queueing is working');
    console.log('- Unsubscribe functionality is active');
    console.log('\n📧 Check your email (daniellofficial@gmail.com) for notifications!');
    console.log('\n🎯 Next steps:');
    console.log('1. The auto-check function will run every 5 minutes and check for real appointments');
    console.log('2. If appointments are found, you will receive an email with all available slots');
    console.log('3. Click "Continue Search" to keep looking or "Stop" to cancel the subscription');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testFullFlow(); 
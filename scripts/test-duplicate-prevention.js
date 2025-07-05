require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testDuplicatePrevention() {
  console.log('🧪 Testing duplicate notification prevention...\n');
  
  const testEmail = 'duplicate-test@example.com';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  try {
    // Step 1: Create a test subscription
    console.log('1️⃣ Creating test subscription...');
    const { data: subscription, error: subError } = await supabase
      .from('notifications_simple')
      .insert({
        email: testEmail,
        subscription_type: 'single',
        target_date: tomorrowStr,
        status: 'active'
      })
      .select()
      .single();
    
    if (subError) {
      console.error('Failed to create subscription:', subError);
      return;
    }
    
    console.log(`✅ Subscription created: ${subscription.id}`);
    
    // Step 2: Simulate sending first notification
    console.log('\n2️⃣ Simulating first notification...');
    const appointment1 = {
      date: tomorrowStr,
      times: ['09:00', '10:30', '14:00']
    };
    
    const { data: sent1, error: sentError1 } = await supabase
      .from('sent_appointments')
      .insert({
        notification_id: subscription.id,
        appointment_date: appointment1.date,
        appointment_times: appointment1.times
      })
      .select()
      .single();
    
    if (sentError1) {
      console.error('Failed to record first notification:', sentError1);
    } else {
      console.log('✅ First notification recorded');
    }
    
    // Step 3: Try to send the same appointment again (should fail)
    console.log('\n3️⃣ Attempting to send duplicate notification...');
    const { data: sent2, error: sentError2 } = await supabase
      .from('sent_appointments')
      .insert({
        notification_id: subscription.id,
        appointment_date: appointment1.date,
        appointment_times: appointment1.times
      })
      .select()
      .single();
    
    if (sentError2) {
      console.log('✅ Duplicate prevention worked! Error:', sentError2.message);
    } else {
      console.log('❌ Duplicate prevention failed - record was created');
    }
    
    // Step 4: Try with slightly different times (should succeed)
    console.log('\n4️⃣ Sending notification with different times...');
    const appointment2 = {
      date: tomorrowStr,
      times: ['09:00', '11:00', '15:30'] // Different set of times
    };
    
    const { data: sent3, error: sentError3 } = await supabase
      .from('sent_appointments')
      .insert({
        notification_id: subscription.id,
        appointment_date: appointment2.date,
        appointment_times: appointment2.times
      })
      .select()
      .single();
    
    if (sentError3) {
      console.log('❌ Failed to send different times:', sentError3.message);
    } else {
      console.log('✅ Different times notification recorded successfully');
    }
    
    // Step 5: Check what's been tracked
    console.log('\n5️⃣ Checking tracked appointments...');
    const { data: allSent, error: fetchError } = await supabase
      .from('sent_appointments')
      .select('*')
      .eq('notification_id', subscription.id)
      .order('sent_at', { ascending: false });
    
    if (fetchError) {
      console.error('Failed to fetch sent appointments:', fetchError);
    } else {
      console.log(`\n📊 Total tracked appointments: ${allSent.length}`);
      allSent.forEach((sent, idx) => {
        console.log(`   ${idx + 1}. Date: ${sent.appointment_date}, Times: [${sent.appointment_times.join(', ')}]`);
      });
    }
    
    // Step 6: Test with different subscription (should work)
    console.log('\n6️⃣ Testing with different subscription...');
    const { data: subscription2 } = await supabase
      .from('notifications_simple')
      .insert({
        email: 'another-test@example.com',
        subscription_type: 'single',
        target_date: tomorrowStr,
        status: 'active'
      })
      .select()
      .single();
    
    if (subscription2) {
      const { error: sentError4 } = await supabase
        .from('sent_appointments')
        .insert({
          notification_id: subscription2.id,
          appointment_date: appointment1.date,
          appointment_times: appointment1.times // Same times as first subscription
        });
      
      if (sentError4) {
        console.log('❌ Failed to send to different subscription:', sentError4.message);
      } else {
        console.log('✅ Same appointment sent to different subscription successfully');
      }
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase
      .from('notifications_simple')
      .delete()
      .or(`email.eq.${testEmail},email.eq.another-test@example.com`);
    
    console.log('✅ Test data cleaned up');
    console.log('\n\n✅ Duplicate prevention testing completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDuplicatePrevention().catch(console.error); 
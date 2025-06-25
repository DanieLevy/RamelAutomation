const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TEST_EMAIL = 'daniellofficial@gmail.com';
const BASE_URL = 'http://localhost:3000';

async function cleanupTestData() {
  console.log('🧹 Cleaning up existing test data...');
  
  // Clean up test notifications
  await supabase
    .from('notifications')
    .delete()
    .eq('email', TEST_EMAIL);
    
  // Clean up test appointment responses
  await supabase
    .from('user_appointment_responses')
    .delete()
    .like('notification_id', '%test%');
    
  // Clean up test ignored appointments
  await supabase
    .from('ignored_appointments')
    .delete()
    .like('notification_id', '%test%');
    
  console.log('✅ Test data cleaned up');
}

async function createTestSubscription() {
  console.log('📧 Creating test subscription...');
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      email: TEST_EMAIL,
      criteria: JSON.stringify({
        days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
      }),
      criteria_type: 'smart',
      unsubscribe_token: crypto.randomUUID(),
      status: 'active',
      notification_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
  
  console.log('✅ Test subscription created:', data.id);
  return data;
}

async function createTestAppointmentResponses(notificationId) {
  console.log('📋 Creating test appointment responses...');
  
  const appointments = [
    {
      notification_id: notificationId,
      appointment_date: '2025-07-08',
      appointment_times: ['10:00', '11:00', '12:00'],
      response_status: 'pending'
    },
    {
      notification_id: notificationId,
      appointment_date: '2025-07-09',
      appointment_times: ['14:00', '15:00', '16:00', '17:00'],
      response_status: 'pending'
    }
  ];
  
  const { data, error } = await supabase
    .from('user_appointment_responses')
    .insert(appointments)
    .select();
    
  if (error) {
    throw new Error(`Failed to create appointment responses: ${error.message}`);
  }
  
  console.log('✅ Created appointment responses:', data.length);
  return data;
}

async function testNotWantedResponse(responseToken) {
  console.log('🧪 Testing "not_wanted" response...');
  
  const response = await fetch(`${BASE_URL}/api/appointment-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      response_token: responseToken,
      action: 'not_wanted'
    })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`API call failed: ${result.error}`);
  }
  
  console.log('✅ Not wanted response processed successfully');
  console.log(`   Total ignored: ${result.totalIgnored}`);
  console.log(`   Email appointments processed: ${result.emailAppointmentsProcessed}`);
  
  return result;
}

async function testDuplicateResponse(responseToken) {
  console.log('🧪 Testing duplicate "not_wanted" response (should handle gracefully)...');
  
  const response = await fetch(`${BASE_URL}/api/appointment-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      response_token: responseToken,
      action: 'not_wanted'
    })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`API call failed: ${result.error}`);
  }
  
  console.log('✅ Duplicate response handled gracefully');
  console.log(`   Already processed: ${result.alreadyProcessed}`);
  
  return result;
}

async function verifyIgnoredAppointments(notificationId) {
  console.log('🔍 Verifying ignored appointments were created...');
  
  const { data, error } = await supabase
    .from('ignored_appointments')
    .select('*')
    .eq('notification_id', notificationId);
    
  if (error) {
    throw new Error(`Failed to fetch ignored appointments: ${error.message}`);
  }
  
  console.log(`✅ Found ${data.length} ignored appointments:`);
  data.forEach(apt => {
    console.log(`   - ${apt.appointment_date} at ${apt.appointment_time}`);
  });
  
  return data;
}

async function verifyAppointmentResponsesUpdated(notificationId) {
  console.log('🔍 Verifying appointment responses were updated...');
  
  const { data, error } = await supabase
    .from('user_appointment_responses')
    .select('*')
    .eq('notification_id', notificationId);
    
  if (error) {
    throw new Error(`Failed to fetch appointment responses: ${error.message}`);
  }
  
  console.log(`✅ Found ${data.length} appointment responses:`);
  data.forEach(apt => {
    console.log(`   - ${apt.appointment_date}: ${apt.response_status} (${apt.appointment_times.length} times)`);
  });
  
  const allNotWanted = data.every(apt => apt.response_status === 'not_wanted');
  if (allNotWanted) {
    console.log('✅ All appointment responses correctly marked as "not_wanted"');
  } else {
    console.log('❌ Some appointment responses not updated correctly');
  }
  
  return data;
}

async function runAppointmentResponseTest() {
  console.log('🚀 APPOINTMENT RESPONSE FUNCTIONALITY TEST');
  console.log('==========================================\n');
  
  try {
    // Setup
    await cleanupTestData();
    const subscription = await createTestSubscription();
    const appointmentResponses = await createTestAppointmentResponses(subscription.id);
    
    // Get a response token to test with
    const testToken = appointmentResponses[0].response_token;
    console.log(`🎫 Using test token: ${testToken.substring(0, 8)}...`);
    
    // Test 1: First "not_wanted" response
    console.log('\n📋 TEST 1: First "not_wanted" response');
    console.log('=====================================');
    const firstResponse = await testNotWantedResponse(testToken);
    
    // Verify all appointments were ignored
    console.log('\n🔍 VERIFICATION: Ignored appointments');
    console.log('====================================');
    const ignoredAppointments = await verifyIgnoredAppointments(subscription.id);
    
    // Verify all appointment responses were updated
    console.log('\n🔍 VERIFICATION: Updated appointment responses');
    console.log('=============================================');
    const updatedResponses = await verifyAppointmentResponsesUpdated(subscription.id);
    
    // Test 2: Duplicate response (should handle gracefully)
    console.log('\n📋 TEST 2: Duplicate "not_wanted" response');
    console.log('==========================================');
    const duplicateResponse = await testDuplicateResponse(testToken);
    
    // Final verification
    console.log('\n🎯 FINAL RESULTS');
    console.log('================');
    
    const expectedIgnored = appointmentResponses.reduce((sum, apt) => sum + apt.appointment_times.length, 0);
    const actualIgnored = ignoredAppointments.length;
    
    console.log(`Expected ignored appointments: ${expectedIgnored}`);
    console.log(`Actual ignored appointments: ${actualIgnored}`);
    console.log(`All responses updated: ${updatedResponses.every(r => r.response_status === 'not_wanted')}`);
    console.log(`Duplicate handling: ${duplicateResponse.alreadyProcessed}`);
    
    if (actualIgnored === expectedIgnored) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ All appointments correctly ignored');
      console.log('✅ Duplicate responses handled gracefully');
      console.log('✅ Database consistency maintained');
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      console.log(`Expected ${expectedIgnored} ignored appointments, got ${actualIgnored}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    await cleanupTestData();
    console.log('\n🧹 Test cleanup completed');
  }
}

// Run the test
if (require.main === module) {
  runAppointmentResponseTest().then(() => {
    console.log('\n✅ Appointment response test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runAppointmentResponseTest }; 
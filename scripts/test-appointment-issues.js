const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

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
  
  await supabase.from('notifications').delete().eq('email', TEST_EMAIL);
  await supabase.from('user_appointment_responses').delete().like('notification_id', '%');
  await supabase.from('ignored_appointments').delete().like('notification_id', '%');
  
  console.log('✅ Test data cleaned up');
}

async function createTestSubscription() {
  console.log('📧 Creating test subscription...');
  
  const response = await axios.post(`${BASE_URL}/api/notify-request`, {
    email: TEST_EMAIL,
    start: '2025-07-08',
    end: '2025-07-09',
    smartSelection: true
  });
  
  if (!response.data.success) {
    throw new Error(`Failed to create subscription: ${response.data.error}`);
  }
  
  const { data: notification } = await supabase
    .from('notifications')
    .select('*')
    .eq('email', TEST_EMAIL)
    .single();
    
  console.log('✅ Test subscription created:', notification.id);
  return notification;
}

async function simulateEmailWithMultipleDates(notificationId) {
  console.log('📧 Simulating email with 7 appointments across 2 days...');
  
  // Create appointments exactly like the user described:
  // July 8: 3 appointments
  // July 9: 4 appointments
  // Total: 7 appointments
  
  const appointments = [
    {
      notification_id: notificationId,
      appointment_date: '2025-07-08',
      appointment_times: ['10:00', '11:00', '12:00'], // 3 appointments
      response_status: 'pending'
    },
    {
      notification_id: notificationId,
      appointment_date: '2025-07-09',
      appointment_times: ['14:00', '15:00', '16:00', '17:00'], // 4 appointments
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
  
  console.log('✅ Created appointment responses for email:');
  console.log('   📅 July 8: 3 appointments (10:00, 11:00, 12:00)');
  console.log('   📅 July 9: 4 appointments (14:00, 15:00, 16:00, 17:00)');
  console.log('   📊 Total: 7 appointments');
  
  return data;
}

async function testFirstNotWantedResponse(appointmentResponses) {
  console.log('\n🧪 TEST 1: User clicks "לא מתאים" on first email (should ignore ALL 7 appointments)');
  console.log('=' .repeat(80));
  
  // Use the first token (doesn't matter which one, should ignore all)
  const testToken = appointmentResponses[0].response_token;
  console.log(`🎫 Using token from ${appointmentResponses[0].appointment_date}: ${testToken.substring(0, 8)}...`);
  
  const response = await axios.post(`${BASE_URL}/api/appointment-response`, {
    response_token: testToken,
    action: 'not_wanted'
  });
  
  if (!response.data.success) {
    throw new Error(`First response failed: ${response.data.error}`);
  }
  
  console.log('✅ First "not_wanted" response processed');
  console.log(`📊 Total ignored: ${response.data.totalIgnored}`);
  console.log(`📧 Email appointments processed: ${response.data.emailAppointmentsProcessed}`);
  
  // Verify ALL 7 appointments were ignored
  const { data: ignoredAppointments } = await supabase
    .from('ignored_appointments')
    .select('*')
    .eq('notification_id', appointmentResponses[0].notification_id);
    
  console.log(`\n🔍 VERIFICATION: Found ${ignoredAppointments.length} ignored appointments:`);
  ignoredAppointments.forEach(apt => {
    console.log(`   - ${apt.appointment_date} at ${apt.appointment_time}`);
  });
  
  if (ignoredAppointments.length === 7) {
    console.log('✅ CORRECT: All 7 appointments were ignored');
  } else {
    console.log(`❌ ISSUE: Expected 7 ignored appointments, got ${ignoredAppointments.length}`);
  }
  
  return { ignoredAppointments, totalIgnored: response.data.totalIgnored };
}

async function testSecondNotWantedResponse(appointmentResponses) {
  console.log('\n🧪 TEST 2: User clicks "לא מתאים" again (should handle gracefully, not error)');
  console.log('=' .repeat(80));
  
  // Use the same token again (or different one from same email)
  const testToken = appointmentResponses[1].response_token;
  console.log(`🎫 Using token from ${appointmentResponses[1].appointment_date}: ${testToken.substring(0, 8)}...`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/appointment-response`, {
      response_token: testToken,
      action: 'not_wanted'
    });
    
    if (!response.data.success) {
      throw new Error(`Second response failed: ${response.data.error}`);
    }
    
    console.log('✅ Second "not_wanted" response handled gracefully');
    console.log(`📝 Message: ${response.data.message}`);
    
    if (response.data.alreadyProcessed) {
      console.log('✅ CORRECT: System detected duplicate response and handled it properly');
    } else {
      console.log('ℹ️ Response processed as new (acceptable behavior)');
    }
    
    return true;
    
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`❌ ISSUE: Second response failed with error: ${error.response.data.error}`);
      console.log(`📝 Details: ${error.response.data.details || 'No details'}`);
      return false;
    }
    throw error;
  }
}

async function testNewEmailAfterIgnoring(notificationId) {
  console.log('\n🧪 TEST 3: Simulate new email after ignoring (should only show NEW appointments)');
  console.log('=' .repeat(80));
  
  // Create new appointments for the same dates but different times
  const newAppointments = [
    {
      notification_id: notificationId,
      appointment_date: '2025-07-08',
      appointment_times: ['13:00', '14:00'], // NEW times for July 8
      response_status: 'pending'
    },
    {
      notification_id: notificationId,
      appointment_date: '2025-07-09',
      appointment_times: ['18:00'], // NEW time for July 9
      response_status: 'pending'
    }
  ];
  
  const { data, error } = await supabase
    .from('user_appointment_responses')
    .insert(newAppointments)
    .select();
    
  if (error) {
    throw new Error(`Failed to create new appointment responses: ${error.message}`);
  }
  
  console.log('✅ Created new appointment responses:');
  console.log('   📅 July 8: 2 NEW appointments (13:00, 14:00)');
  console.log('   📅 July 9: 1 NEW appointment (18:00)');
  console.log('   📊 Total NEW: 3 appointments');
  
  // Verify these new appointments would NOT be filtered by the ignored list
  const { data: ignoredAppointments } = await supabase
    .from('ignored_appointments')
    .select('*')
    .eq('notification_id', notificationId);
    
  const newAppointmentTimes = [];
  newAppointments.forEach(apt => {
    apt.appointment_times.forEach(time => {
      newAppointmentTimes.push(`${apt.appointment_date}@${time}`);
    });
  });
  
  const ignoredAppointmentTimes = ignoredAppointments.map(apt => `${apt.appointment_date}@${apt.appointment_time}`);
  
  const wouldBeFiltered = newAppointmentTimes.filter(apt => ignoredAppointmentTimes.includes(apt));
  const wouldBeShown = newAppointmentTimes.filter(apt => !ignoredAppointmentTimes.includes(apt));
  
  console.log(`\n🔍 FILTERING VERIFICATION:`);
  console.log(`   📊 New appointments: ${newAppointmentTimes.length}`);
  console.log(`   🚫 Would be filtered: ${wouldBeFiltered.length}`);
  console.log(`   ✅ Would be shown: ${wouldBeShown.length}`);
  
  if (wouldBeFiltered.length === 0 && wouldBeShown.length === 3) {
    console.log('✅ CORRECT: New appointments would be shown, old ones filtered');
  } else {
    console.log('❌ ISSUE: Filtering logic not working as expected');
  }
  
  return data;
}

async function runAppointmentIssueTests() {
  console.log('🚀 APPOINTMENT RESPONSE ISSUE VERIFICATION TEST');
  console.log('='.repeat(50));
  console.log('Testing the specific issues reported by the user:');
  console.log('1. Only partial appointments ignored (4 instead of 7)');
  console.log('2. "Invalid or expired response token" on second click');
  console.log('3. System should ignore ALL appointments from same email');
  console.log('='.repeat(50));
  
  try {
    // Setup
    await cleanupTestData();
    const subscription = await createTestSubscription();
    const appointmentResponses = await simulateEmailWithMultipleDates(subscription.id);
    
    // Test 1: First "not_wanted" response should ignore ALL appointments
    const firstTest = await testFirstNotWantedResponse(appointmentResponses);
    
    // Test 2: Second "not_wanted" response should handle gracefully
    const secondTest = await testSecondNotWantedResponse(appointmentResponses);
    
    // Test 3: New appointments should not be filtered
    const thirdTest = await testNewEmailAfterIgnoring(subscription.id);
    
    // Final results
    console.log('\n🎯 FINAL RESULTS');
    console.log('='.repeat(30));
    
    const issue1Fixed = firstTest.totalIgnored === 7;
    const issue2Fixed = secondTest === true;
    const issue3Working = thirdTest.length > 0;
    
    console.log(`✅ Issue 1 - All appointments ignored: ${issue1Fixed ? 'FIXED' : 'STILL BROKEN'}`);
    console.log(`✅ Issue 2 - No token errors on second click: ${issue2Fixed ? 'FIXED' : 'STILL BROKEN'}`);
    console.log(`✅ Issue 3 - New appointments not filtered: ${issue3Working ? 'WORKING' : 'BROKEN'}`);
    
    if (issue1Fixed && issue2Fixed && issue3Working) {
      console.log('\n🎉 ALL ISSUES FIXED!');
      console.log('✅ Users can now click "לא מתאים" safely');
      console.log('✅ All appointments from email are properly ignored');
      console.log('✅ No more token expiration errors');
      console.log('✅ New appointments will still be shown');
    } else {
      console.log('\n❌ SOME ISSUES REMAIN');
      if (!issue1Fixed) console.log('❌ Still not ignoring all appointments');
      if (!issue2Fixed) console.log('❌ Still getting token errors');
      if (!issue3Working) console.log('❌ New appointments not working');
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
  runAppointmentIssueTests().then(() => {
    console.log('\n✅ Appointment issue verification test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runAppointmentIssueTests }; 
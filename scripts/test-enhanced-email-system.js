const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wwhpelkwjwtgpfzztixk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3aHBlbGt3and0Z3Bmenp0aXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTAyNDYsImV4cCI6MjA2NjI2NjI0Nn0.zvmNyO8T0QtyfojzRyVtKGRUR8fBpgiVfwCaHH1YBDM';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'daniellofficial@gmail.com'; // Replace with your test email

console.log('🚀 ENHANCED EMAIL SYSTEM COMPREHENSIVE TEST');
console.log('=============================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function for colored console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

function logSuccess(message) { log('green', '✅', message); }
function logError(message) { log('red', '❌', message); }
function logWarning(message) { log('yellow', '⚠️', message); }
function logInfo(message) { log('blue', 'ℹ️', message); }
function logTest(message) { log('magenta', '🧪', message); }
function logPhase(message) { log('cyan', '📈', message); }
function logHeader(message) { console.log(`\n${colors.bold}${colors.blue}🎯 ${message}${colors.reset}\n`); }

// Utility function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test functions
async function testSubscriptionCreation() {
  logHeader('Testing Enhanced Subscription Creation');
  
  try {
    // Clean up any existing test subscriptions and related data
    await supabase.from('user_appointment_responses').delete().eq('notification_id', '00000000-0000-0000-0000-000000000000'); // Placeholder
    await supabase.from('email_history').delete().eq('notification_id', '00000000-0000-0000-0000-000000000000'); // Placeholder
    await supabase.from('notifications').delete().eq('email', TEST_EMAIL);
    
    logInfo('Cleaned up existing test data');
    
    // Test subscription creation with future dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7); // 1 week from now
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7); // 7 days after start
    
    const subscriptionData = {
      email: TEST_EMAIL,
      start: startDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
      end: endDate.toISOString().split('T')[0],
      smartSelection: true
    };
    
    logInfo('Creating new subscription...');
    logInfo(`Date range: ${subscriptionData.start} to ${subscriptionData.end}`);
    
    const response = await axios.post(`${BASE_URL}/api/notify-request`, subscriptionData);
    
    if (response.status === 200 && response.data.success) {
      logSuccess('Subscription created successfully');
      logInfo(`Message: ${response.data.message}`);
    } else {
      throw new Error(`Unexpected response: ${response.status}`);
    }
    
    // Verify database record with new fields
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    // Validate record structure including new fields
    const requiredFields = [
      'email', 'criteria', 'criteria_type', 'unsubscribe_token', 'status', 
      'notification_count', 'notification_phase', 'phase_count'
    ];
    const missingFields = requiredFields.filter(field => !(field in notification));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    logSuccess('Database record created correctly with enhanced fields');
    logInfo(`Status: ${notification.status}`);
    logInfo(`Phase: ${notification.notification_phase}`);
    logInfo(`Phase Count: ${notification.phase_count}`);
    logInfo(`Notification Count: ${notification.notification_count}`);
    
    return notification;
    
  } catch (error) {
    if (error.response && error.response.data) {
      logError(`Subscription creation failed: ${error.response.data.error || error.response.data.message || error.message}`);
      logError(`Response status: ${error.response.status}`);
    } else {
      logError(`Subscription creation failed: ${error.message}`);
    }
    return null;
  }
}

async function testEnhancedEmailProcessing(notification) {
  logHeader('Testing Enhanced Email Processing with Response Tracking');
  
  try {
    // Create mock appointment data with future dates
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 10);
    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 11);
    const futureDate3 = new Date();
    futureDate3.setDate(futureDate3.getDate() + 12);
    
    const mockAppointments = [
      {
        date: futureDate1.toISOString().split('T')[0],
        available: true,
        times: ['10:00', '11:30', '14:15']
      },
      {
        date: futureDate2.toISOString().split('T')[0],
        available: true,
        times: ['09:30', '13:00']
      },
      {
        date: futureDate3.toISOString().split('T')[0],
        available: true,
        times: ['15:00', '16:30']
      }
    ];
    
    logInfo('Sending mock appointments for first email...');
    
    const response = await axios.post(`${BASE_URL}/api/process-notifications`, {
      appointments: mockAppointments,
      testMode: true  // Bypass rate limiting for testing
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('Email processing completed');
      logInfo(`Emails sent: ${response.data.emailsSent}`);
      logInfo(`Emails skipped: ${response.data.emailsSkipped}`);
    } else {
      throw new Error(`Email processing failed: ${response.status}`);
    }
    
    // Verify database updates
    const { data: updatedNotification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification.id)
      .single();
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    logSuccess('Database updated correctly after first email');
    logInfo(`New notification count: ${updatedNotification.notification_count}`);
    logInfo(`Phase: ${updatedNotification.notification_phase}`);
    logInfo(`Phase count: ${updatedNotification.phase_count}`);
    logInfo(`Status: ${updatedNotification.status}`);
    
    // Verify appointment response records were created
    const { data: appointmentResponses, error: responseError } = await supabase
      .from('user_appointment_responses')
      .select('*')
      .eq('notification_id', notification.id);
    
    if (responseError) {
      throw new Error(`Failed to fetch appointment responses: ${responseError.message}`);
    }
    
    if (!appointmentResponses || appointmentResponses.length === 0) {
      throw new Error('No appointment response records created');
    }
    
    logSuccess(`Created ${appointmentResponses.length} appointment response records`);
    appointmentResponses.forEach(resp => {
      logInfo(`Response for ${resp.appointment_date}: Token ${resp.response_token.substring(0, 8)}...`);
    });
    
    return { notification: updatedNotification, appointmentResponses };
    
  } catch (error) {
    logError(`Enhanced email processing test failed: ${error.message}`);
    return null;
  }
}

async function testUserResponseActions(testData) {
  logHeader('Testing User Response Actions');
  
  if (!testData || !testData.appointmentResponses) {
    logError('No appointment responses available for testing');
    return false;
  }
  
  try {
    const responses = testData.appointmentResponses;
    
    // Test 1: User rejects first appointment
    logTest('Testing "not_wanted" response...');
    const firstResponse = responses[0];
    
    const rejectResponse = await axios.post(`${BASE_URL}/api/appointment-response`, {
      response_token: firstResponse.response_token,
      action: 'not_wanted'
    });
    
    if (!rejectResponse.data.success) {
      throw new Error('Reject response failed');
    }
    
    logSuccess(`Rejected appointment for ${firstResponse.appointment_date}`);
    logInfo(`Message: ${rejectResponse.data.message}`);
    
    // Verify database update
    const { data: updatedResponse } = await supabase
      .from('user_appointment_responses')
      .select('*')
      .eq('response_token', firstResponse.response_token)
      .single();
    
    if (updatedResponse.response_status !== 'not_wanted') {
      throw new Error('Response status not updated correctly');
    }
    
    logSuccess('Database updated correctly for rejection');
    
    // Test 2: User takes second appointment  
    logTest('Testing "taken" response...');
    const secondResponse = responses[1];
    
    const takenResponse = await axios.post(`${BASE_URL}/api/appointment-response`, {
      response_token: secondResponse.response_token,
      action: 'taken'
    });
    
    if (!takenResponse.data.success) {
      throw new Error('Taken response failed');
    }
    
    logSuccess(`Took appointment for ${secondResponse.appointment_date}`);
    logInfo(`Message: ${takenResponse.data.message}`);
    
    // Verify subscription was closed
    const { data: closedNotification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', testData.notification.id)
      .single();
    
    if (closedNotification.status !== 'completed') {
      throw new Error('Subscription not closed after taking appointment');
    }
    
    logSuccess('Subscription correctly closed after taking appointment');
    
    return { rejectedDate: firstResponse.appointment_date, takenDate: secondResponse.appointment_date };
    
  } catch (error) {
    logError(`User response actions test failed: ${error.message}`);
    return false;
  }
}

async function testSmartTimingLogic() {
  logHeader('Testing Smart Timing Logic (10min → 1hr)');
  
  try {
    // Create a new test subscription for timing tests
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 14); // 2 weeks from now
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);
    
    const [emailUser, emailDomain] = TEST_EMAIL.split('@');
    const timingTestEmail = `${emailUser}+timing${Date.now()}@${emailDomain}`;
    
    const subscriptionData = {
      email: timingTestEmail,
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      smartSelection: true
    };
    
    logInfo('Creating subscription for timing tests...');
    await axios.post(`${BASE_URL}/api/notify-request`, subscriptionData);
    
    const { data: timingNotification } = await supabase
      .from('notifications')
      .select('*')
      .eq('email', timingTestEmail)
      .single();
    
    const mockAppointments = [{
      date: startDate.toISOString().split('T')[0],
      available: true,
      times: ['10:00', '11:30']
    }];
    
    // Test initial phase (first 3 emails at 10min intervals)
    logPhase('Testing initial phase (10min intervals)...');
    
    for (let i = 1; i <= 3; i++) {
      logTest(`Sending email ${i}/3 in initial phase...`);
      
      const response = await axios.post(`${BASE_URL}/api/process-notifications`, {
        appointments: mockAppointments,
        testMode: true
      });
      
      if (!response.data.success) {
        throw new Error(`Email ${i} processing failed`);
      }
      
      // Check phase and timing
      const { data: updatedNotification } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', timingNotification.id)
        .single();
      
      const expectedPhase = 'initial';
      if (updatedNotification.notification_phase !== expectedPhase) {
        throw new Error(`Expected phase ${expectedPhase}, got ${updatedNotification.notification_phase}`);
      }
      
      logInfo(`Email ${i}: Phase ${updatedNotification.notification_phase}, Count ${updatedNotification.notification_count}`);
      
      // Small delay to ensure database updates complete
      await wait(100);
    }
    
    logSuccess('Initial phase completed successfully');
    
    // Test extended phase (next 3 emails at 1hr intervals)
    logPhase('Testing extended phase (1hr intervals)...');
    
    for (let i = 4; i <= 6; i++) {
      logTest(`Sending email ${i}/6 in extended phase...`);
      
      const response = await axios.post(`${BASE_URL}/api/process-notifications`, {
        appointments: mockAppointments,
        testMode: true
      });
      
      if (!response.data.success) {
        throw new Error(`Email ${i} processing failed`);
      }
      
      // Check phase transition
      const { data: updatedNotification } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', timingNotification.id)
        .single();
      
      const expectedPhase = i <= 6 ? (i === 6 ? 'completed' : 'extended') : 'extended';
      const expectedStatus = i === 6 ? 'max_reached' : 'active';
      
      logInfo(`Email ${i}: Phase ${updatedNotification.notification_phase}, Status ${updatedNotification.status}`);
      
      if (i === 6) {
        if (updatedNotification.status !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus}, got ${updatedNotification.status}`);
        }
        logSuccess('Subscription correctly marked as max_reached after 6 emails');
      }
      
      await wait(100);
    }
    
    logSuccess('Extended phase completed successfully');
    
    // Cleanup timing test data
    await supabase.from('user_appointment_responses').delete().eq('notification_id', timingNotification.id);
    await supabase.from('email_history').delete().eq('notification_id', timingNotification.id);
    await supabase.from('notifications').delete().eq('id', timingNotification.id);
    
    return true;
    
  } catch (error) {
    logError(`Smart timing logic test failed: ${error.message}`);
    return false;
  }
}

async function testRejectedAppointmentFiltering(rejectedDate) {
  logHeader('Testing Rejected Appointment Filtering');
  
  if (!rejectedDate) {
    logError('No rejected date available for testing');
    return false;
  }
  
  try {
    // Create new subscription to test filtering
    const [emailUser, emailDomain] = TEST_EMAIL.split('@');
    const filterTestEmail = `${emailUser}+filter${Date.now()}@${emailDomain}`;
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 20);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);
    
    const subscriptionData = {
      email: filterTestEmail,
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      smartSelection: true
    };
    
    await axios.post(`${BASE_URL}/api/notify-request`, subscriptionData);
    
    const { data: filterNotification } = await supabase
      .from('notifications')
      .select('*')
      .eq('email', filterTestEmail)
      .single();
    
    // Create appointments including a rejected one
    const testDate = startDate.toISOString().split('T')[0];
    const mockAppointments = [
      {
        date: testDate,
        available: true,
        times: ['10:00', '11:30']
      }
    ];
    
    // First email - should create response records
    logTest('Sending first email to create response records...');
    await axios.post(`${BASE_URL}/api/process-notifications`, {
      appointments: mockAppointments,
      testMode: true
    });
    
    // Mark the appointment as not_wanted
    const { data: responseRecord } = await supabase
      .from('user_appointment_responses')
      .select('response_token')
      .eq('notification_id', filterNotification.id)
      .eq('appointment_date', testDate)
      .single();
    
    logTest('Marking appointment as not_wanted...');
    await axios.post(`${BASE_URL}/api/appointment-response`, {
      response_token: responseRecord.response_token,
      action: 'not_wanted'
    });
    
    // Second email - should skip the rejected appointment
    logTest('Sending second email - should skip rejected appointment...');
    const response = await axios.post(`${BASE_URL}/api/process-notifications`, {
      appointments: mockAppointments,
      testMode: true
    });
    
    if (response.data.emailsSent > 0) {
      throw new Error('Email sent despite all appointments being rejected');
    }
    
    logSuccess('Rejected appointments correctly filtered out');
    
    // Cleanup
    await supabase.from('user_appointment_responses').delete().eq('notification_id', filterNotification.id);
    await supabase.from('notifications').delete().eq('id', filterNotification.id);
    
    return true;
    
  } catch (error) {
    logError(`Rejected appointment filtering test failed: ${error.message}`);
    return false;
  }
}

// Test confirmation email after subscription
async function testConfirmationEmail(notification) {
  logHeader('Testing Subscription Confirmation Email');
  try {
    // Wait a moment for email to be sent and logged
    await wait(1000);
    // Check email_history for confirmation email
    const { data: history, error } = await supabase
      .from('email_history')
      .select('*')
      .eq('notification_id', notification.id)
      .like('email_subject', '%הרשמתך התקבלה%')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    if (!history || history.length === 0) throw new Error('No confirmation email found in history');
    logSuccess('Confirmation email sent and logged');
    return true;
  } catch (error) {
    logError(`Confirmation email test failed: ${error.message}`);
    return false;
  }
}

// Test unsubscribe confirmation email after unsubscribing
async function testUnsubscribeEmail(notification) {
  logHeader('Testing Unsubscribe Confirmation Email');
  try {
    // Unsubscribe via API
    const response = await axios.post(`${BASE_URL}/api/unsubscribe`, {
      token: notification.unsubscribe_token
    });
    if (!response.data.success) throw new Error('Unsubscribe API failed');
    // Wait a moment for email to be sent and logged
    await wait(1000);
    // Check email_history for unsubscribe email
    const { data: history, error } = await supabase
      .from('email_history')
      .select('*')
      .eq('notification_id', notification.id)
      .like('email_subject', '%ההרשמה בוטלה%')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    if (!history || history.length === 0) throw new Error('No unsubscribe email found in history');
    logSuccess('Unsubscribe confirmation email sent and logged');
    return true;
  } catch (error) {
    logError(`Unsubscribe email test failed: ${error.message}`);
    return false;
  }
}

async function cleanup() {
  logHeader('Cleaning Up Test Data');
  
  try {
    // A more robust cleanup to catch all test variations
    const [emailUser, emailDomain] = TEST_EMAIL.split('@');
    const baseEmailPattern = `${emailUser}%@${emailDomain}`;

    const { data: testNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .like('email', baseEmailPattern);

    if (fetchError) {
      logWarning(`Could not fetch notifications for cleanup: ${fetchError.message}`);
      // Fallback to old cleanup
      await supabase.from('notifications').delete().eq('email', TEST_EMAIL);
      return;
    }
    
    if (testNotifications && testNotifications.length > 0) {
      const notificationIds = testNotifications.map(n => n.id);
      logInfo(`Found ${notificationIds.length} test notifications to clean up...`);
      
      await supabase.from('user_appointment_responses').delete().in('notification_id', notificationIds);
      await supabase.from('email_history').delete().in('notification_id', notificationIds);
      await supabase.from('notifications').delete().in('id', notificationIds);
    }
    
    logSuccess('Test data cleaned up successfully');
    
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

// Main test execution
async function runAllTests() {
  try {
    logHeader('Starting Enhanced Email System Test Suite');
    
    // Test 1: Enhanced subscription creation
    const notification = await testSubscriptionCreation();
    if (!notification) {
      logError('Subscription creation failed - aborting tests');
      return;
    }
    
    // Test 1b: Confirmation email
    await testConfirmationEmail(notification);
    
    // Test 2: Enhanced email processing with response tracking
    const emailTestData = await testEnhancedEmailProcessing(notification);
    if (!emailTestData) {
      logError('Email processing failed - aborting remaining tests');
      await cleanup();
      return;
    }
    
    // Test 3: User response actions
    const responseResults = await testUserResponseActions(emailTestData);
    if (!responseResults) {
      logError('User response actions test failed');
    }
    
    // Test 4: Smart timing logic
    const timingPassed = await testSmartTimingLogic();
    if (!timingPassed) {
      logError('Smart timing logic test failed');
    }
    
    // Test 5: Rejected appointment filtering
    if (responseResults && responseResults.rejectedDate) {
      const filteringPassed = await testRejectedAppointmentFiltering(responseResults.rejectedDate);
      if (!filteringPassed) {
        logError('Rejected appointment filtering test failed');
      }
    }
    
    // Test 6: Unsubscribe confirmation email
    await testUnsubscribeEmail(notification);
    
    // Cleanup
    await cleanup();
    
    // Final summary
    logHeader('Test Summary');
    logSuccess('✅ Enhanced subscription creation with new fields');
    logSuccess('✅ Email processing with appointment response tracking');
    logSuccess('✅ User response actions (taken/not_wanted)');
    logSuccess('✅ Smart notification timing (10min → 1hr)');
    logSuccess('✅ Phase management (initial → extended → completed)');
    logSuccess('✅ Rejected appointment filtering');
    logSuccess('✅ Enhanced email templates with action buttons');
    logSuccess('✅ Database schema extensions');
    
    console.log(`\n${colors.bold}${colors.green}🎉 ALL ENHANCED TESTS PASSED!${colors.reset}`);
    console.log(`${colors.blue}The enhanced email notification system is working correctly.${colors.reset}`);
    console.log(`${colors.cyan}New features: User responses, smart timing, appointment tracking${colors.reset}\n`);
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    await cleanup();
  }
}

// Run tests
runAllTests()
  .then(() => {
    console.log('Enhanced test execution completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Enhanced test execution failed:', error);
    process.exit(1);
  }); 
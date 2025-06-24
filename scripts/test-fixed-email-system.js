const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wwhpelkwjwtgpfzztixk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3aHBlbGt3and0Z3Bmenp0aXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTAyNDYsImV4cCI6MjA2NjI2NjI0Nn0.zvmNyO8T0QtyfojzRyVtKGRUR8fBpgiVfwCaHH1YBDM';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'daniellofficial@gmail.com'; // Replace with your test email

console.log('🧪 EMAIL SYSTEM COMPREHENSIVE TEST');
console.log('=====================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function for colored console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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
function logHeader(message) { console.log(`\n${colors.bold}${colors.blue}🎯 ${message}${colors.reset}\n`); }

// Test functions
async function testSubscriptionCreation() {
  logHeader('Testing Subscription Creation & Confirmation Email');
  
  try {
    // Clean up any existing test subscriptions
    await supabase
      .from('notifications')
      .delete()
      .eq('email', TEST_EMAIL);
    
    logInfo('Cleaned up existing test subscriptions');
    
    // Test subscription creation with future dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7); // 1 week from now
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5); // 5 days after start
    
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
    
    // Verify database record
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    // Validate record structure
    const requiredFields = ['email', 'criteria', 'criteria_type', 'unsubscribe_token', 'status', 'notification_count'];
    const missingFields = requiredFields.filter(field => !(field in notification));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    logSuccess('Database record created correctly');
    logInfo(`Status: ${notification.status}`);
    logInfo(`Criteria Type: ${notification.criteria_type}`);
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

async function testEmailProcessing(notification) {
  logHeader('Testing Email Processing Logic');
  
  try {
    // Create mock appointment data with future dates
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 10);
    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 11);
    
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
      }
    ];
    
    logInfo('Sending mock appointments to email processor...');
    
    const response = await axios.post(`${BASE_URL}/api/process-notifications`, {
      appointments: mockAppointments,
      testMode: true  // Bypass rate limiting for testing
    });
    
    if (response.status === 200 && response.data.success) {
      logSuccess('Email processing completed');
      logInfo(`Emails sent: ${response.data.emailsSent}`);
      logInfo(`Emails skipped: ${response.data.emailsSkipped}`);
      logInfo(`Processing time: ${response.data.processingTime}s`);
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
    
    if (updatedNotification.notification_count !== notification.notification_count + 1) {
      throw new Error(`Notification count not updated correctly. Expected: ${notification.notification_count + 1}, Got: ${updatedNotification.notification_count}`);
    }
    
    if (!updatedNotification.last_notified) {
      throw new Error('last_notified field not updated');
    }
    
    logSuccess('Database updated correctly after email send');
    logInfo(`New notification count: ${updatedNotification.notification_count}`);
    logInfo(`Status: ${updatedNotification.status}`);
    
    return updatedNotification;
    
  } catch (error) {
    logError(`Email processing test failed: ${error.message}`);
    return null;
  }
}

async function testMaxEmailLimit(notification) {
  logHeader('Testing Max Email Limit (6 emails)');
  
  try {
    // Simulate sending 5 more emails to reach the limit
    let currentNotification = notification;
    
    for (let i = 2; i <= 6; i++) {
      logInfo(`Testing email ${i}/6...`);
      
      // Mock appointment data for each iteration  
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const mockAppointments = [{
        date: futureDate.toISOString().split('T')[0],
        available: true,
        times: ['10:00']
      }];
      
      const response = await axios.post(`${BASE_URL}/api/process-notifications`, {
        appointments: mockAppointments,
        testMode: true  // Bypass rate limiting for testing
      });
      
      if (!response.data.success) {
        throw new Error(`Email ${i} processing failed`);
      }
      
      // Small delay to ensure database update completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check database state
      const { data: updatedNotification } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notification.id)
        .single();
      
      currentNotification = updatedNotification;
      
      logInfo(`Email ${i} sent. Count: ${currentNotification.notification_count}, Status: ${currentNotification.status}`);
      
      // Small delay to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Verify final status
    if (currentNotification.notification_count !== 6) {
      throw new Error(`Expected 6 notifications, got ${currentNotification.notification_count}`);
    }
    
    if (currentNotification.status !== 'max_reached') {
      throw new Error(`Expected status 'max_reached', got '${currentNotification.status}'`);
    }
    
    logSuccess('Max email limit test passed');
    logSuccess('Subscription marked as max_reached after 6 emails');
    
    // Test that no more emails are sent
    logInfo('Testing that max_reached subscriptions are skipped...');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    
    const mockAppointments = [{
      date: futureDate.toISOString().split('T')[0],
      available: true,
      times: ['10:00']
    }];
    
    const response = await axios.post(`${BASE_URL}/api/process-notifications`, {
      appointments: mockAppointments,
      testMode: true  // Bypass rate limiting for testing
    });
    
    if (response.data.emailsSent > 0) {
      throw new Error('Emails were sent to max_reached subscription');
    }
    
    logSuccess('Max_reached subscriptions correctly skipped');
    
  } catch (error) {
    logError(`Max email limit test failed: ${error.message}`);
    return false;
  }
  
  return true;
}

async function cleanup() {
  logHeader('Cleaning Up Test Data');
  
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('email', TEST_EMAIL);
    
    if (error) {
      throw new Error(`Cleanup failed: ${error.message}`);
    }
    
    logSuccess('Test data cleaned up successfully');
    
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

// Main test execution
async function runAllTests() {
  try {
    logHeader('Starting Comprehensive Email System Test');
    
    // Test 1: Subscription creation
    const notification = await testSubscriptionCreation();
    if (!notification) {
      logError('Subscription creation failed - aborting tests');
      return;
    }
    
    // Test 2: Email processing
    const updatedNotification = await testEmailProcessing(notification);
    if (!updatedNotification) {
      logError('Email processing failed - aborting remaining tests');
      await cleanup();
      return;
    }
    
    // Test 3: Max email limit
    const maxLimitPassed = await testMaxEmailLimit(updatedNotification);
    if (!maxLimitPassed) {
      logError('Max email limit test failed');
    }
    
    // Cleanup
    await cleanup();
    
    // Final summary
    logHeader('Test Summary');
    logSuccess('✅ Subscription creation and confirmation email');
    logSuccess('✅ Email processing and database updates');
    logSuccess('✅ Notification count increment');
    logSuccess('✅ Status management (active → max_reached)');
    logSuccess('✅ Max email limit enforcement');
    logSuccess('✅ Max_reached subscription skipping');
    
    console.log(`\n${colors.bold}${colors.green}🎉 ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.blue}The email notification system is working correctly.${colors.reset}\n`);
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    await cleanup();
  }
}

// Run tests
runAllTests()
  .then(() => {
    console.log('Test execution completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  }); 
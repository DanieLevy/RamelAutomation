// Test script for the enhanced email retry system with circuit breaker
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getQueueStatus() {
  const response = await fetch(`${BASE_URL}/api/email-queue-status`);
  const data = await response.json();
  console.log('\n📊 Queue Status:', JSON.stringify(data, null, 2));
  return data;
}

async function processQueue() {
  console.log('\n📧 Processing email queue...');
  const response = await fetch(`${BASE_URL}/api/process-email-queue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET || 'default-secret'}`
    },
    body: JSON.stringify({ limit: 5 })
  });
  const data = await response.json();
  console.log('📧 Process result:', JSON.stringify(data, null, 2));
  return data;
}

async function resetCircuitBreaker() {
  console.log('\n🔌 Resetting circuit breaker...');
  const response = await fetch(`${BASE_URL}/api/email-queue-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_SECRET || 'admin-secret'}`
    },
    body: JSON.stringify({ action: 'reset-circuit-breaker' })
  });
  const data = await response.json();
  console.log('🔌 Reset result:', data);
  return data;
}

async function simulateFailure() {
  console.log('\n⚠️  Simulating email failure scenario...');
  
  // To simulate failures, temporarily use wrong email credentials
  console.log('⚠️  NOTE: To test failure scenarios, temporarily set wrong EMAIL_APP_PASSWORD in environment');
  
  // Create a test notification that will trigger email
  const testEmail = `test-retry-${Date.now()}@example.com`;
  console.log(`📧 Creating test subscription for: ${testEmail}`);
  
  // First create a subscription
  const createResponse = await fetch(`${BASE_URL}/api/notify-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      location_id: 177,
      service_id: 5,
      notification_days: '1,2,3,4,5',
      notification_hours: '09:00-17:00',
      immediate_notification: true,
      max_notifications: 3
    })
  });
  
  const createResult = await createResponse.json();
  console.log('📧 Subscription created:', createResult);
  
  // Process notifications to trigger email
  console.log('\n📧 Triggering email send...');
  const processResponse = await fetch(`${BASE_URL}/api/process-notifications`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
    }
  });
  
  const processResult = await processResponse.json();
  console.log('📧 Process notifications result:', processResult);
}

async function runTest() {
  console.log('🧪 Starting Enhanced Email Retry System Test');
  console.log('==========================================\n');

  try {
    // 1. Check initial queue status
    console.log('1️⃣ Initial Queue Status');
    await getQueueStatus();

    // 2. Reset circuit breaker for clean test
    console.log('\n2️⃣ Resetting Circuit Breaker');
    await resetCircuitBreaker();

    // 3. Simulate failure scenario
    console.log('\n3️⃣ Creating Test Email');
    await simulateFailure();
    
    // Wait for processing
    await sleep(2000);

    // 4. Check queue status after failure
    console.log('\n4️⃣ Queue Status After Initial Processing');
    const statusAfterFailure = await getQueueStatus();

    // 5. Try processing queue (should handle retries)
    console.log('\n5️⃣ Processing Queue (Retry Attempt)');
    await processQueue();
    
    // Wait for processing
    await sleep(2000);

    // 6. Check final status
    console.log('\n6️⃣ Final Queue Status');
    const finalStatus = await getQueueStatus();

    // 7. Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`Circuit Breaker State: ${finalStatus.circuitBreaker?.state || 'unknown'}`);
    console.log(`Total Failures: ${finalStatus.circuitBreaker?.total_failures || 0}`);
    console.log(`Consecutive Failures: ${finalStatus.circuitBreaker?.consecutive_failures || 0}`);
    console.log('\nQueue Stats:');
    console.log(`- Pending: ${finalStatus.queueStats?.pending || 0}`);
    console.log(`- Failed: ${finalStatus.queueStats?.failed || 0}`);
    console.log(`- Sent: ${finalStatus.queueStats?.sent || 0}`);
    console.log(`- Abandoned: ${finalStatus.queueStats?.abandoned || 0}`);

    // Show retry timeline
    if (finalStatus.recentFailed && finalStatus.recentFailed.length > 0) {
      console.log('\n⏰ Recent Failed Emails (with retry times):');
      finalStatus.recentFailed.forEach(email => {
        console.log(`- ${email.email_to}: ${email.attempts} attempts`);
        if (email.next_retry_at) {
          const retryTime = new Date(email.next_retry_at);
          const now = new Date();
          const diffMinutes = Math.round((retryTime - now) / 1000 / 60);
          console.log(`  Next retry in: ${diffMinutes} minutes`);
        }
        console.log(`  Error: ${email.last_error}`);
      });
    }

    console.log('\n✅ Test completed!');
    console.log('\n💡 Tips:');
    console.log('- To test real failures, temporarily set wrong EMAIL_APP_PASSWORD');
    console.log('- The system will retry with exponential backoff: 1min, 2min, 4min...');
    console.log('- After 5 consecutive failures, circuit breaker will open for 60 seconds');
    console.log('- Failed emails are abandoned after 3 attempts');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
runTest(); 
#!/usr/bin/env node

/**
 * Test notify-request API with date scenarios
 */

const axios = require('axios');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testNotifyRequest(testName, requestBody) {
  console.log(`\n🧪 ${testName}`);
  console.log('Request:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/notify-request`, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Success:', response.data.message);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function runTests() {
  console.log('🔍 Testing notify-request API date handling\n');
  
  // Get today's date in Israel timezone
  const todayIsrael = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  console.log(`Today in Israel: ${todayIsrael}`);
  
  // Calculate test dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextMonth = new Date(today);
  nextMonth.setDate(today.getDate() + 30);
  
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  const nextMonthStr = nextMonth.toISOString().split('T')[0];
  
  // Test cases
  const tests = [
    {
      name: 'Single date - Tomorrow',
      body: {
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: tomorrowStr
      }
    },
    {
      name: 'Single date - Today (might fail)',
      body: {
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: todayIsrael
      }
    },
    {
      name: 'Single date - Yesterday (should fail)',
      body: {
        email: 'test@example.com',
        subscriptionType: 'single',
        targetDate: '2025-07-05'
      }
    },
    {
      name: 'Range - Next 7 days',
      body: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: tomorrowStr,
        dateEnd: nextWeekStr
      }
    },
    {
      name: 'Range - 30 days (max allowed)',
      body: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: tomorrowStr,
        dateEnd: nextMonthStr
      }
    },
    {
      name: 'Range - Starting today',
      body: {
        email: 'test@example.com',
        subscriptionType: 'range',
        dateStart: todayIsrael,
        dateEnd: nextWeekStr
      }
    },
    {
      name: 'Invalid - Missing email',
      body: {
        subscriptionType: 'single',
        targetDate: tomorrowStr
      }
    },
    {
      name: 'Invalid - Bad email format',
      body: {
        email: 'not-an-email',
        subscriptionType: 'single',
        targetDate: tomorrowStr
      }
    }
  ];
  
  // Run tests sequentially
  for (const test of tests) {
    await testNotifyRequest(test.name, test.body);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }
}

// Run the tests
runTests().catch(console.error); 
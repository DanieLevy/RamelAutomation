#!/usr/bin/env node

/**
 * Production Debugging Helper for Netlify Functions
 * Monitors function health, cache status, and provides debugging tools
 */

const https = require('https');

// Configuration - UPDATE THIS WITH YOUR ACTUAL NETLIFY URL
const PRODUCTION_URL = 'https://your-site.netlify.app'; // 🚨 CHANGE THIS

/**
 * Make HTTPS request with timeout
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Debugger/1.0'
      },
      timeout: 15000
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
            rawBody: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: data,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Check cache status and health
 */
async function checkCacheHealth() {
  console.log('\n🔍 CACHE HEALTH CHECK');
  console.log('='.repeat(50));
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/.netlify/functions/get-cached-result`);
    
    console.log(`Status: ${response.statusCode} ${response.statusCode === 200 ? '✅' : '❌'}`);
    
    if (response.body) {
      const data = response.body;
      
      console.log(`Cached: ${data.cached ? '✅ Yes' : '❌ No'}`);
      
      if (data.cached) {
        console.log(`Cache Age: ${data.cacheAge} minutes`);
        console.log(`Last Check: ${data.lastCheck}`);
        console.log(`Found Appointments: ${data.summary?.found ? '✅ Yes' : '❌ No'}`);
        
        if (data.summary?.found) {
          console.log(`Next Available: ${data.summary.date}`);
          console.log(`Available Times: ${data.summary.times?.join(', ')}`);
        }
      } else {
        console.log(`Message: ${data.message}`);
        console.log(`Suggestion: ${data.suggestion}`);
      }
    } else {
      console.log(`❌ No response body`);
      console.log(`Raw: ${response.rawBody}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Trigger manual background check
 */
async function triggerBackgroundCheck() {
  console.log('\n🚀 MANUAL BACKGROUND CHECK');
  console.log('='.repeat(50));
  
  try {
    console.log('Triggering background check...');
    const startTime = Date.now();
    
    const response = await makeRequest(`${PRODUCTION_URL}/.netlify/functions/auto-check`, {
      method: 'POST',
      body: JSON.stringify({
        trigger: 'manual-debug',
        timestamp: Date.now()
      })
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`Status: ${response.statusCode} (${duration}ms) ${response.statusCode === 200 ? '✅' : '❌'}`);
    
    if (response.body) {
      const data = response.body;
      console.log(`Success: ${data.success ? '✅' : '❌'}`);
      console.log(`Message: ${data.message}`);
      
      if (data.result) {
        console.log(`Found: ${data.result.summary?.found ? '✅' : '❌'}`);
        if (data.result.summary?.found) {
          console.log(`Date: ${data.result.summary.date}`);
          console.log(`Times: ${data.result.summary.times?.join(', ')}`);
        }
        console.log(`Total Checked: ${data.result.summary?.totalChecked}`);
      }
    } else {
      console.log(`❌ No response body`);
      console.log(`Raw: ${response.rawBody}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Monitor cache updates over time
 */
async function monitorCache(intervalMinutes = 1, duration = 10) {
  console.log(`\n⏰ CACHE MONITORING (${duration} minutes, check every ${intervalMinutes} min)`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  const endTime = startTime + (duration * 60 * 1000);
  let checkCount = 0;
  
  while (Date.now() < endTime) {
    checkCount++;
    const now = new Date().toLocaleTimeString();
    
    try {
      const response = await makeRequest(`${PRODUCTION_URL}/.netlify/functions/get-cached-result`);
      
      if (response.body && response.body.cached) {
        const age = response.body.cacheAge;
        const found = response.body.summary?.found;
        console.log(`[${now}] Check #${checkCount}: Age=${age}min, Found=${found ? '✅' : '❌'}`);
      } else {
        console.log(`[${now}] Check #${checkCount}: ❌ No cache`);
      }
    } catch (error) {
      console.log(`[${now}] Check #${checkCount}: ❌ Error - ${error.message}`);
    }
    
    // Wait for next check
    if (Date.now() < endTime) {
      await new Promise(resolve => setTimeout(resolve, intervalMinutes * 60 * 1000));
    }
  }
  
  console.log(`\n✅ Monitoring completed (${checkCount} checks)`);
}

/**
 * Test scheduled function trigger
 */
async function testScheduledFunction() {
  console.log('\n📅 SCHEDULED FUNCTION TEST');
  console.log('='.repeat(50));
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/.netlify/functions/scheduled-check`, {
      method: 'POST',
      body: JSON.stringify({
        trigger: 'manual-test',
        timestamp: Date.now()
      })
    });
    
    console.log(`Status: ${response.statusCode} ${response.statusCode === 200 ? '✅' : '❌'}`);
    
    if (response.body) {
      console.log(`Success: ${response.body.success ? '✅' : '❌'}`);
      console.log(`Message: ${response.body.message}`);
      
      if (response.body.backgroundResult) {
        console.log(`Background Result: ${JSON.stringify(response.body.backgroundResult, null, 2)}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Main menu
 */
async function showMenu() {
  console.log('\n🔧 PRODUCTION DEBUGGING MENU');
  console.log('='.repeat(40));
  console.log('1. Check Cache Health');
  console.log('2. Trigger Manual Background Check');
  console.log('3. Test Scheduled Function');
  console.log('4. Monitor Cache (1 min intervals, 10 min duration)');
  console.log('5. Quick Health Check (All Functions)');
  console.log('6. Exit');
  console.log('='.repeat(40));
}

/**
 * Quick health check of all functions
 */
async function quickHealthCheck() {
  console.log('\n🏥 QUICK HEALTH CHECK');
  console.log('='.repeat(50));
  
  const functions = ['get-cached-result', 'auto-check', 'scheduled-check'];
  
  for (const func of functions) {
    try {
      const startTime = Date.now();
      const response = await makeRequest(`${PRODUCTION_URL}/.netlify/functions/${func}`);
      const duration = Date.now() - startTime;
      
      const status = response.statusCode === 200 ? '✅' : '❌';
      console.log(`${func}: ${status} ${response.statusCode} (${duration}ms)`);
    } catch (error) {
      console.log(`${func}: ❌ Error - ${error.message}`);
    }
  }
}

/**
 * Interactive CLI
 */
async function runInteractive() {
  console.log('🚀 NETLIFY FUNCTIONS PRODUCTION DEBUGGER');
  console.log(`🌐 Target: ${PRODUCTION_URL}`);
  
  if (PRODUCTION_URL.includes('your-site.netlify.app')) {
    console.log('\n⚠️  WARNING: Please update PRODUCTION_URL in this script!');
    return;
  }
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };
  
  while (true) {
    await showMenu();
    const choice = await askQuestion('\nSelect option (1-6): ');
    
    switch (choice.trim()) {
      case '1':
        await checkCacheHealth();
        break;
      case '2':
        await triggerBackgroundCheck();
        break;
      case '3':
        await testScheduledFunction();
        break;
      case '4':
        await monitorCache();
        break;
      case '5':
        await quickHealthCheck();
        break;
      case '6':
        console.log('👋 Goodbye!');
        rl.close();
        return;
      default:
        console.log('❌ Invalid option');
    }
    
    await askQuestion('\nPress Enter to continue...');
  }
}

// Run based on command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  runInteractive().catch(console.error);
} else {
  switch (args[0]) {
    case 'cache':
      checkCacheHealth().catch(console.error);
      break;
    case 'trigger':
      triggerBackgroundCheck().catch(console.error);
      break;
    case 'health':
      quickHealthCheck().catch(console.error);
      break;
    case 'monitor':
      const interval = parseInt(args[1]) || 1;
      const duration = parseInt(args[2]) || 10;
      monitorCache(interval, duration).catch(console.error);
      break;
    default:
      console.log('Usage: node debug-production.js [cache|trigger|health|monitor]');
  }
} 
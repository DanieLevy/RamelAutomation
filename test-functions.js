#!/usr/bin/env node

/**
 * Comprehensive test script for Netlify Functions
 * Tests both local development and production endpoints
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  local: {
    baseUrl: 'http://localhost:8888',
    env: 'local'
  },
  production: {
    baseUrl: 'https://your-site.netlify.app', // Replace with your actual Netlify URL
    env: 'production'
  }
};

// Test functions
const FUNCTIONS_TO_TEST = [
  'get-cached-result',
  'auto-check',
  'scheduled-check'
];

/**
 * Make HTTP request with proper error handling
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function-Tester/1.0'
      },
      timeout: 30000
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData,
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
    
    req.on('error', (err) => {
      reject(err);
    });
    
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
 * Test a single function endpoint
 */
async function testFunction(baseUrl, functionName, testOptions = {}) {
  const url = `${baseUrl}/.netlify/functions/${functionName}`;
  
  console.log(`\n🔍 Testing: ${functionName}`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(url, testOptions);
    const duration = Date.now() - startTime;
    
    // Status check
    const statusEmoji = response.statusCode === 200 ? '✅' : '❌';
    console.log(`${statusEmoji} Status: ${response.statusCode} (${duration}ms)`);
    
    // Headers check
    const hasJson = response.headers['content-type']?.includes('application/json');
    console.log(`📋 Content-Type: ${response.headers['content-type']} ${hasJson ? '✅' : '⚠️'}`);
    
    // CORS check
    const hasCors = response.headers['access-control-allow-origin'];
    console.log(`🌐 CORS: ${hasCors || 'Not set'} ${hasCors ? '✅' : '⚠️'}`);
    
    // Body check
    if (response.body) {
      console.log(`📦 Response Body:`);
      console.log(JSON.stringify(response.body, null, 2));
      
      // Function-specific validations
      if (functionName === 'get-cached-result') {
        const hasMessage = response.body.message || response.body.cached !== undefined;
        console.log(`🔍 Cache Result: ${hasMessage ? '✅' : '❌'}`);
      }
      
      if (functionName === 'auto-check') {
        const hasResult = response.body.success !== undefined;
        console.log(`🔍 Auto Check: ${hasResult ? '✅' : '❌'}`);
      }
    } else if (response.rawBody) {
      console.log(`📦 Raw Response: ${response.rawBody.substring(0, 200)}...`);
    }
    
    return {
      success: response.statusCode === 200,
      statusCode: response.statusCode,
      duration,
      response
    };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test all functions in an environment
 */
async function testEnvironment(envName, config) {
  console.log(`\n🚀 Testing ${envName.toUpperCase()} environment`);
  console.log(`🌐 Base URL: ${config.baseUrl}`);
  console.log('='.repeat(60));
  
  const results = {};
  
  for (const functionName of FUNCTIONS_TO_TEST) {
    const result = await testFunction(config.baseUrl, functionName);
    results[functionName] = result;
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test POST requests for auto-check function
  console.log(`\n🔍 Testing POST to auto-check`);
  const postResult = await testFunction(config.baseUrl, 'auto-check', {
    method: 'POST',
    body: JSON.stringify({
      trigger: 'manual-test',
      timestamp: Date.now()
    })
  });
  results['auto-check-post'] = postResult;
  
  return results;
}

/**
 * Generate test report
 */
function generateReport(localResults, prodResults) {
  console.log('\n📊 TEST REPORT');
  console.log('='.repeat(60));
  
  const allFunctions = [...FUNCTIONS_TO_TEST, 'auto-check-post'];
  
  for (const funcName of allFunctions) {
    console.log(`\n📋 ${funcName}:`);
    
    if (localResults[funcName]) {
      const local = localResults[funcName];
      console.log(`  🏠 Local: ${local.success ? '✅' : '❌'} (${local.duration || 'N/A'}ms)`);
      if (local.error) console.log(`     Error: ${local.error}`);
    }
    
    if (prodResults[funcName]) {
      const prod = prodResults[funcName];
      console.log(`  🌐 Prod:  ${prod.success ? '✅' : '❌'} (${prod.duration || 'N/A'}ms)`);
      if (prod.error) console.log(`     Error: ${prod.error}`);
    }
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('1. ✅ All functions should return 200 status');
  console.log('2. ✅ All responses should have application/json content-type');
  console.log('3. ✅ All responses should have CORS headers');
  console.log('4. ✅ Cache function should return cached/message data');
  console.log('5. ✅ Auto-check function should accept POST requests');
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 NETLIFY FUNCTIONS COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(60));
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  let localResults = {};
  let prodResults = {};
  
  // Test local environment
  try {
    console.log('\n🏠 Testing LOCAL environment...');
    console.log('💡 Make sure to run: netlify dev');
    localResults = await testEnvironment('local', CONFIG.local);
  } catch (error) {
    console.log(`❌ Local testing failed: ${error.message}`);
    console.log('💡 Run "netlify dev" in another terminal first');
  }
  
  // Test production environment
  try {
    console.log('\n🌐 Testing PRODUCTION environment...');
    prodResults = await testEnvironment('production', CONFIG.production);
  } catch (error) {
    console.log(`❌ Production testing failed: ${error.message}`);
  }
  
  // Generate report
  generateReport(localResults, prodResults);
  
  console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testFunction, makeRequest }; 
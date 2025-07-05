#!/usr/bin/env node

/**
 * Function Health Monitor
 * Checks the auto-check function performance and helps identify issues
 */

const https = require('https');

const FUNCTION_URL = 'https://tor-ramel.netlify.app/.netlify/functions/auto-check';
const MAX_ACCEPTABLE_TIME = 8; // seconds

async function checkFunctionHealth() {
  console.log('🔍 Monitoring Auto-Check Function Health...\n');
  
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    https.get(FUNCTION_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const executionTime = (endTime - startTime) / 1000;
        
        try {
          const result = JSON.parse(data);
          
          console.log('✅ Function Response Received');
          console.log(`⏱️  Total Request Time: ${executionTime.toFixed(2)}s`);
          console.log(`⚡ Function Execution Time: ${result.executionTime}s`);
          console.log(`📊 Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          
          if (result.data) {
            console.log(`\n📋 Results:`);
            console.log(`   - Appointments Found: ${result.data.found ? 'Yes' : 'No'}`);
            console.log(`   - Appointment Count: ${result.data.appointmentCount || 0}`);
            console.log(`   - Cache Updated: ${result.data.cacheUpdated ? 'Yes' : 'No'}`);
            
            if (result.data.emailProcessing) {
              console.log(`   - Email Processing: ${result.data.emailProcessing.processed ? 'Success' : 'Failed'}`);
              console.log(`   - Emails Queued: ${result.data.emailProcessing.emailsQueued || 0}`);
              console.log(`   - Emails Skipped: ${result.data.emailProcessing.emailsSkipped || 0}`);
            }
          }
          
          if (result.executionTime > MAX_ACCEPTABLE_TIME) {
            console.log(`\n⚠️  WARNING: Function execution time (${result.executionTime}s) exceeds target (${MAX_ACCEPTABLE_TIME}s)`);
          }
          
          if (result.data?.summary?.performance) {
            const perf = result.data.summary.performance;
            console.log(`\n📈 Performance Metrics:`);
            console.log(`   - Cache Hits: ${perf.cacheHits}`);
            console.log(`   - Cache Misses: ${perf.cacheMisses}`);
            console.log(`   - API Calls: ${perf.apiCalls}`);
            console.log(`   - Errors: ${perf.errors}`);
            console.log(`   - Avg Response Time: ${perf.apiCalls > 0 ? Math.round(perf.totalResponseTime / perf.apiCalls) : 0}ms`);
          }
          
          // Calculate monthly projections
          const checksPerDay = 288; // Every 5 minutes
          const monthlyChecks = checksPerDay * 30;
          console.log(`\n📊 Monthly Projections:`);
          console.log(`   - Function Invocations: ${monthlyChecks.toLocaleString()} (${(monthlyChecks / 125000 * 100).toFixed(1)}% of 125k limit)`);
          
          resolve(result);
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    }).on('error', (err) => {
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;
      
      console.error(`❌ Request failed after ${executionTime.toFixed(2)}s:`, err.message);
      reject(err);
    });
  });
}

// Run the monitor
checkFunctionHealth()
  .then(() => {
    console.log('\n✅ Health check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Health check failed:', error.message);
    process.exit(1);
  }); 
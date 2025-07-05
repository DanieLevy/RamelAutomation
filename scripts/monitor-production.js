const fetch = require('node-fetch');

console.log('🔍 Production Monitoring Script');
console.log('==============================\n');

const PROD_URL = 'https://tor-ramel.netlify.app';

async function checkEndpoint(name, path, method = 'GET', body = null) {
  console.log(`\n📌 Checking ${name}...`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${PROD_URL}${path}`, options);
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Success:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
    } else {
      const text = await response.text();
      console.log(`  ❌ Error:`, text.substring(0, 200));
    }
    
    return response.ok;
  } catch (error) {
    console.log(`  ❌ Failed:`, error.message);
    return false;
  }
}

async function monitorProduction() {
  console.log(`🌐 Monitoring: ${PROD_URL}`);
  console.log(`📅 Time: ${new Date().toLocaleString()}`);
  
  const results = {
    homepage: false,
    cachedResults: false,
    autoCheck: false,
    emailQueue: false
  };
  
  // Check homepage
  results.homepage = await checkEndpoint('Homepage', '/');
  
  // Check cached results API
  results.cachedResults = await checkEndpoint('Cached Results API', '/api/cached-results');
  
  // Check auto-check function (this will return cached data)
  results.autoCheck = await checkEndpoint('Auto-Check Function', '/.netlify/functions/auto-check');
  
  // Check email queue status
  results.emailQueue = await checkEndpoint('Email Queue Status', '/api/email-queue-status');
  
  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('==========');
  
  const allPassed = Object.values(results).every(r => r);
  
  Object.entries(results).forEach(([key, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${key}`);
  });
  
  if (allPassed) {
    console.log('\n✅ All systems operational!');
  } else {
    console.log('\n⚠️ Some systems are not responding correctly.');
    console.log('Check Netlify dashboard for deployment status and logs.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Check Netlify dashboard for deployment status');
  console.log('2. Monitor scheduled function logs:');
  console.log('   - auto-check (runs every 5 minutes)');
  console.log('   - process-cached-notifications (runs 1 minute after auto-check)');
  console.log('   - process-email-queue (runs every 2 minutes)');
  console.log('3. Verify emails are being sent to subscribed users');
}

// Run monitoring
monitorProduction().catch(console.error); 
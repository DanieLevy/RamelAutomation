require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Auto-Check Performance');
console.log('================================');
console.log('Environment Check:');
console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅' : '❌'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`);
console.log(`- USER_ID: ${process.env.USER_ID ? '✅' : '❌'}`);
console.log(`- CODE_AUTH: ${process.env.CODE_AUTH ? '✅' : '❌'}`);
console.log();

// Load the auto-check handler
const { handler } = require('../netlify/functions/auto-check.js');

async function testPerformance() {
  console.log('🚀 Starting performance test...');
  console.log('Target: < 10 seconds execution time');
  console.log();
  
  const startTime = Date.now();
  
  try {
    // Mock event and context
    const event = {};
    const context = {};
    
    // Call the handler
    const response = await handler(event, context);
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    console.log('\n📊 Results:');
    console.log(`- Status Code: ${response.statusCode}`);
    console.log(`- Execution Time: ${executionTime.toFixed(2)} seconds`);
    console.log(`- Performance: ${executionTime < 10 ? '✅ PASS' : '❌ FAIL'} (${executionTime < 10 ? 'Under' : 'Over'} 10 seconds)`);
    
    if (response.statusCode === 200) {
      const body = JSON.parse(response.body);
      console.log(`- Appointments Found: ${body.data.found ? '✅' : '❌'}`);
      console.log(`- Appointment Count: ${body.data.appointmentCount}`);
      console.log(`- Days Checked: ${body.data.summary.totalChecked}`);
      console.log(`- Cache Hits: ${body.data.summary.performance?.cacheHits || 0}`);
      console.log(`- API Calls: ${body.data.summary.performance?.apiCalls || 0}`);
      console.log(`- Errors: ${body.data.summary.performance?.errors || 0}`);
      
      if (body.data.appointments && body.data.appointments.length > 0) {
        console.log('\n🗓️ First 3 Available Appointments:');
        body.data.appointments.slice(0, 3).forEach(apt => {
          console.log(`  - ${apt.date}: ${apt.times.length} slots [${apt.times.join(', ')}]`);
        });
      }
    } else {
      console.error('\n❌ Error Response:', response.body);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    console.error('\n❌ Test failed:');
    console.error(`- Error: ${error.message}`);
    console.error(`- Execution Time: ${executionTime.toFixed(2)} seconds`);
    console.error(`- Stack:`, error.stack);
  }
}

// Run the test
testPerformance().catch(console.error); 
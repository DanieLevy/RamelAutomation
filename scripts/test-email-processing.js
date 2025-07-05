#!/usr/bin/env node

/**
 * Test Email Processing Database Operations
 * Checks if database tables exist and are accessible
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testEmailProcessing() {
  console.log('🔍 Testing Email Processing Database Operations\n');
  
  const results = {
    notifications_simple: { exists: false, count: 0, error: null },
    sent_appointments: { exists: false, count: 0, error: null },
    email_queue: { exists: false, count: 0, error: null },
    cache: { exists: false, hasAutoCheck: false, error: null }
  };
  
  // Test notifications_simple table
  console.log('1️⃣ Testing notifications_simple table...');
  try {
    const { data, error, count } = await supabase
      .from('notifications_simple')
      .select('*', { count: 'exact' })
      .eq('status', 'active');
    
    if (error) {
      console.error('   ❌ Error:', error.message);
      results.notifications_simple.error = error.message;
    } else {
      results.notifications_simple.exists = true;
      results.notifications_simple.count = count || data?.length || 0;
      console.log(`   ✅ Table exists - ${results.notifications_simple.count} active subscriptions found`);
      
      if (data && data.length > 0) {
        console.log('   📧 Active subscriptions:');
        data.forEach(sub => {
          console.log(`      - ${sub.email} (${sub.subscription_type})`);
        });
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
    results.notifications_simple.error = err.message;
  }
  
  // Test sent_appointments table
  console.log('\n2️⃣ Testing sent_appointments table...');
  try {
    const { data, error, count } = await supabase
      .from('sent_appointments')
      .select('*', { count: 'exact' })
      .limit(5)
      .order('sent_at', { ascending: false });
    
    if (error) {
      console.error('   ❌ Error:', error.message);
      results.sent_appointments.error = error.message;
    } else {
      results.sent_appointments.exists = true;
      results.sent_appointments.count = count || 0;
      console.log(`   ✅ Table exists - ${results.sent_appointments.count} records found`);
      
      if (data && data.length > 0) {
        console.log('   📋 Recent sent appointments:');
        data.forEach(apt => {
          console.log(`      - ${apt.appointment_id} sent at ${new Date(apt.sent_at).toLocaleString()}`);
        });
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
    results.sent_appointments.error = err.message;
  }
  
  // Test email_queue table
  console.log('\n3️⃣ Testing email_queue table...');
  try {
    const { data, error, count } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('   ❌ Error:', error.message);
      results.email_queue.error = error.message;
    } else {
      results.email_queue.exists = true;
      results.email_queue.count = count || 0;
      console.log(`   ✅ Table exists - ${results.email_queue.count} pending emails found`);
      
      if (data && data.length > 0) {
        console.log('   📧 Pending emails:');
        data.forEach(email => {
          console.log(`      - To: ${email.to}, Subject: ${email.subject}`);
        });
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
    results.email_queue.error = err.message;
  }
  
  // Test cache table
  console.log('\n4️⃣ Testing cache table...');
  try {
    const { data, error } = await supabase
      .from('cache')
      .select('key, value')
      .eq('key', 'auto-check-results')
      .single();
    
    if (error) {
      console.error('   ❌ Error:', error.message);
      results.cache.error = error.message;
    } else {
      results.cache.exists = true;
      results.cache.hasAutoCheck = !!data;
      console.log(`   ✅ Table exists - auto-check-results ${data ? 'found' : 'not found'}`);
      
      if (data && data.value) {
        console.log(`   📊 Cache data: ${data.value.appointments?.length || 0} appointments cached`);
        console.log(`   ⏰ Last checked: ${new Date(data.value.lastChecked).toLocaleString()}`);
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
    results.cache.error = err.message;
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('============');
  
  const allTablesExist = Object.values(results).every(r => r.exists || r.error?.includes('relation'));
  
  if (allTablesExist) {
    console.log('✅ All tables are accessible');
  } else {
    console.log('❌ Some tables are missing or inaccessible:');
    Object.entries(results).forEach(([table, result]) => {
      if (!result.exists && !result.error?.includes('relation')) {
        console.log(`   - ${table}: ${result.error || 'Not found'}`);
      }
    });
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (results.notifications_simple.count === 0) {
    console.log('⚠️  No active subscriptions found - emails won\'t be sent');
    console.log('   → Create a test subscription using the web interface');
  }
  
  if (!results.email_queue.exists) {
    console.log('⚠️  email_queue table might be missing');
    console.log('   → Check if the table exists in Supabase dashboard');
  }
  
  if (!results.sent_appointments.exists) {
    console.log('⚠️  sent_appointments table might be missing');
    console.log('   → Check if the table exists in Supabase dashboard');
  }
  
  return results;
}

// Run the test
testEmailProcessing()
  .then(results => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }); 
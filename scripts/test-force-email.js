#!/usr/bin/env node

/**
 * Test Force Email Sending
 * Clears sent appointments to test the complete email flow
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function forceEmailTest() {
  console.log('🧪 Force Email Test\n');
  
  try {
    // Step 1: Clear sent_appointments for testing
    console.log('1️⃣ Clearing sent_appointments table for testing...');
    const { error: clearError } = await supabase
      .from('sent_appointments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (clearError) {
      console.error('   ❌ Error clearing:', clearError);
    } else {
      console.log('   ✅ Sent appointments cleared');
    }
    
    // Step 2: Trigger the auto-check function
    console.log('\n2️⃣ Triggering auto-check function...');
    const response = await fetch('https://tor-ramel.netlify.app/.netlify/functions/auto-check');
    const data = await response.json();
    
    console.log(`   ✅ Function executed in ${data.executionTime}s`);
    console.log(`   📊 Found ${data.data.appointmentCount} appointments`);
    
    if (data.data.emailProcessing) {
      const ep = data.data.emailProcessing;
      console.log(`   📧 Email processing: ${ep.processed ? 'Success' : 'Failed'}`);
      console.log(`   📧 Emails queued: ${ep.emailsQueued || 0}`);
      console.log(`   📧 Emails skipped: ${ep.emailsSkipped || 0}`);
      
      if (ep.errors && ep.errors.length > 0) {
        console.log('   ⚠️ Errors:', ep.errors);
      }
    }
    
    // Step 3: Check email_queue
    console.log('\n3️⃣ Checking email queue...');
    const { data: emails, error: emailError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (emailError) {
      console.error('   ❌ Error checking queue:', emailError);
    } else if (emails && emails.length > 0) {
      console.log(`   ✅ ${emails.length} emails in queue:`);
      emails.forEach(email => {
        console.log(`      - To: ${email.to}`);
        console.log(`        Subject: ${email.subject}`);
        console.log(`        Created: ${new Date(email.created_at).toLocaleString()}`);
      });
    } else {
      console.log('   ℹ️ No pending emails in queue');
    }
    
    // Step 4: Check sent_appointments
    console.log('\n4️⃣ Checking sent appointments...');
    const { data: sent, error: sentError } = await supabase
      .from('sent_appointments')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(5);
    
    if (sentError) {
      console.error('   ❌ Error checking sent:', sentError);
    } else if (sent && sent.length > 0) {
      console.log(`   ✅ ${sent.length} appointments marked as sent:`);
      sent.forEach(s => {
        console.log(`      - Date: ${s.appointment_date}, Times: ${s.appointment_times.join(', ')}`);
      });
    } else {
      console.log('   ℹ️ No appointments marked as sent');
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
forceEmailTest(); 
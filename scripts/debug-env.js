#!/usr/bin/env node

/**
 * Debug script for environment variables
 * Run this temporarily to see what's available in Netlify
 */

console.log('🔍 Environment Variables Debug\n');
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('Current Directory:', process.cwd());
console.log('Build Environment:', process.env.NETLIFY ? 'Netlify' : 'Local');
console.log('');

const targetVars = [
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'EMAIL_SENDER',
  'EMAIL_APP_PASSWORD',
  'NEXT_PUBLIC_BASE_URL',
  'USER_ID',
  'CODE_AUTH',
  'CRON_SECRET',
  'ADMIN_SECRET',
  'REQUEST_DELAY_MS'
];

console.log('📋 Checking for Required Variables:\n');

targetVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ SET' : '❌ NOT SET';
  const preview = value ? `(length: ${value.length})` : '';
  console.log(`${status} ${varName} ${preview}`);
});

console.log('\n📊 Summary:');
const setVars = targetVars.filter(v => process.env[v]);
const missingVars = targetVars.filter(v => !process.env[v]);

console.log(`Total variables checked: ${targetVars.length}`);
console.log(`Variables set: ${setVars.length}`);
console.log(`Variables missing: ${missingVars.length}`);

if (missingVars.length > 0) {
  console.log('\n❌ Missing variables:');
  missingVars.forEach(v => console.log(`   - ${v}`));
}

console.log('\n✅ Debug complete'); 
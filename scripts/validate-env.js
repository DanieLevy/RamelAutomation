#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Ensures all required environment variables are set before build
 */

const requiredEnvVars = {
  // Supabase credentials
  'SUPABASE_URL': 'Supabase project URL',
  'NEXT_PUBLIC_SUPABASE_URL': 'Public Supabase project URL (same as SUPABASE_URL)',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key for server-side operations',
  'SUPABASE_ANON_KEY': 'Supabase anonymous key',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Public Supabase anonymous key (same as SUPABASE_ANON_KEY)',
  
  // Email configuration
  'EMAIL_SENDER': 'Email address for sending notifications (e.g., your-email@gmail.com)',
  'EMAIL_APP_PASSWORD': 'Email app password (not your regular password)',
  
  // App configuration
  'NEXT_PUBLIC_BASE_URL': 'Production URL (e.g., https://tor-ramel.netlify.app)',
  'USER_ID': 'User ID for Tor-Ramel system',
  'CODE_AUTH': 'Auth code for Tor-Ramel system',
  
  // Security tokens (optional - will use defaults if not set)
  // 'CRON_SECRET': 'Secret for cron job authentication',
  // 'ADMIN_SECRET': 'Secret for admin endpoints'
};

console.log('🔍 Validating environment variables...\n');

// Enable debug mode with ENV_DEBUG=true
const debugMode = process.env.ENV_DEBUG === 'true';

// Helper function to mask sensitive values
function maskValue(value, showChars = 4) {
  if (!value || value.length <= showChars * 2) return value;
  const start = value.substring(0, showChars);
  const end = value.substring(value.length - showChars);
  return `${start}...${end}`;
}

let hasErrors = false;
const missingVars = [];
const presentVars = [];
const invalidVars = [];

// First, show all environment variables in debug mode
if (debugMode) {
  console.log('🔍 DEBUG MODE - All environment variables:\n');
  const allEnvVars = Object.keys(process.env).filter(key => 
    key.includes('SUPABASE') || 
    key.includes('EMAIL') || 
    key.includes('USER_ID') || 
    key.includes('CODE_AUTH') || 
    key.includes('BASE_URL') ||
    key.includes('CRON_SECRET') ||
    key.includes('ADMIN_SECRET')
  ).sort();
  
  allEnvVars.forEach(key => {
    const value = process.env[key];
    console.log(`   ${key}: ${value ? maskValue(value) : '(not set)'}`);
  });
  console.log('');
}

// Check each required variable
console.log('📋 Checking required environment variables:\n');

for (const [varName, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[varName];
  
  if (!value || value.trim() === '') {
    missingVars.push({ name: varName, description });
    hasErrors = true;
    console.log(`   ❌ ${varName}: MISSING`);
  } else if (value === 'REQUIRED - Set in Netlify dashboard') {
    invalidVars.push({ name: varName, description });
    hasErrors = true;
    console.log(`   ⚠️  ${varName}: NOT CONFIGURED (placeholder value)`);
  } else {
    presentVars.push({ name: varName, value: maskValue(value) });
    console.log(`   ✅ ${varName}: SET (${maskValue(value, 6)})`);
  }
}

console.log('');

// Show summary
console.log('📊 Summary:');
console.log(`   Total required: ${Object.keys(requiredEnvVars).length}`);
console.log(`   Present: ${presentVars.length}`);
console.log(`   Missing: ${missingVars.length}`);
console.log(`   Invalid: ${invalidVars.length}\n`);

// Report errors
if (missingVars.length > 0) {
  console.error('❌ Missing environment variables:\n');
  missingVars.forEach(({ name, description }) => {
    console.error(`   ${name}:`);
    console.error(`     Description: ${description}`);
    console.error(`     Status: NOT SET IN NETLIFY\n`);
  });
}

if (invalidVars.length > 0) {
  console.error('⚠️  Environment variables with placeholder values:\n');
  invalidVars.forEach(({ name, description }) => {
    console.error(`   ${name}:`);
    console.error(`     Description: ${description}`);
    console.error(`     Status: Has placeholder value - needs real value\n`);
  });
}

if (hasErrors) {
  console.error('\n📝 To fix this issue:\n');
  console.error('   1. Go to Netlify Dashboard > Site Settings > Environment Variables');
  console.error('   2. Click "Add a variable" for each missing variable');
  console.error('   3. Copy the exact variable name (case-sensitive!)');
  console.error('   4. Paste the value from your .env.local file\n');
  
  console.error('🔍 Double-check in Netlify:');
  console.error('   - Variable names must match EXACTLY (including case)');
  console.error('   - No extra spaces before or after values');
  console.error('   - No quotes around values (Netlify adds them automatically)\n');
  
  console.error('📋 Copy these variable names to Netlify:');
  missingVars.forEach(({ name }) => {
    console.error(`   ${name}`);
  });
  
  console.error('\n🔗 Getting the values:');
  console.error('   - Supabase: https://app.supabase.com/project/[YOUR_PROJECT]/settings/api');
  console.error('   - Email: Use Gmail app password from https://myaccount.google.com/apppasswords');
  console.error('   - Copy other values from your .env.local file\n');
  
  process.exit(1);
} else {
  console.log('✅ All required environment variables are properly set!\n');
  
  // Additional validation
  console.log('🔍 Performing additional validation...\n');
  
  let warnings = false;
  
  // Check Supabase URLs
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
    console.warn('⚠️  Warning: SUPABASE_URL should start with https://');
    warnings = true;
  }
  
  // Check if public and private versions match
  if (process.env.SUPABASE_URL !== process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('⚠️  Warning: SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL should be the same');
    console.warn(`     SUPABASE_URL: ${maskValue(process.env.SUPABASE_URL || '')}`);
    console.warn(`     NEXT_PUBLIC_SUPABASE_URL: ${maskValue(process.env.NEXT_PUBLIC_SUPABASE_URL || '')}`);
    warnings = true;
  }
  
  if (process.env.SUPABASE_ANON_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️  Warning: SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY should be the same');
    warnings = true;
  }
  
  // Check base URL
  if (process.env.NEXT_PUBLIC_BASE_URL && !process.env.NEXT_PUBLIC_BASE_URL.startsWith('http')) {
    console.warn('⚠️  Warning: NEXT_PUBLIC_BASE_URL should start with http:// or https://');
    warnings = true;
  }
  
  if (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.endsWith('/')) {
    console.warn('⚠️  Warning: NEXT_PUBLIC_BASE_URL should not have a trailing slash');
    warnings = true;
  }
  
  if (!warnings) {
    console.log('✅ All validations passed!');
  }
  
  console.log('\n✅ Environment validation complete!\n');
} 
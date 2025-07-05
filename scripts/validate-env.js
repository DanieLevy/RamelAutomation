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

let hasErrors = false;
const missingVars = [];
const invalidVars = [];

// Check each required variable
for (const [varName, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[varName];
  
  if (!value) {
    missingVars.push({ name: varName, description });
    hasErrors = true;
  } else if (value === 'REQUIRED - Set in Netlify dashboard') {
    invalidVars.push({ name: varName, description });
    hasErrors = true;
  }
}

// Report results
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:\n');
  missingVars.forEach(({ name, description }) => {
    console.error(`   ${name}: ${description}`);
  });
  console.error('');
}

if (invalidVars.length > 0) {
  console.error('❌ Environment variables not properly set:\n');
  invalidVars.forEach(({ name, description }) => {
    console.error(`   ${name}: ${description}`);
  });
  console.error('');
}

if (hasErrors) {
  console.error('📝 To fix this:');
  console.error('   1. Go to Netlify Dashboard > Site Settings > Environment Variables');
  console.error('   2. Add all missing variables listed above');
  console.error('   3. For Supabase credentials, get them from: https://app.supabase.com/project/[YOUR_PROJECT_ID]/settings/api');
  console.error('   4. For email, use Gmail app password: https://support.google.com/accounts/answer/185833');
  console.error('   5. Redeploy after adding all variables\n');
  
  console.error('🔗 Documentation:');
  console.error('   - Supabase Keys: Both SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL should be the same');
  console.error('   - Anon Keys: Both SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY should be the same');
  console.error('   - NEXT_PUBLIC_BASE_URL should be your production URL without trailing slash\n');
  
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!\n');
  
  // Additional validation
  console.log('🔍 Performing additional validation...\n');
  
  // Check Supabase URLs
  if (!process.env.SUPABASE_URL.startsWith('https://')) {
    console.error('⚠️  Warning: SUPABASE_URL should start with https://');
  }
  
  // Check if public and private versions match
  if (process.env.SUPABASE_URL !== process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('⚠️  Warning: SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL should be the same');
  }
  
  if (process.env.SUPABASE_ANON_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('⚠️  Warning: SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY should be the same');
  }
  
  // Check base URL
  if (!process.env.NEXT_PUBLIC_BASE_URL.startsWith('http')) {
    console.error('⚠️  Warning: NEXT_PUBLIC_BASE_URL should start with http:// or https://');
  }
  
  if (process.env.NEXT_PUBLIC_BASE_URL.endsWith('/')) {
    console.error('⚠️  Warning: NEXT_PUBLIC_BASE_URL should not have a trailing slash');
  }
  
  console.log('\n✅ Environment validation complete!\n');
} 
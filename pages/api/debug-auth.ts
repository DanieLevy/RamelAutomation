import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development or with admin secret
  const isDev = process.env.NODE_ENV === 'development';
  const hasAdminSecret = req.headers.authorization === `Bearer ${process.env.ADMIN_SECRET}`;
  
  if (!isDev && !hasAdminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check which environment variables are set (without exposing values)
  const envStatus = {
    // Supabase
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    
    // Email
    EMAIL_SENDER: !!process.env.EMAIL_SENDER,
    EMAIL_APP_PASSWORD: !!process.env.EMAIL_APP_PASSWORD,
    
    // App
    NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
    USER_ID: !!process.env.USER_ID,
    CODE_AUTH: !!process.env.CODE_AUTH,
    
    // Security
    CRON_SECRET: !!process.env.CRON_SECRET,
    ADMIN_SECRET: !!process.env.ADMIN_SECRET,
  };

  // Check URL formats (without exposing full URLs)
  const urlChecks = {
    supabaseUrlValid: process.env.SUPABASE_URL?.startsWith('https://') || false,
    supabaseUrlsMatch: process.env.SUPABASE_URL === process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKeysMatch: process.env.SUPABASE_ANON_KEY === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    baseUrlValid: process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http') || false,
    baseUrlNoTrailingSlash: !process.env.NEXT_PUBLIC_BASE_URL?.endsWith('/'),
  };

  // Test Supabase connection
  let supabaseConnection = false;
  let supabaseError = null;
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // Try a simple query
      const { error } = await supabase.from('user_sessions').select('count').limit(1);
      if (!error) {
        supabaseConnection = true;
      } else {
        supabaseError = error.message;
      }
    }
  } catch (err) {
    supabaseError = err instanceof Error ? err.message : 'Unknown error';
  }

  return res.status(200).json({
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    envStatus,
    urlChecks,
    supabaseConnection,
    supabaseError,
    recommendations: generateRecommendations(envStatus, urlChecks, supabaseConnection)
  });
}

function generateRecommendations(envStatus: any, urlChecks: any, supabaseConnection: boolean) {
  const recommendations = [];

  // Check for missing env vars
  const missing = Object.entries(envStatus)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missing.length > 0) {
    recommendations.push(`Missing environment variables: ${missing.join(', ')}`);
  }

  // Check URL issues
  if (!urlChecks.supabaseUrlsMatch) {
    recommendations.push('SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL should be identical');
  }

  if (!urlChecks.supabaseAnonKeysMatch) {
    recommendations.push('SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY should be identical');
  }

  if (!urlChecks.supabaseUrlValid) {
    recommendations.push('SUPABASE_URL should start with https://');
  }

  if (!urlChecks.baseUrlValid) {
    recommendations.push('NEXT_PUBLIC_BASE_URL should start with http:// or https://');
  }

  if (!urlChecks.baseUrlNoTrailingSlash) {
    recommendations.push('NEXT_PUBLIC_BASE_URL should not have a trailing slash');
  }

  if (!supabaseConnection) {
    recommendations.push('Unable to connect to Supabase - check your credentials');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All environment variables are properly configured!');
  }

  return recommendations;
} 
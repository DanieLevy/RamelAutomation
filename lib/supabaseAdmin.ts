import { createClient } from '@supabase/supabase-js';

// This client is intended for server-side use only.
// It uses the Supabase Service Role Key for privileged access.
// NEVER expose this client or the service role key to the browser.

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase URL or service role key is not set. Please check your environment variables.');
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
); 
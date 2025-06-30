-- Create user OTP tokens table
CREATE TABLE IF NOT EXISTS user_otp_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for user OTP tokens
CREATE INDEX IF NOT EXISTS idx_user_otp_email ON user_otp_tokens(email);
CREATE INDEX IF NOT EXISTS idx_user_otp_expires ON user_otp_tokens(expires_at);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_activity TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_email ON user_sessions(email);

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON user_otp_tokens TO anon;
GRANT ALL ON user_otp_tokens TO authenticated;
GRANT ALL ON user_sessions TO anon;
GRANT ALL ON user_sessions TO authenticated; 
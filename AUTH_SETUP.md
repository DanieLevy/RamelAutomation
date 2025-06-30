# Authentication System Setup

## Overview
The application now uses OTP (One-Time Password) authentication for user login. Users must verify their email with a 6-digit code before they can create notification subscriptions.

## Features Implemented

### 1. OTP Authentication
- Users enter their email to receive a 6-digit OTP
- OTP is sent via email and expires after 10 minutes
- After successful verification, a session token is generated
- Session tokens expire after 30 days

### 2. Session Management
- Authentication tokens are stored in localStorage
- Tokens are verified on page load
- Users can logout with the logout button in the header
- Invalid/expired tokens are automatically cleared

### 3. Navigation Bar Fixes
- Fixed active state indicator position
- Fixed text color issues (was black on black)
- Added proper gap between navigation items

## Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
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

-- Grant permissions
GRANT ALL ON user_otp_tokens TO anon;
GRANT ALL ON user_otp_tokens TO authenticated;
GRANT ALL ON user_sessions TO anon;
GRANT ALL ON user_sessions TO authenticated;
```

## API Endpoints

### `/api/generate-user-otp`
- POST request with `{ email: "user@example.com" }`
- Generates and sends OTP to the user's email
- Returns success/error status

### `/api/verify-user-otp`
- POST request with `{ email: "user@example.com", otp: "123456" }`
- Verifies the OTP and creates a session
- Returns authentication token on success

### `/api/verify-auth-token`
- POST request with `{ token: "auth-token" }`
- Verifies if a token is still valid
- Updates last activity timestamp

## User Flow

1. **Home Page (`/`)**
   - Non-authenticated users see OTP login form
   - Cannot create notification subscriptions until authenticated
   - Can still use manual search

2. **Notifications Page (`/notifications`)**
   - Requires authentication to create subscriptions
   - Shows OTP login form for non-authenticated users
   - Authenticated users can manage their subscriptions

3. **Logout**
   - Click the logout button (icon) in the header
   - Clears localStorage tokens
   - Returns to login state

## LocalStorage Keys

- `ramel_user_email` - Stores the authenticated user's email
- `ramel_auth_token` - Stores the authentication token

## Environment Variables Required

Make sure these are set in your `.env.local`:
- `EMAIL_SENDER` - Gmail address for sending emails
- `EMAIL_APP_PASSWORD` - Gmail app password
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key 
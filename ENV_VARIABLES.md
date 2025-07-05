# Environment Variables Documentation

This document lists all required environment variables for the Tor-Ramel Automation project.

## Required Environment Variables

### Supabase Configuration 🗄️

These variables connect your app to Supabase for database operations and authentication.

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | [Supabase Dashboard](https://app.supabase.com) > Settings > API |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as SUPABASE_URL (for client-side) | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for server operations | Settings > API > Service role key |
| `SUPABASE_ANON_KEY` | Anonymous key for client operations | Settings > API > anon public key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY (for client-side) | Same as above |

⚠️ **Important**: 
- `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` must be identical
- `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be identical
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code

### Email Configuration 📧

For sending OTP codes and notifications.

| Variable | Description | How to Get |
|----------|-------------|------------|
| `EMAIL_SENDER` | Gmail address for sending emails | Your Gmail address |
| `EMAIL_APP_PASSWORD` | App-specific password | [Create app password](https://support.google.com/accounts/answer/185833) |

### Application Configuration ⚙️

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_URL` | Production URL (no trailing slash) | `https://tor-ramel.netlify.app` |
| `USER_ID` | Tor-Ramel system user ID | `4481` |
| `CODE_AUTH` | Tor-Ramel authentication code | Your auth code |

### Security Tokens 🔐 (Optional)

These are auto-generated in netlify.toml if not provided:

| Variable | Description | Default |
|----------|-------------|---------|
| `CRON_SECRET` | Authentication for scheduled functions | Auto-generated |
| `ADMIN_SECRET` | Authentication for admin endpoints | Auto-generated |

## Setting Environment Variables

### For Local Development

1. Create a `.env.local` file in the project root
2. Copy all variables from this document
3. Fill in your actual values

Example `.env.local`:
```env
# Supabase
SUPABASE_URL=https://wwhpelkwjwtgpfzztixk.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://wwhpelkwjwtgpfzztixk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...
SUPABASE_ANON_KEY=eyJhbGciOiJ...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...

# Email
EMAIL_SENDER=your-email@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
USER_ID=4481
CODE_AUTH=Sa1W2GjL
```

### For Production (Netlify)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site Settings** > **Environment Variables**
4. Add each variable with its production value
5. Deploy or trigger a rebuild

## Validation

The build process now includes automatic validation:

```bash
# Run validation manually
npm run validate:env

# Validation runs automatically on build
npm run build
```

If any required variables are missing, the build will fail with clear instructions.

## Troubleshooting

### Auth Not Working in Production

If you see `email: null, hasToken: false` in production:

1. Check that all Supabase variables are set correctly in Netlify
2. Ensure `NEXT_PUBLIC_` prefixed variables are set
3. Verify the Supabase URL starts with `https://`
4. Clear browser cache and cookies
5. Check Netlify function logs for errors

### Email Not Sending

1. Verify `EMAIL_SENDER` is a valid Gmail address
2. Ensure `EMAIL_APP_PASSWORD` is an app password, not your regular password
3. Check that 2-factor authentication is enabled on your Gmail account
4. Test with the email test script: `node scripts/test-emails.js`

### Build Failing

1. Run `npm run validate:env` locally
2. Check which variables are missing
3. Add them in Netlify dashboard
4. Trigger a new deploy 
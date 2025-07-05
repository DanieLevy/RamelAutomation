# Netlify Environment Variables Setup Guide

## 🚨 Build Failing? Follow These Steps!

Your Netlify build is failing because environment variables aren't set up. Here's exactly how to fix it:

## Step 1: Access Netlify Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click on your site
3. Go to **Site configuration** → **Environment variables**
4. Click **Add a variable**

## Step 2: Add Each Variable

Copy and paste these **EXACT** variable names (case-sensitive!) and their values from your `.env.local` file:

### Required Variables Checklist

- [ ] `SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `EMAIL_SENDER`
- [ ] `EMAIL_APP_PASSWORD`
- [ ] `NEXT_PUBLIC_BASE_URL`
- [ ] `USER_ID`
- [ ] `CODE_AUTH`

### Optional Variables (Recommended)

- [ ] `CRON_SECRET`
- [ ] `ADMIN_SECRET`
- [ ] `REQUEST_DELAY_MS`

## Step 3: Common Mistakes to Avoid

### ❌ DON'T DO THIS:
- Don't add quotes around values (Netlify adds them automatically)
- Don't add spaces before or after values
- Don't change the variable names (they must match EXACTLY)

### ✅ DO THIS:
- Copy variable names exactly as shown above
- Paste values directly from `.env.local`
- Double-check for typos

## Step 4: Variable Values Guide

### From your `.env.local` file, copy these values:

```bash
# Example format (YOUR VALUES WILL BE DIFFERENT):
SUPABASE_URL=https://wwhpelkwjjtgpfzztixk.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://wwhpelkwjjtgpfzztixk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EMAIL_SENDER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
NEXT_PUBLIC_BASE_URL=https://tor-ramel.netlify.app
USER_ID=4481
CODE_AUTH=Sa1W2GjL
```

### Important Notes:

1. **SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_URL** should be the SAME value
2. **SUPABASE_ANON_KEY** and **NEXT_PUBLIC_SUPABASE_ANON_KEY** should be the SAME value
3. **NEXT_PUBLIC_BASE_URL** should NOT have a trailing slash

## Step 5: After Adding Variables

1. Click **Save** for each variable
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Deploy site**
4. Wait for the build to complete

## Troubleshooting

### If build still fails:

1. Check the build logs for which specific variable is missing
2. In Netlify, verify the variable name matches EXACTLY (including case)
3. Make sure there are no extra spaces in the value
4. Try clearing cache and deploying: **Trigger deploy** → **Clear cache and deploy site**

### To debug environment variables:

Add this temporary variable in Netlify:
- Name: `ENV_DEBUG`
- Value: `true`

This will show which variables are detected in the build logs.

## Need Help?

If you're still having issues:

1. Check that all 10 required variables are added
2. Compare variable names character-by-character
3. Ensure values don't have quotes or extra spaces
4. Make sure you clicked "Save" for each variable

## Quick Copy-Paste List

Here are all the variable names for easy copying:

```
SUPABASE_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
EMAIL_SENDER
EMAIL_APP_PASSWORD
NEXT_PUBLIC_BASE_URL
USER_ID
CODE_AUTH
CRON_SECRET
ADMIN_SECRET
REQUEST_DELAY_MS
``` 
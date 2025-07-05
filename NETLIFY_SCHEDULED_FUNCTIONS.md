# Netlify Scheduled Functions Setup

After deployment, you need to configure the scheduled functions in the Netlify UI. Netlify doesn't support scheduled functions configuration in `netlify.toml`.

## Functions to Schedule

### 1. **auto-check**
- **Schedule**: `*/5 * * * *` (Every 5 minutes)
- **Purpose**: Checks for available appointments on Tor website
- **Location**: `netlify/functions/auto-check.js`

### 2. **process-cached-notifications** 
- **Schedule**: `1-59/5 * * * *` (1 minute after every auto-check)
- **Purpose**: Processes email notifications based on cached appointment results
- **Location**: `netlify/functions/process-cached-notifications.js`

### 3. **process-email-queue**
- **Schedule**: `*/2 * * * *` (Every 2 minutes)
- **Purpose**: Processes queued emails and sends them
- **Location**: `netlify/functions/process-email-queue.js`

### 4. **data-cleanup**
- **Schedule**: `0 1 * * *` (Daily at 1 AM UTC)
- **Purpose**: Cleans up old data and expired subscriptions
- **Location**: `netlify/functions/data-cleanup.js`

## How to Set Up Scheduled Functions in Netlify

### Option 1: Using Netlify UI (Experimental Feature)

1. Go to your Netlify dashboard
2. Navigate to **Functions** tab
3. Look for "Scheduled Functions" (this is an experimental feature)
4. Click on each function and set its schedule using cron syntax

**Note**: As of 2025, Netlify's scheduled functions are still experimental and may require enabling in Labs features.

### Option 2: Using External Cron Services

Since Netlify's native scheduled functions might not be available, you can use external services:

1. **EasyCron** (https://www.easycron.com)
   - Create a cron job for each function
   - URL: `https://your-site.netlify.app/.netlify/functions/function-name`
   - Add `Authorization: Bearer YOUR_CRON_SECRET` header

2. **Cron-job.org** (https://cron-job.org)
   - Free service for basic cron jobs
   - Set up HTTP GET/POST requests to your function URLs

3. **GitHub Actions** (if your repo is on GitHub)
   ```yaml
   name: Trigger Auto Check
   on:
     schedule:
       - cron: '*/5 * * * *'
   jobs:
     trigger:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger function
           run: |
             curl -X POST https://your-site.netlify.app/.netlify/functions/auto-check \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
   ```

### Option 3: Using Netlify Build Plugins

Install a plugin like `netlify-plugin-cron` to handle scheduled functions:

```toml
[[plugins]]
  package = "netlify-plugin-cron"
  [plugins.inputs]
    expression = "*/5 * * * *"
    function = "auto-check"
```

## Function URLs

After deployment, your functions will be available at:

- Auto-check: `https://tor-ramel.netlify.app/.netlify/functions/auto-check`
- Process notifications: `https://tor-ramel.netlify.app/.netlify/functions/process-cached-notifications`
- Process email queue: `https://tor-ramel.netlify.app/.netlify/functions/process-email-queue`
- Data cleanup: `https://tor-ramel.netlify.app/.netlify/functions/data-cleanup`

## Security

All scheduled functions should verify the `Authorization` header:
```javascript
if (event.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
  return { statusCode: 401, body: 'Unauthorized' };
}
```

## Testing

You can test functions locally:
```bash
netlify functions:invoke auto-check
```

Or via curl:
```bash
curl https://tor-ramel.netlify.app/.netlify/functions/auto-check \
  -H "Authorization: Bearer your-cron-secret"
``` 
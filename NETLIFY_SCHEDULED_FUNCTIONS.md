# Netlify Scheduled Functions Documentation

## Overview

This project uses Netlify Scheduled Functions for automated background tasks.

### Current Scheduled Functions:

1. **auto-check.js** - Appointment availability checker with integrated email processing (runs every 5 minutes)

## Functions

### 1. Auto-Check Function (`auto-check.js`)

**Schedule**: Every 5 minutes (`@every 5m`)

**Purpose**: 
- Checks barbershop website for available appointments
- Updates cache with latest availability
- Processes notification subscriptions
- Queues notification emails when appointments become available
- Processes email queue inline (integrated)

**Key Features**:
- Intelligent caching to reduce API calls
- Adaptive batching for performance
- Strict 9-second execution limit (stays under Netlify's 10-second max)
- Checks 30 days ahead (excluding closed days)
- Integrated email processing to reduce function invocations

## How It Works

The `auto-check.js` function handles everything in a single, optimized process:

1. **Appointment Checking** (0-9 seconds):
   - Checks up to 30 days of appointments
   - Uses intelligent caching to avoid redundant checks
   - Stops at 9 seconds to ensure completion

2. **Email Processing** (integrated):
   - If appointments are found, immediately processes subscriptions
   - Queues emails for new appointments
   - Marks appointments as sent to avoid duplicates

3. **Performance Optimizations**:
   - Adaptive batch sizing based on response times
   - Aggressive caching with 2-minute TTL
   - Parallel operations where possible

## Removed Functions

- ❌ **Removed**: `process-emails.js` - Email processing is now integrated into auto-check.js
- ❌ **Removed**: `process-email-queue.js`, `data-cleanup.js`, `process-cached-notifications.js` - These were timing out and causing excessive retries

## Testing Scheduled Functions

### Local Testing

Test the auto-check function (includes email processing):
```bash
netlify functions:invoke auto-check
```

### Production Testing

The function runs automatically every 5 minutes in production, but you can also trigger it manually:

- Manual trigger: `https://your-site.netlify.app/.netlify/functions/auto-check`

## Monitoring

Check function execution in Netlify:
1. Go to your site dashboard
2. Navigate to Functions → Scheduled
3. View execution logs and metrics

## Configuration

Scheduled functions are configured using the `exports.config` object:

```javascript
exports.config = {
  schedule: "@every 5m"  // Runs every 5 minutes
}
```

### Available Schedule Formats:
- `@hourly` - Every hour
- `@daily` - Every day at midnight
- `@weekly` - Every week
- `@monthly` - Every month
- `@yearly` - Every year
- `@every 15m` - Every 15 minutes
- Cron expressions: `0 */2 * * *` (every 2 hours)

## Best Practices

1. **Keep functions fast**: Netlify has a 10-second timeout for scheduled functions
2. **Use caching**: Reduce external API calls by caching results
3. **Handle errors gracefully**: Functions should not crash on errors
4. **Log appropriately**: Use console.log for debugging, but avoid excessive logging
5. **Test locally first**: Use `netlify dev` and `netlify functions:invoke`

## Troubleshooting

### Function Not Running?

1. Check the function has `exports.config` with a valid schedule
2. Verify the function is deployed (check Functions tab in Netlify)
3. Check logs for errors

### Function Timing Out?

1. Optimize code to run faster
2. Reduce batch sizes
3. Implement caching
4. Use parallel processing where possible

### Emails Not Being Sent?

1. Check environment variables are set (EMAIL_SENDER, EMAIL_APP_PASSWORD)
2. Verify database connection
3. Check the email_queue table for pending emails
4. Review function logs for email processing errors
5. Ensure appointments are actually being found 
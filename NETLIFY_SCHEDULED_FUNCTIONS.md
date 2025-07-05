# Netlify Scheduled Functions Setup

## Important Update (July 2025)

**Due to function timeout issues and excessive invocations burning through the 125k monthly limit, we've simplified the architecture:**

- ✅ **Kept**: `auto-check.js` - The main function that checks for appointments and processes emails (integrated)
- ❌ **Removed**: `process-email-queue.js`, `data-cleanup.js`, `process-cached-notifications.js` - These were timing out and causing excessive retries

## Current Architecture

The system now runs with a single Netlify function:
- `auto-check.js` - Checks appointments AND processes email notifications in one go (under 8 seconds)

## Setting Up Scheduled Execution

Since Netlify doesn't support scheduled functions in `netlify.toml`, you need to use external services:

### Option 1: GitHub Actions (Recommended - FREE)

Create `.github/workflows/scheduled-checks.yml`:

```yaml
name: Scheduled Appointment Checks

on:
  schedule:
    # Run every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allow manual triggers

jobs:
  check-appointments:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto-Check Function
        run: |
          curl -X GET "https://tor-ramel.netlify.app/.netlify/functions/auto-check" \
            -H "Accept: application/json" \
            --fail \
            --max-time 30
      
      - name: Log Result
        if: always()
        run: echo "Check completed at $(date)"
```

### Option 2: Cron-job.org (FREE)

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Create a new cron job:
   - **URL**: `https://tor-ramel.netlify.app/.netlify/functions/auto-check`
   - **Schedule**: Every 5 minutes
   - **Method**: GET
   - **Timeout**: 30 seconds

### Option 3: UptimeRobot (FREE up to 50 monitors)

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create a new monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://tor-ramel.netlify.app/.netlify/functions/auto-check`
   - **Monitoring Interval**: 5 minutes

### Option 4: Google Cloud Scheduler (FREE tier available)

```bash
# Create a Cloud Scheduler job
gcloud scheduler jobs create http auto-check-appointments \
  --schedule="*/5 * * * *" \
  --uri="https://tor-ramel.netlify.app/.netlify/functions/auto-check" \
  --http-method=GET \
  --time-zone="Asia/Jerusalem" \
  --attempt-deadline="30s"
```

## Function Invocation Limits

With the simplified architecture:
- Each check = 1 function invocation
- 5-minute intervals = 12 checks/hour = 288 checks/day = ~8,640 checks/month
- **Well under the 125k monthly limit** ✅

## Email Processing

Email processing is now integrated into the `auto-check` function:
1. Checks for appointments
2. Identifies active subscriptions
3. Queues emails for new appointments only
4. Tracks sent appointments to prevent duplicates
5. All within the 8-second execution window

## Manual Testing

Test the function locally:
```bash
# Using curl
curl https://tor-ramel.netlify.app/.netlify/functions/auto-check

# Using Netlify CLI
netlify functions:invoke auto-check
```

## Monitoring

Monitor function performance in the Netlify dashboard:
- Functions tab → View logs
- Check execution times (should be < 8 seconds)
- Monitor monthly usage to stay under 125k invocations

## Troubleshooting

If you see excessive invocations:
1. Check external schedulers aren't running multiple instances
2. Ensure no retry logic is causing loops
3. Monitor function logs for errors
4. Consider increasing check interval if needed

## Future Improvements

If you need more complex scheduling:
1. Consider moving to Vercel (built-in cron support)
2. Use AWS Lambda with EventBridge
3. Deploy a dedicated cron service
4. Use Supabase Edge Functions with pg_cron 
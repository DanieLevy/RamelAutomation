# Deployment Checklist

## Environment Variables to Set in Netlify

### Required Variables:
```bash
# Authentication cookies (already set)
USER_ID=4481
CODE_AUTH=Sa1W2GjL
REQUEST_DELAY_MS=1000

# Supabase (already set)
SUPABASE_URL=https://wwhpelkwjwtgpfzztixk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://wwhpelkwjwtgpfzztixk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email (already set)
EMAIL_SENDER=daniellofficial@gmail.com
EMAIL_APP_PASSWORD=vpbnuduyocmopyaa

# NEW - Add these:
NEXT_PUBLIC_BASE_URL=https://tor-ramel.netlify.app
URL=https://tor-ramel.netlify.app
DEPLOY_URL=https://tor-ramel.netlify.app

# IMPORTANT - Generate secure random strings for these:
CRON_SECRET=<generate-secure-random-string-32-chars>
ADMIN_SECRET=<generate-secure-random-string-32-chars>
```

### To Generate Secure Secrets:
```javascript
// Run in browser console or Node.js:
console.log(crypto.randomBytes(32).toString('hex'))
```

## Scheduled Functions

The following functions will run automatically:

1. **auto-check** - Every 5 minutes
   - Checks for appointments
   - Triggers email notifications

2. **process-email-queue** - Every 2 hours
   - Processes retry queue
   - Handles failed emails

3. **process-batch-notifications** - Every 30 minutes
   - Processes batched emails
   - Handles scheduled notifications

4. **data-cleanup** - Daily at 3 AM
   - Cleans expired tokens
   - Archives old emails
   - Maintains database health

## Post-Deployment Steps

### 1. Verify Functions
```bash
# Check Netlify Functions logs
# Functions > View logs for each function
```

### 2. Test Email System
1. Create a test subscription
2. Check email queue: `/api/email-queue-status`
3. Monitor circuit breaker health

### 3. Database Monitoring
```sql
-- Check active subscriptions
SELECT COUNT(*) FROM notifications WHERE status = 'active';

-- Check email queue
SELECT status, COUNT(*) FROM email_queue GROUP BY status;

-- Check batch queue
SELECT COUNT(*) FROM notification_batch_queue WHERE status = 'pending';

-- Check circuit breaker
SELECT * FROM smtp_circuit_breaker;
```

### 4. Initial Health Checks
- Visit `/api/email-queue-status` (GET)
- Check for any failed migrations in Supabase
- Verify all scheduled functions are running

## Features Summary

### Enhanced Error Handling ✅
- Email retry with exponential backoff
- Circuit breaker for SMTP protection
- Queue system prevents email loss

### Data Integrity ✅
- Soft deletes for audit trail
- Automated token cleanup
- Email history archival
- Template versioning

### Smart Scheduling ✅
- User preferred send times
- Quiet hours respect
- Weekend control
- Urgent mode for same-day
- Email batching

## Rollback Plan

If issues arise:

1. **Disable Functions**: Comment out schedule in netlify.toml
2. **Reset Circuit Breaker**: 
   ```bash
   POST /api/email-queue-status
   { "action": "reset-circuit-breaker" }
   ```
3. **Clear Queue**: Delete pending emails if needed
4. **Revert Code**: Git revert to previous commit

## Support & Monitoring

### Key Metrics to Watch:
- Email delivery rate
- Queue processing time
- Circuit breaker state
- Error rates in functions

### Alerts to Set Up:
- Function failures > 5 in 10 minutes
- Circuit breaker open for > 10 minutes
- Email queue > 100 pending

## Success Criteria

✅ All functions deploying successfully
✅ Emails being delivered
✅ No errors in function logs
✅ Circuit breaker in 'closed' state
✅ Users receiving notifications at preferred times 
# Netlify Function Optimization

## Overview

To stay within Netlify's 125,000 monthly function invocations limit, we've optimized our scheduled functions into a single, efficient function.

## Changes Made

### Before (2 functions, 30 invocations/hour)
- `auto-check.js` - Ran every 15 minutes (4x/hour)
- `process-emails.js` - Ran every 15 minutes (4x/hour)
- **Total**: 8 invocations/hour = 5,760/month

### After (1 function, 12 invocations/hour)
- `auto-check.js` - Runs every 5 minutes with integrated email processing
- **Total**: 12 invocations/hour = 8,640/month

## Benefits

1. **Reduced Complexity**: Single function handles everything
2. **Better Performance**: No waiting for separate email processing
3. **Immediate Notifications**: Emails sent as soon as appointments found
4. **Well Within Limits**: 8,640 invocations/month (6.9% of 125k limit)

## Technical Details

### Time Management
- Function has strict 9-second limit (Netlify allows 10)
- Appointment checking: 0-9 seconds
- Email processing: Integrated inline
- Cache TTL: 2 minutes

### How It Works
1. Check appointments (with caching)
2. If found, immediately:
   - Process active subscriptions
   - Queue emails for new appointments
   - Mark appointments as sent
3. Complete within 9 seconds

### Performance Safeguards
- Adaptive batch sizing
- Aggressive caching
- Time limit checks
- Error recovery

## Monthly Usage Calculation

```
12 invocations/hour × 24 hours × 30 days = 8,640 invocations/month
8,640 / 125,000 = 6.9% of monthly limit
```

This leaves plenty of headroom for:
- Manual function triggers
- API endpoint calls
- Other serverless functions
- Future growth

## Monitoring

Check your usage at:
1. Netlify Dashboard → Functions tab
2. Look for invocation count
3. Monitor execution time (should be < 10s)

## Future Optimizations

If needed, we could further reduce invocations by:
- Running every 10 minutes (4,320/month)
- Running every 15 minutes (2,880/month)
- Adding more intelligent caching
- Checking only when users are active 
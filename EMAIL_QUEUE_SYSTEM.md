# Email Queue System Documentation

## Overview

The Ramel Barbershop notification system uses an **email queue** for reliability and performance. Instead of sending emails immediately, they are:

1. **Queued** in the database when triggered
2. **Processed** in batches by a background job
3. **Sent** via SMTP with retry logic

## Why Queue Emails?

- **Reliability**: If email sending fails, it can be retried
- **Performance**: The UI doesn't wait for email sending (which can be slow)
- **Rate Limiting**: Prevents overwhelming the email server
- **Circuit Breaker**: Protects against cascading failures

## How It Works

```
User Action → Email Queued → Background Processing → Email Sent
```

### 1. Email Gets Queued
When a user subscribes to notifications, the confirmation email is added to the `email_queue` table with status `pending`.

### 2. Processing Method

#### Integrated Processing (Production)
On Netlify, emails are processed automatically as part of the appointment checking:
- **Single scheduled function** (`auto-check.js`) runs every 5 minutes
- When appointments are found, it immediately:
  - Processes all active subscriptions
  - Queues emails for new appointments
  - Marks appointments as sent to avoid duplicates
- Handles everything within 9 seconds (Netlify's limit is 10 seconds)
- Only runs in production environment

#### Manual Processing (Development)
During development, you can manually trigger the process by calling the API:

```bash
# Trigger appointment check (which includes email processing)
curl http://localhost:3000/api/check-appointments
```

### 3. Email States

- **pending**: Waiting to be sent
- **sent**: Successfully delivered
- **failed**: Failed after max retries

## Manage Subscriptions

Users can manage their notification subscriptions:

1. **From Home Page**: Click "ניהול ההתראות שלי" (Manage My Notifications)
2. **From User Menu**: Click on email badge → "ניהול התראות" (Manage Notifications)
3. **Direct URL**: Navigate to `/manage`

The manage page allows users to:
- View all active subscriptions
- See email history
- Cancel subscriptions
- Delete subscriptions

## Troubleshooting

### Emails Not Sending Immediately?

This is by design. Emails are processed when appointments are found:

- **Production**: Automatically every 5 minutes when `auto-check.js` runs
- **Development**: Trigger appointment check via API

### Circuit Breaker Open?

If too many emails fail, the circuit breaker opens to prevent further attempts. It will automatically reset after a cooldown period.

### Manual Processing in Production

If needed, you can manually trigger the check (which includes email processing) in production by calling:
```
https://your-site.netlify.app/.netlify/functions/auto-check
```

## Environment Variables

Required for email functionality:
- `EMAIL_SENDER`: Gmail address
- `EMAIL_APP_PASSWORD`: Gmail app password
- `SUPABASE_URL`: Database URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key
- `CRON_SECRET` or `ADMIN_SECRET`: For scheduled function authentication 
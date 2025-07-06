# Important: About Email Notifications

## Why are emails queued and not sent immediately?

The Ramel Barbershop notification system uses an **email queue** for reliability. This means:

1. **When you subscribe**, a confirmation email is added to the queue
2. **Emails are sent in batches** every 15 minutes automatically
3. **In development**, you can send them immediately with: `npm run email:send`

## Why do it this way?

- **Reliability**: If email sending fails, it can be retried
- **Performance**: The website doesn't wait for slow email sending
- **Protection**: Prevents overloading the email server

## How to manage your subscriptions

You can manage your notification subscriptions in 3 ways:

1. **From Home Page**: Click "ניהול ההתראות שלי" (Manage My Notifications)
2. **From User Menu**: Click on your email badge → "ניהול התראות" (Manage Notifications)  
3. **Direct URL**: Go to `/manage`

## For developers

In production on Netlify, emails are processed automatically every 15 minutes by the `process-emails` scheduled function.

During development, run:
```bash
npm run email:send
```

This will immediately process all pending emails in the queue. 
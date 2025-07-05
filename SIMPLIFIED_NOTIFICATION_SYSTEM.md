# Simplified Notification System Documentation

## Overview
The notification system has been completely redesigned to be simpler and more robust. Users can now subscribe for either a single day or a date range (max 30 days), and will receive emails with ALL available appointments. Each email includes "continue search" or "stop" options.

## Key Changes

### 1. Database Schema
- **Removed tables**: `user_appointment_responses`, `ignored_appointments`
- **New tables**: 
  - `notifications_simple` - Main subscription table
  - `sent_appointments` - Tracks sent appointments to avoid duplicates
  - `user_notification_actions` - Tracks user continue/stop decisions

### 2. Subscription Types
- **Single Day**: User selects one specific date
- **Date Range**: User selects start and end dates (max 30 days)
- Excludes Monday and Saturday automatically

### 3. Email Behavior
- Only NEW appointments are sent (no duplicates)
- ALL found appointments sent in one email
- Two action buttons: Continue Search / Stop (Found appointment)
- Clean, mobile-friendly email template

### 4. Removed Features
- No more 1/6 email limits
- No more complex notification settings
- No more interval/timing preferences
- No more batch processing
- No more appointment response tracking

## Implementation Steps

### 1. Run Database Migration
Execute the SQL script in Supabase:
```bash
scripts/create-simplified-notification-schema.sql
```

### 2. Deploy Updated Code
The following files have been updated:
- `pages/api/notify-request.ts` - Simplified subscription API
- `pages/api/process-notifications.ts` - New email processing logic
- `pages/api/notification-action.ts` - NEW: Handles continue/stop actions
- `pages/api/unsubscribe.ts` - Updated for new schema
- `components/NotificationSubscribe.tsx` - Simplified UI
- `lib/emailTemplates/appointmentNotification.ts` - New email template

### 3. Test the System
Run the test script:
```bash
node scripts/test-simplified-notification.js
```

## API Endpoints

### POST /api/notify-request
Creates a new subscription.

**Request body**:
```json
{
  "email": "user@example.com",
  "subscriptionType": "single" | "range",
  "targetDate": "2025-07-15",        // For single
  "dateStart": "2025-07-15",         // For range
  "dateEnd": "2025-07-30"            // For range
}
```

### POST /api/process-notifications
Called by auto-check to send emails.

**Request body**:
```json
{
  "appointments": [
    {
      "date": "2025-07-15",
      "available": true,
      "times": ["09:00", "10:30", "14:00"]
    }
  ]
}
```

### GET /api/notification-action
Handles user actions from email links.

**Query params**:
- `token`: Action token from email
- `action`: "continue" or "stop"

### GET /api/unsubscribe
Unsubscribes user completely.

**Query params**:
- `token`: Stop token from subscription

## Database Structure

### notifications_simple
- `id`: UUID primary key
- `email`: User email
- `subscription_type`: 'single' or 'range'
- `target_date`: For single day subscriptions
- `date_start`: For range subscriptions
- `date_end`: For range subscriptions
- `status`: 'active', 'stopped', or 'expired'
- `stop_token`: For unsubscribe links
- `created_at`, `updated_at`: Timestamps

### sent_appointments
- `notification_id`: Reference to subscription
- `appointment_date`: Date of appointment
- `appointment_times`: Array of time strings
- `sent_at`: When email was sent

### user_notification_actions
- `notification_id`: Reference to subscription
- `action`: 'pending', 'continue', or 'stop'
- `action_token`: Unique token for action
- `created_at`: When action was taken

## Email Flow

1. User subscribes via simplified form
2. Auto-check finds appointments every 5 minutes
3. Process-notifications checks for NEW appointments only
4. Email sent with ALL new appointments
5. User clicks:
   - **Continue**: Action recorded, search continues
   - **Stop**: Subscription marked as stopped
6. No more emails sent after stop action

## Migration Notes

- Old notifications table preserved (not deleted)
- Migration script included to copy active subscriptions
- Can run both systems in parallel during transition
- Clean up old tables after verification

## Testing

1. Create test subscriptions with different dates
2. Run auto-check manually to trigger emails
3. Click action links in emails
4. Verify database updates correctly
5. Test unsubscribe functionality

## Benefits

- **Simpler**: No complex settings to configure
- **Clearer**: Users see all options at once
- **Robust**: Less edge cases and failure points
- **Efficient**: Only sends new appointments
- **User-friendly**: Clear continue/stop actions 
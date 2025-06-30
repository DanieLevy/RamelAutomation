# Data Integrity Improvements

## Overview
This document summarizes the comprehensive data integrity improvements implemented for the Tor-RamEl notification system.

## 1. Soft Delete Implementation ✅

### Tables Updated:
- `notifications` - Added `deleted_at` column
- `user_otp_tokens` - Added `deleted_at` column
- `management_otps` - Added `deleted_at` column
- `verification_codes` - Added `deleted_at` column  
- `user_sessions` - Added `deleted_at` column
- `management_tokens` - Added `deleted_at` column

### Benefits:
- Preserves historical data for auditing
- Allows recovery of accidentally deleted records
- Maintains referential integrity
- Enables compliance with data retention policies

### Usage:
```sql
-- Soft delete a record
UPDATE notifications 
SET deleted_at = NOW() 
WHERE id = 'uuid';

-- Query excluding soft-deleted
SELECT * FROM notifications 
WHERE deleted_at IS NULL;
```

## 2. Expired Token Cleanup ✅

### Automated Cleanup Process:
- **Function**: `soft_delete_expired_tokens()`
- **Schedule**: Daily at 3 AM via Netlify function
- **Tables Cleaned**:
  - User OTP tokens
  - Management OTPs
  - Verification codes
  - User sessions
  - Management tokens

### Two-Stage Deletion:
1. **Stage 1**: Soft delete expired tokens (immediate)
2. **Stage 2**: Permanently delete after 30 days

### API Endpoint:
```bash
POST /api/data-cleanup
{
  "operation": "expired-tokens"
}
```

## 3. Email History Archival ✅

### Archive System:
- **Table**: `email_history_archive`
- **Function**: `archive_old_email_history(days_to_keep)`
- **Default**: Archives records older than 90 days
- **Schedule**: Daily at 3 AM

### Benefits:
- Keeps main table performant
- Preserves historical data
- Reduces storage costs
- Maintains query speed

## 4. Email Template Versioning ✅

### Features:
- **Table**: `email_templates`
- **Version Control**: Each template has version numbers
- **Active/Inactive**: Only one version active at a time
- **Rollback**: Easy rollback to previous versions
- **Variables**: Tracks template variables as JSONB

### API Operations:
```bash
# Get templates
GET /api/email-templates?templateName=appointment_notification

# Create new version
POST /api/email-templates
{
  "templateName": "appointment_notification",
  "subjectTemplate": "New subject",
  "htmlTemplate": "<html>...",
  "makeActive": true
}

# Activate version
PUT /api/email-templates
{
  "id": "uuid",
  "action": "activate"
}

# Rollback
PUT /api/email-templates
{
  "templateName": "appointment_notification",
  "action": "rollback"
}
```

### Initial Templates:
1. `appointment_notification` - Main notification email
2. `welcome_email` - New subscriber welcome
3. `confirmation_email` - Subscription confirmation
4. `reminder_email` - Appointment reminder
5. `unsubscribe_email` - Unsubscribe confirmation

## 5. Cleanup Job Management ✅

### Cleanup Log:
- **Table**: `cleanup_log`
- **Tracks**: All cleanup operations
- **Metadata**: Records affected, timing, errors

### Scheduled Functions:
1. **Email Queue Processing**: Every 5 minutes
2. **Data Cleanup**: Daily at 3 AM

### Netlify Configuration:
```toml
[functions."process-email-queue"]
  schedule = "*/5 * * * *"
  timeout = 300

[functions."data-cleanup"]
  schedule = "0 3 * * *"
  timeout = 300
```

## 6. Email Queue Enhancements ✅

### Retry System:
- **Exponential Backoff**: 1min → 2min → 4min
- **Max Attempts**: 3 per email
- **Circuit Breaker**: Prevents SMTP overload
- **Queue Cleanup**: Auto-deletes after 30 days

### Circuit Breaker:
- **States**: closed, open, half_open
- **Threshold**: 5 consecutive failures
- **Timeout**: 60 seconds
- **Table**: `smtp_circuit_breaker`

## 7. Query Updates ✅

### Updated Queries:
All queries now exclude soft-deleted records:
```typescript
.is('deleted_at', null)
```

### Affected Endpoints:
- `/api/process-notifications`
- `/api/user-subscriptions`
- `/api/delete-subscription`

## 8. Database Indexes ✅

### Performance Indexes:
```sql
-- Soft delete indexes
CREATE INDEX idx_notifications_deleted_at ON notifications(deleted_at) WHERE deleted_at IS NULL;

-- Email queue indexes  
CREATE INDEX idx_email_queue_status_retry ON email_queue(status, next_retry_at);

-- Template lookup
CREATE INDEX idx_email_templates_active ON email_templates(template_name, is_active);
```

## 9. Monitoring & Maintenance

### Health Checks:
```bash
# Queue status
GET /api/email-queue-status

# Cleanup stats
GET /api/data-cleanup (after POST)
```

### Manual Operations:
```bash
# Run cleanup manually
POST /api/data-cleanup
{
  "operation": "all" | "expired-tokens" | "archive-email-history" | "purge-soft-deleted"
}

# Reset circuit breaker
POST /api/email-queue-status
{
  "action": "reset-circuit-breaker"
}
```

## 10. Benefits Summary

1. **Data Integrity**: No data loss, full audit trail
2. **Performance**: Automated cleanup keeps tables lean
3. **Reliability**: Email retry with circuit breaker
4. **Flexibility**: Template versioning for A/B testing
5. **Compliance**: Data retention policies enforced
6. **Monitoring**: Full visibility into system health
7. **Recovery**: Soft deletes allow data recovery

## Migration Rollback

If needed, to rollback soft deletes:
```sql
-- Remove soft delete columns
ALTER TABLE notifications DROP COLUMN deleted_at;
-- Repeat for other tables

-- Drop archive table
DROP TABLE email_history_archive;

-- Drop cleanup functions
DROP FUNCTION soft_delete_expired_tokens();
DROP FUNCTION archive_old_email_history(INTEGER);
```

## Environment Variables

Required in production:
```
CRON_SECRET=your-secret-key
ADMIN_SECRET=your-admin-secret
```

This completes the data integrity improvements, providing a robust, maintainable, and scalable system. 
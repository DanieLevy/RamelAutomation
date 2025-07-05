-- ============================================================================
-- SIMPLIFIED NOTIFICATION SYSTEM SCHEMA
-- ============================================================================
-- This migration creates the new simplified tables and removes complex features
-- from the notification system.
-- ============================================================================

-- Drop old complex tables
DROP TABLE IF EXISTS user_appointment_responses CASCADE;
DROP TABLE IF EXISTS ignored_appointments CASCADE;

-- Create simplified notifications table
CREATE TABLE IF NOT EXISTS notifications_simple (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('single', 'range')),
    target_date DATE, -- For single day subscriptions
    date_start DATE, -- For date range subscriptions
    date_end DATE, -- For date range subscriptions
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'expired')),
    stop_token UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT date_check CHECK (
        (subscription_type = 'single' AND target_date IS NOT NULL AND date_start IS NULL AND date_end IS NULL) OR
        (subscription_type = 'range' AND target_date IS NULL AND date_start IS NOT NULL AND date_end IS NOT NULL)
    )
);

-- Create table to track sent appointments (to avoid duplicates)
CREATE TABLE IF NOT EXISTS sent_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications_simple(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_times TEXT[] NOT NULL, -- Array of time strings
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notification_id, appointment_date, appointment_times)
);

-- Create table to track user actions (continue/stop)
CREATE TABLE IF NOT EXISTS user_notification_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications_simple(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('continue', 'stop', 'pending')),
    action_token UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_email ON notifications_simple(email);
CREATE INDEX idx_notifications_status ON notifications_simple(status);
CREATE INDEX idx_notifications_dates ON notifications_simple(target_date, date_start, date_end);
CREATE INDEX idx_sent_appointments_notification ON sent_appointments(notification_id);
CREATE INDEX idx_user_actions_notification ON user_notification_actions(notification_id);
CREATE INDEX idx_user_actions_token ON user_notification_actions(action_token);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notifications_simple
CREATE TRIGGER update_notifications_simple_updated_at 
    BEFORE UPDATE ON notifications_simple 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for active subscriptions with details
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    n.id,
    n.email,
    n.subscription_type,
    n.target_date,
    n.date_start,
    n.date_end,
    n.status,
    n.created_at,
    COUNT(DISTINCT sa.appointment_date) as appointments_sent,
    MAX(sa.sent_at) as last_notification_at,
    CASE 
        WHEN n.subscription_type = 'single' AND n.target_date < CURRENT_DATE THEN TRUE
        WHEN n.subscription_type = 'range' AND n.date_end < CURRENT_DATE THEN TRUE
        ELSE FALSE
    END as is_expired
FROM 
    notifications_simple n
    LEFT JOIN sent_appointments sa ON sa.notification_id = n.id
WHERE 
    n.status = 'active'
GROUP BY 
    n.id, n.email, n.subscription_type, n.target_date, n.date_start, n.date_end, n.status, n.created_at;

-- ============================================================================
-- MIGRATION OF EXISTING DATA (OPTIONAL)
-- ============================================================================
-- Uncomment this section if you want to migrate existing notifications

/*
-- Migrate existing active notifications
INSERT INTO notifications_simple (email, subscription_type, target_date, date_start, date_end, status, stop_token, created_at)
SELECT 
    email,
    CASE 
        WHEN criteria->>'date' IS NOT NULL THEN 'single'
        ELSE 'range'
    END as subscription_type,
    CASE 
        WHEN criteria->>'date' IS NOT NULL THEN (criteria->>'date')::DATE
        ELSE NULL
    END as target_date,
    CASE 
        WHEN criteria->>'start' IS NOT NULL THEN (criteria->>'start')::DATE
        ELSE NULL
    END as date_start,
    CASE 
        WHEN criteria->>'end' IS NOT NULL THEN (criteria->>'end')::DATE
        ELSE NULL
    END as date_end,
    CASE 
        WHEN status IN ('active', 'paused') THEN 'active'
        WHEN status IN ('completed', 'cancelled', 'max_reached') THEN 'stopped'
        ELSE 'expired'
    END as status,
    COALESCE(unsubscribe_token::UUID, gen_random_uuid()) as stop_token,
    created_at
FROM notifications
WHERE status NOT IN ('cancelled', 'deleted')
    AND criteria IS NOT NULL
    AND (
        (criteria->>'date' IS NOT NULL) OR 
        (criteria->>'start' IS NOT NULL AND criteria->>'end' IS NOT NULL)
    )
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- CLEANUP OLD NOTIFICATION SYSTEM (TO BE RUN AFTER VERIFICATION)
-- ============================================================================
-- WARNING: Only run these after confirming the new system is working correctly!

/*
-- Drop old columns from notifications table
ALTER TABLE notifications DROP COLUMN IF EXISTS max_notifications;
ALTER TABLE notifications DROP COLUMN IF EXISTS interval_minutes;
ALTER TABLE notifications DROP COLUMN IF EXISTS notify_on_every_new;
ALTER TABLE notifications DROP COLUMN IF EXISTS notification_phase;
ALTER TABLE notifications DROP COLUMN IF EXISTS phase_count;
ALTER TABLE notifications DROP COLUMN IF EXISTS preferred_send_time;
ALTER TABLE notifications DROP COLUMN IF EXISTS batch_notifications;
ALTER TABLE notifications DROP COLUMN IF EXISTS batch_interval_hours;
ALTER TABLE notifications DROP COLUMN IF EXISTS enable_urgent_mode;
ALTER TABLE notifications DROP COLUMN IF EXISTS send_on_weekends;
ALTER TABLE notifications DROP COLUMN IF EXISTS quiet_hours_start;
ALTER TABLE notifications DROP COLUMN IF EXISTS quiet_hours_end;
ALTER TABLE notifications DROP COLUMN IF EXISTS timezone;
ALTER TABLE notifications DROP COLUMN IF EXISTS error_count;
ALTER TABLE notifications DROP COLUMN IF EXISTS last_error;
ALTER TABLE notifications DROP COLUMN IF EXISTS phase_started_at;
ALTER TABLE notifications DROP COLUMN IF EXISTS last_batch_sent_at;

-- Drop old tables
DROP TABLE IF EXISTS notification_batch_queue;
DROP TABLE IF EXISTS email_history;

-- Optional: Rename old notifications table for backup
-- ALTER TABLE notifications RENAME TO notifications_old_backup;
*/ 
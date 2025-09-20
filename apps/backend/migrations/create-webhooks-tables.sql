-- Migration: Create webhooks and webhook_deliveries tables
-- Created: 2024-01-15
-- Description: Tables for custom webhook functionality in Enterprise plans

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    events JSON NOT NULL,
    secret VARCHAR(256) NULL,
    headers JSON NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_webhooks_user_id (user_id),
    INDEX idx_webhooks_active (active),
    INDEX idx_webhooks_user_active (user_id, active),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id VARCHAR(36) PRIMARY KEY,
    webhook_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSON NOT NULL,
    status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
    response_status INT NULL,
    response_body TEXT NULL,
    attempt_count INT NOT NULL DEFAULT 1,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_deliveries_webhook_id (webhook_id),
    INDEX idx_deliveries_status (status),
    INDEX idx_deliveries_event_type (event_type),
    INDEX idx_deliveries_created_at (created_at),
    INDEX idx_deliveries_webhook_status (webhook_id, status),
    
    FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

-- Create webhook_events table for tracking available events
CREATE TABLE IF NOT EXISTS webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    example_payload JSON NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_webhook_events_active (is_active)
);

-- Insert default webhook events
INSERT INTO webhook_events (event_name, description, example_payload) VALUES
('video.created', 'Triggered when a new video is uploaded', JSON_OBJECT(
    'event', 'video.created',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'video_id', 'uuid-here',
        'title', 'My Video',
        'duration', 120,
        'size', 1024000,
        'user_id', 'user-uuid'
    )
)),
('video.updated', 'Triggered when video metadata is updated', JSON_OBJECT(
    'event', 'video.updated',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'video_id', 'uuid-here',
        'changes', JSON_ARRAY('title', 'description'),
        'user_id', 'user-uuid'
    )
)),
('video.deleted', 'Triggered when a video is deleted', JSON_OBJECT(
    'event', 'video.deleted',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'video_id', 'uuid-here',
        'user_id', 'user-uuid'
    )
)),
('video.processed', 'Triggered when video processing is complete', JSON_OBJECT(
    'event', 'video.processed',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'video_id', 'uuid-here',
        'processing_time', 45,
        'qualities', JSON_ARRAY('720p', '1080p'),
        'user_id', 'user-uuid'
    )
)),
('video.encoding.started', 'Triggered when video encoding begins', JSON_OBJECT(
    'event', 'video.encoding.started',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'video_id', 'uuid-here',
        'encoding_profile', 'standard',
        'user_id', 'user-uuid'
    )
)),
('video.encoding.completed', 'Triggered when video encoding is completed', JSON_OBJECT(
    'event', 'video.encoding.completed',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'video_id', 'uuid-here',
        'encoding_time', 120,
        'output_qualities', JSON_ARRAY('480p', '720p', '1080p'),
        'user_id', 'user-uuid'
    )
)),
('video.encoding.failed', 'Triggered when video encoding fails', JSON_OBJECT(
    'event', 'video.encoding.failed',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'video_id', 'uuid-here',
        'error', 'Unsupported format',
        'user_id', 'user-uuid'
    )
)),
('livestream.started', 'Triggered when a livestream begins', JSON_OBJECT(
    'event', 'livestream.started',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'stream_id', 'uuid-here',
        'title', 'My Live Stream',
        'user_id', 'user-uuid'
    )
)),
('livestream.ended', 'Triggered when a livestream ends', JSON_OBJECT(
    'event', 'livestream.ended',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'stream_id', 'uuid-here',
        'duration', 3600,
        'peak_viewers', 150,
        'user_id', 'user-uuid'
    )
)),
('livestream.recorded', 'Triggered when a livestream recording is available', JSON_OBJECT(
    'event', 'livestream.recorded',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'stream_id', 'uuid-here',
        'recording_id', 'recording-uuid',
        'duration', 3600,
        'user_id', 'user-uuid'
    )
)),
('analytics.milestone', 'Triggered when analytics milestones are reached', JSON_OBJECT(
    'event', 'analytics.milestone',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'milestone_type', 'views',
        'milestone_value', 1000,
        'video_id', 'uuid-here',
        'user_id', 'user-uuid'
    )
)),
('user.plan.changed', 'Triggered when user changes subscription plan', JSON_OBJECT(
    'event', 'user.plan.changed',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'user_id', 'user-uuid',
        'old_plan', 'basic',
        'new_plan', 'professional',
        'effective_date', '2024-01-15T10:30:00Z'
    )
)),
('storage.limit.reached', 'Triggered when storage limit is reached', JSON_OBJECT(
    'event', 'storage.limit.reached',
    'timestamp', '2024-01-15T10:30:00Z',
    'data', JSON_OBJECT(
        'user_id', 'user-uuid',
        'current_usage', 10737418240,
        'limit', 10737418240,
        'percentage', 100
    )
));

-- Create indexes for better performance
CREATE INDEX idx_webhooks_events ON webhooks ((CAST(events AS CHAR(255))));
CREATE INDEX idx_deliveries_delivered_at ON webhook_deliveries (delivered_at);
CREATE INDEX idx_deliveries_attempt_count ON webhook_deliveries (attempt_count);

-- Create view for webhook statistics
CREATE VIEW webhook_stats AS
SELECT 
    w.id,
    w.name,
    w.user_id,
    w.active,
    w.last_triggered_at,
    COUNT(wd.id) as total_deliveries,
    SUM(CASE WHEN wd.status = 'success' THEN 1 ELSE 0 END) as successful_deliveries,
    SUM(CASE WHEN wd.status = 'failed' THEN 1 ELSE 0 END) as failed_deliveries,
    SUM(CASE WHEN wd.status = 'pending' THEN 1 ELSE 0 END) as pending_deliveries,
    ROUND(
        (SUM(CASE WHEN wd.status = 'success' THEN 1 ELSE 0 END) * 100.0) / 
        NULLIF(COUNT(wd.id), 0), 2
    ) as success_rate
FROM webhooks w
LEFT JOIN webhook_deliveries wd ON w.id = wd.webhook_id
GROUP BY w.id, w.name, w.user_id, w.active, w.last_triggered_at;

-- Add comments for documentation
ALTER TABLE webhooks COMMENT = 'User-defined webhooks for event notifications';
ALTER TABLE webhook_deliveries COMMENT = 'Webhook delivery attempts and results';
ALTER TABLE webhook_events COMMENT = 'Available webhook event types and examples';

-- Add column comments
ALTER TABLE webhooks 
    MODIFY COLUMN id VARCHAR(36) COMMENT 'Unique webhook identifier (UUID)',
    MODIFY COLUMN user_id VARCHAR(36) COMMENT 'Owner user ID',
    MODIFY COLUMN name VARCHAR(100) COMMENT 'User-friendly webhook name',
    MODIFY COLUMN url TEXT COMMENT 'Webhook endpoint URL',
    MODIFY COLUMN events JSON COMMENT 'Array of subscribed event types',
    MODIFY COLUMN secret VARCHAR(256) COMMENT 'Secret for HMAC signature verification',
    MODIFY COLUMN headers JSON COMMENT 'Custom headers to include in requests',
    MODIFY COLUMN active BOOLEAN COMMENT 'Whether webhook is active',
    MODIFY COLUMN last_triggered_at TIMESTAMP COMMENT 'Last successful delivery timestamp';

ALTER TABLE webhook_deliveries
    MODIFY COLUMN id VARCHAR(36) COMMENT 'Unique delivery identifier (UUID)',
    MODIFY COLUMN webhook_id VARCHAR(36) COMMENT 'Associated webhook ID',
    MODIFY COLUMN event_type VARCHAR(50) COMMENT 'Type of event that triggered delivery',
    MODIFY COLUMN payload JSON COMMENT 'Event payload sent to webhook',
    MODIFY COLUMN status ENUM('pending', 'success', 'failed') COMMENT 'Delivery status',
    MODIFY COLUMN response_status INT COMMENT 'HTTP response status code',
    MODIFY COLUMN response_body TEXT COMMENT 'HTTP response body (truncated)',
    MODIFY COLUMN attempt_count INT COMMENT 'Number of delivery attempts',
    MODIFY COLUMN delivered_at TIMESTAMP COMMENT 'Timestamp of delivery attempt';
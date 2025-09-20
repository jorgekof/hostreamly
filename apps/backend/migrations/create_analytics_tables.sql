-- Enhanced Analytics Tables for Commercial Video Hosting
-- These tables track usage, bandwidth, storage, and analytics per client

-- Video metadata table for enhanced tracking
CREATE TABLE IF NOT EXISTS video_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bunny_video_id VARCHAR(255) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    status ENUM('created', 'uploading', 'uploaded', 'processing', 'ready', 'failed') DEFAULT 'created',
    file_size BIGINT DEFAULT 0,
    duration INT DEFAULT 0, -- in seconds
    width INT DEFAULT 0,
    height INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_bunny_video_id (bunny_video_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Video views tracking for analytics
CREATE TABLE IF NOT EXISTS video_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL,
    user_id INT NULL, -- Can be null for anonymous views
    duration_watched INT DEFAULT 0, -- in seconds
    quality VARCHAR(50) DEFAULT 'auto', -- 240p, 360p, 480p, 720p, 1080p, etc.
    user_agent TEXT,
    ip_address VARCHAR(45),
    country VARCHAR(2),
    bandwidth_used BIGINT DEFAULT 0, -- estimated bytes transferred
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_video_id (video_id),
    INDEX idx_user_id (user_id),
    INDEX idx_viewed_at (viewed_at),
    INDEX idx_country (country)
);

-- User storage usage tracking
CREATE TABLE IF NOT EXISTS user_storage_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bytes BIGINT NOT NULL,
    operation ENUM('add', 'remove') NOT NULL,
    video_id VARCHAR(255) NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User bandwidth usage tracking
CREATE TABLE IF NOT EXISTS user_bandwidth_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bytes_transferred BIGINT NOT NULL,
    video_id VARCHAR(255) NULL,
    request_type ENUM('video_stream', 'thumbnail', 'preview', 'api') DEFAULT 'video_stream',
    quality VARCHAR(50) NULL,
    country VARCHAR(2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_request_type (request_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Upload events tracking
CREATE TABLE IF NOT EXISTS upload_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id VARCHAR(255) NOT NULL,
    event_type ENUM('upload_initiated', 'upload_progress', 'upload_completed', 'upload_failed', 'processing_started', 'processing_completed') NOT NULL,
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_video_id (video_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscription plans table (if not exists)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    storage_limit_gb INT NOT NULL, -- Storage limit in GB
    bandwidth_limit_gb INT NOT NULL, -- Monthly bandwidth limit in GB
    video_limit INT NOT NULL, -- Maximum number of videos
    max_video_size_gb DECIMAL(5,2) NOT NULL, -- Maximum video file size in GB
    features JSON, -- Additional features as JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active)
);

-- User plan assignments (if not exists in users table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP NULL;
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_plan_id (plan_id);

-- Add foreign key constraint for plan_id if it doesn't exist
-- ALTER TABLE users ADD CONSTRAINT fk_users_plan_id FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);

-- Analytics summary table for faster queries
CREATE TABLE IF NOT EXISTS user_analytics_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_videos INT DEFAULT 0,
    total_storage_bytes BIGINT DEFAULT 0,
    total_bandwidth_bytes BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_watch_time_seconds BIGINT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Video analytics summary for faster queries
CREATE TABLE IF NOT EXISTS video_analytics_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL UNIQUE,
    total_views BIGINT DEFAULT 0,
    total_watch_time_seconds BIGINT DEFAULT 0,
    total_bandwidth_bytes BIGINT DEFAULT 0,
    avg_watch_time_seconds DECIMAL(10,2) DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0, -- 0-100 score
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_video_id (video_id)
);

-- Insert default subscription plans
INSERT IGNORE INTO subscription_plans (id, name, description, price_monthly, price_yearly, storage_limit_gb, bandwidth_limit_gb, video_limit, max_video_size_gb, features) VALUES
(1, 'Free', 'Basic plan for testing', 0.00, 0.00, 1, 10, 5, 0.5, '{"drm": false, "analytics": "basic", "support": "community"}'),
(2, 'Starter', 'Perfect for small creators', 25.00, 250.00, 100, 1000, 100, 5.0, '{"drm": true, "analytics": "basic", "support": "email", "custom_player": true, "max_viewers": 10, "videos": 50}'),
(3, 'Professional', 'For growing businesses', 219.00, 2190.00, 500, 5000, 200, 10.0, '{"drm": true, "analytics": "advanced", "support": "priority", "custom_player": true, "api_access": true, "max_viewers": 50, "videos": 500}'),
(4, 'Enterprise', 'For large organizations with 4K streaming needs', 999.00, 9990.00, 3500, 35000, 500, 15.0, '{"drm": true, "analytics": "enterprise", "support": "dedicated", "custom_player": true, "api_access": true, "white_label": true, "live_quality": "4K", "max_viewers": 60, "users": 15}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_views_composite ON video_views(video_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_storage_usage_composite ON user_storage_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bandwidth_usage_composite ON user_bandwidth_usage(user_id, created_at);

-- Create views for common analytics queries
CREATE OR REPLACE VIEW user_current_usage AS
SELECT 
    u.id as user_id,
    u.email,
    sp.name as plan_name,
    COALESCE(SUM(CASE WHEN sus.operation = 'add' THEN sus.bytes ELSE -sus.bytes END), 0) as current_storage_bytes,
    COALESCE(monthly_bandwidth.total_bandwidth, 0) as monthly_bandwidth_bytes,
    COALESCE(video_count.total_videos, 0) as total_videos,
    sp.storage_limit_gb * 1024 * 1024 * 1024 as storage_limit_bytes,
    sp.bandwidth_limit_gb * 1024 * 1024 * 1024 as bandwidth_limit_bytes,
    sp.video_limit
FROM users u
LEFT JOIN subscription_plans sp ON u.plan_id = sp.id
LEFT JOIN user_storage_usage sus ON u.id = sus.user_id
LEFT JOIN (
    SELECT 
        user_id, 
        SUM(bytes_transferred) as total_bandwidth
    FROM user_bandwidth_usage 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    GROUP BY user_id
) monthly_bandwidth ON u.id = monthly_bandwidth.user_id
LEFT JOIN (
    SELECT 
        user_id, 
        COUNT(*) as total_videos
    FROM video_metadata 
    WHERE status IN ('uploaded', 'ready')
    GROUP BY user_id
) video_count ON u.id = video_count.user_id
GROUP BY u.id, u.email, sp.name, sp.storage_limit_gb, sp.bandwidth_limit_gb, sp.video_limit, monthly_bandwidth.total_bandwidth, video_count.total_videos;

-- Trigger to update analytics summary when views are added
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_video_analytics_on_view
AFTER INSERT ON video_views
FOR EACH ROW
BEGIN
    INSERT INTO video_analytics_summary (video_id, total_views, total_watch_time_seconds, total_bandwidth_bytes)
    VALUES (NEW.video_id, 1, NEW.duration_watched, NEW.bandwidth_used)
    ON DUPLICATE KEY UPDATE
        total_views = total_views + 1,
        total_watch_time_seconds = total_watch_time_seconds + NEW.duration_watched,
        total_bandwidth_bytes = total_bandwidth_bytes + NEW.bandwidth_used,
        avg_watch_time_seconds = total_watch_time_seconds / total_views,
        last_updated = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Trigger to update user analytics summary
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_user_analytics_on_view
AFTER INSERT ON video_views
FOR EACH ROW
BEGIN
    DECLARE video_owner_id INT;
    
    -- Get the video owner
    SELECT user_id INTO video_owner_id 
    FROM video_metadata 
    WHERE bunny_video_id = NEW.video_id 
    LIMIT 1;
    
    IF video_owner_id IS NOT NULL THEN
        INSERT INTO user_analytics_summary (user_id, total_views, total_watch_time_seconds)
        VALUES (video_owner_id, 1, NEW.duration_watched)
        ON DUPLICATE KEY UPDATE
            total_views = total_views + 1,
            total_watch_time_seconds = total_watch_time_seconds + NEW.duration_watched,
            last_updated = CURRENT_TIMESTAMP;
    END IF;
END//
DELIMITER ;

COMMIT;
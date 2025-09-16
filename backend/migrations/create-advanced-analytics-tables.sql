-- Migration: Create advanced analytics tables
-- Created: 2024-01-15
-- Description: Tables for advanced analytics functionality in Professional/Enterprise plans

-- Create video_analytics table for detailed video metrics
CREATE TABLE IF NOT EXISTS video_analytics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    video_id VARCHAR(36) NOT NULL,
    views INT NOT NULL DEFAULT 0,
    unique_views INT NOT NULL DEFAULT 0,
    watch_time BIGINT NOT NULL DEFAULT 0, -- in seconds
    total_duration INT NOT NULL DEFAULT 0, -- in seconds
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- percentage
    engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100 scale
    bounce_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- percentage
    peak_concurrent_viewers INT NOT NULL DEFAULT 0,
    average_view_duration INT NOT NULL DEFAULT 0, -- in seconds
    retention_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- percentage
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_video_analytics_user_id (user_id),
    INDEX idx_video_analytics_video_id (video_id),
    INDEX idx_video_analytics_created_at (created_at),
    INDEX idx_video_analytics_user_video (user_id, video_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Create video_views table for individual view tracking
CREATE TABLE IF NOT EXISTS video_views (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    video_id VARCHAR(36) NOT NULL,
    viewer_id VARCHAR(36) NULL, -- anonymous or registered viewer
    session_id VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    country VARCHAR(2) NULL, -- ISO country code
    region VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    device_type ENUM('desktop', 'mobile', 'tablet', 'tv', 'unknown') NOT NULL DEFAULT 'unknown',
    browser VARCHAR(50) NULL,
    os VARCHAR(50) NULL,
    quality VARCHAR(10) NULL, -- 480p, 720p, 1080p, etc.
    watch_time INT NOT NULL DEFAULT 0, -- seconds watched
    bandwidth BIGINT NULL, -- bytes per second
    buffer_events INT NOT NULL DEFAULT 0,
    seek_events INT NOT NULL DEFAULT 0,
    pause_events INT NOT NULL DEFAULT 0,
    fullscreen_events INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_video_views_user_id (user_id),
    INDEX idx_video_views_video_id (video_id),
    INDEX idx_video_views_session_id (session_id),
    INDEX idx_video_views_country (country),
    INDEX idx_video_views_device_type (device_type),
    INDEX idx_video_views_created_at (created_at),
    INDEX idx_video_views_started_at (started_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Create bandwidth_usage table for detailed bandwidth tracking
CREATE TABLE IF NOT EXISTS bandwidth_usage (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    video_id VARCHAR(36) NULL,
    livestream_id VARCHAR(36) NULL,
    bytes_transferred BIGINT NOT NULL,
    request_type ENUM('video_stream', 'thumbnail', 'upload', 'download', 'api') NOT NULL,
    quality VARCHAR(10) NULL,
    cdn_region VARCHAR(50) NULL,
    client_ip VARCHAR(45) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_bandwidth_usage_user_id (user_id),
    INDEX idx_bandwidth_usage_video_id (video_id),
    INDEX idx_bandwidth_usage_livestream_id (livestream_id),
    INDEX idx_bandwidth_usage_request_type (request_type),
    INDEX idx_bandwidth_usage_created_at (created_at),
    INDEX idx_bandwidth_usage_user_date (user_id, DATE(created_at)),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL,
    FOREIGN KEY (livestream_id) REFERENCES livestreams(id) ON DELETE SET NULL
);

-- Create storage_usage table for storage analytics
CREATE TABLE IF NOT EXISTS storage_usage (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    storage_type ENUM('video', 'thumbnail', 'livestream_recording', 'other') NOT NULL,
    file_size BIGINT NOT NULL, -- in bytes
    file_path TEXT NOT NULL,
    file_format VARCHAR(20) NULL,
    compression_ratio DECIMAL(5,2) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_storage_usage_user_id (user_id),
    INDEX idx_storage_usage_storage_type (storage_type),
    INDEX idx_storage_usage_created_at (created_at),
    INDEX idx_storage_usage_user_type (user_id, storage_type),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create livestream_analytics table for livestream metrics
CREATE TABLE IF NOT EXISTS livestream_analytics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    livestream_id VARCHAR(36) NOT NULL,
    peak_viewers INT NOT NULL DEFAULT 0,
    average_viewers DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_view_time BIGINT NOT NULL DEFAULT 0, -- in seconds
    unique_viewers INT NOT NULL DEFAULT 0,
    chat_messages INT NOT NULL DEFAULT 0,
    stream_duration INT NOT NULL DEFAULT 0, -- in seconds
    stream_quality VARCHAR(10) NULL,
    bitrate_avg INT NULL, -- kbps
    bitrate_peak INT NULL, -- kbps
    frame_drops INT NOT NULL DEFAULT 0,
    connection_issues INT NOT NULL DEFAULT 0,
    geographic_distribution JSON NULL, -- country -> viewer count
    device_distribution JSON NULL, -- device type -> viewer count
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_livestream_analytics_user_id (user_id),
    INDEX idx_livestream_analytics_livestream_id (livestream_id),
    INDEX idx_livestream_analytics_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (livestream_id) REFERENCES livestreams(id) ON DELETE CASCADE
);

-- Create analytics_reports table for saved custom reports
CREATE TABLE IF NOT EXISTS analytics_reports (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    report_type ENUM('dashboard', 'videos', 'livestreams', 'engagement', 'custom') NOT NULL,
    configuration JSON NOT NULL, -- metrics, filters, groupBy, etc.
    schedule_frequency ENUM('none', 'daily', 'weekly', 'monthly') NOT NULL DEFAULT 'none',
    last_generated_at TIMESTAMP NULL,
    next_generation_at TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_analytics_reports_user_id (user_id),
    INDEX idx_analytics_reports_schedule (schedule_frequency, next_generation_at),
    INDEX idx_analytics_reports_active (is_active),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create analytics_exports table for tracking export history
CREATE TABLE IF NOT EXISTS analytics_exports (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    report_id VARCHAR(36) NULL,
    export_type ENUM('manual', 'scheduled') NOT NULL DEFAULT 'manual',
    format ENUM('excel', 'csv', 'pdf', 'json') NOT NULL,
    file_size BIGINT NULL, -- in bytes
    file_path TEXT NULL,
    download_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NULL,
    status ENUM('pending', 'completed', 'failed', 'expired') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_analytics_exports_user_id (user_id),
    INDEX idx_analytics_exports_report_id (report_id),
    INDEX idx_analytics_exports_status (status),
    INDEX idx_analytics_exports_expires_at (expires_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES analytics_reports(id) ON DELETE SET NULL
);

-- Create analytics_alerts table for threshold-based alerts
CREATE TABLE IF NOT EXISTS analytics_alerts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    metric VARCHAR(50) NOT NULL,
    condition_type ENUM('greater_than', 'less_than', 'equals', 'percentage_change') NOT NULL,
    threshold_value DECIMAL(15,2) NOT NULL,
    comparison_period INT NULL, -- days for percentage_change
    notification_channels JSON NOT NULL, -- email, webhook, etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMP NULL,
    trigger_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_analytics_alerts_user_id (user_id),
    INDEX idx_analytics_alerts_metric (metric),
    INDEX idx_analytics_alerts_active (is_active),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create views for common analytics queries

-- View: Daily analytics summary
CREATE VIEW daily_analytics_summary AS
SELECT 
    user_id,
    DATE(created_at) as date,
    COUNT(DISTINCT video_id) as videos_viewed,
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_sessions,
    SUM(watch_time) as total_watch_time,
    AVG(watch_time) as avg_watch_time,
    COUNT(DISTINCT country) as countries_reached,
    COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_views,
    COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_views
FROM video_views
GROUP BY user_id, DATE(created_at);

-- View: Video performance summary
CREATE VIEW video_performance_summary AS
SELECT 
    v.id as video_id,
    v.user_id,
    v.title,
    v.duration,
    v.size,
    v.created_at as upload_date,
    COALESCE(va.views, 0) as total_views,
    COALESCE(va.unique_views, 0) as unique_views,
    COALESCE(va.watch_time, 0) as total_watch_time,
    COALESCE(va.completion_rate, 0) as completion_rate,
    COALESCE(va.engagement_score, 0) as engagement_score,
    COALESCE(va.retention_rate, 0) as retention_rate,
    CASE 
        WHEN v.duration > 0 THEN COALESCE(va.watch_time, 0) / v.duration 
        ELSE 0 
    END as view_through_rate
FROM videos v
LEFT JOIN video_analytics va ON v.id = va.video_id;

-- View: User analytics dashboard
CREATE VIEW user_analytics_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    u.plan,
    COUNT(DISTINCT v.id) as total_videos,
    COALESCE(SUM(v.size), 0) as total_storage_used,
    COALESCE(SUM(va.views), 0) as total_views,
    COALESCE(SUM(va.watch_time), 0) as total_watch_time,
    COALESCE(AVG(va.engagement_score), 0) as avg_engagement_score,
    COUNT(DISTINCT ls.id) as total_livestreams,
    COALESCE(SUM(bu.bytes_transferred), 0) as total_bandwidth_used
FROM users u
LEFT JOIN videos v ON u.id = v.user_id
LEFT JOIN video_analytics va ON v.id = va.video_id
LEFT JOIN livestreams ls ON u.id = ls.user_id
LEFT JOIN bandwidth_usage bu ON u.id = bu.user_id
GROUP BY u.id, u.email, u.plan;

-- Create indexes for better performance on analytics queries
CREATE INDEX idx_video_views_user_date ON video_views (user_id, DATE(created_at));
CREATE INDEX idx_video_views_video_date ON video_views (video_id, DATE(created_at));
CREATE INDEX idx_bandwidth_usage_user_month ON bandwidth_usage (user_id, YEAR(created_at), MONTH(created_at));
CREATE INDEX idx_video_analytics_engagement ON video_analytics (engagement_score DESC);
CREATE INDEX idx_video_analytics_completion ON video_analytics (completion_rate DESC);

-- Add triggers for automatic analytics updates

DELIMITER //

-- Trigger to update video analytics when a view is recorded
CREATE TRIGGER update_video_analytics_on_view
AFTER INSERT ON video_views
FOR EACH ROW
BEGIN
    INSERT INTO video_analytics (
        id, user_id, video_id, views, unique_views, watch_time, 
        total_duration, created_at, updated_at
    )
    VALUES (
        UUID(), NEW.user_id, NEW.video_id, 1, 1, NEW.watch_time,
        (SELECT duration FROM videos WHERE id = NEW.video_id),
        NOW(), NOW()
    )
    ON DUPLICATE KEY UPDATE
        views = views + 1,
        watch_time = watch_time + NEW.watch_time,
        updated_at = NOW();
END//

-- Trigger to update bandwidth usage on video views
CREATE TRIGGER track_bandwidth_on_view
AFTER INSERT ON video_views
FOR EACH ROW
BEGIN
    IF NEW.bandwidth IS NOT NULL THEN
        INSERT INTO bandwidth_usage (
            id, user_id, video_id, bytes_transferred, request_type,
            quality, client_ip, created_at
        )
        VALUES (
            UUID(), NEW.user_id, NEW.video_id, 
            NEW.bandwidth * NEW.watch_time, 'video_stream',
            NEW.quality, NEW.ip_address, NEW.created_at
        );
    END IF;
END//

DELIMITER ;

-- Add comments for documentation
ALTER TABLE video_analytics COMMENT = 'Aggregated analytics data for videos';
ALTER TABLE video_views COMMENT = 'Individual video view tracking with detailed metrics';
ALTER TABLE bandwidth_usage COMMENT = 'Detailed bandwidth usage tracking';
ALTER TABLE storage_usage COMMENT = 'Storage usage analytics and file tracking';
ALTER TABLE livestream_analytics COMMENT = 'Livestream performance metrics';
ALTER TABLE analytics_reports COMMENT = 'Saved custom analytics reports';
ALTER TABLE analytics_exports COMMENT = 'Analytics export history and file management';
ALTER TABLE analytics_alerts COMMENT = 'Threshold-based analytics alerts';
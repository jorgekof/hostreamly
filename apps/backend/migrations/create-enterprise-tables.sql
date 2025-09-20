-- Migration: Create Enterprise tables
-- Created: 2024-01-15
-- Description: Tables for Enterprise-specific functionality including SLA monitoring, team management, and advanced reporting

-- Create SLA alert metrics table for defining alertable metrics
CREATE TABLE IF NOT EXISTS sla_alert_metrics (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    metric_type ENUM('uptime', 'performance', 'availability', 'response_time', 'error_rate', 'custom') NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'percentage',
    category ENUM('availability', 'performance', 'reliability', 'compliance', 'security') NOT NULL,
    threshold_value DECIMAL(10,4) NOT NULL,
    threshold_operator ENUM('>', '<', '>=', '<=', '==', '!=') NOT NULL DEFAULT '>=',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sla_alert_metrics_type (metric_type),
    INDEX idx_sla_alert_metrics_category (category),
    INDEX idx_sla_alert_metrics_active (is_active),
    
    UNIQUE KEY unique_metric_name (name)
);

-- Create SLA alerts table for user-defined alerts
CREATE TABLE IF NOT EXISTS sla_alerts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    metric_id VARCHAR(36) NOT NULL,
    threshold_value DECIMAL(10,4) NOT NULL,
    threshold_operator ENUM('>', '<', '>=', '<=', '==', '!=') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    notification_channels JSON NOT NULL COMMENT 'Array of notification channels: email, sms, webhook, slack',
    status ENUM('active', 'paused', 'resolved') NOT NULL DEFAULT 'active',
    last_triggered TIMESTAMP NULL,
    trigger_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sla_alerts_user_id (user_id),
    INDEX idx_sla_alerts_metric_id (metric_id),
    INDEX idx_sla_alerts_status (status),
    INDEX idx_sla_alerts_severity (severity),
    INDEX idx_sla_alerts_last_triggered (last_triggered),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (metric_id) REFERENCES sla_alert_metrics(id) ON DELETE CASCADE
);

-- Create uptime checks table for monitoring system uptime
CREATE TABLE IF NOT EXISTS uptime_checks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    endpoint_url TEXT NOT NULL,
    check_type ENUM('http', 'https', 'tcp', 'ping') NOT NULL DEFAULT 'https',
    status ENUM('up', 'down', 'degraded') NOT NULL,
    response_time_ms INT NULL,
    status_code INT NULL,
    error_message TEXT NULL,
    check_interval_minutes INT NOT NULL DEFAULT 5,
    timeout_seconds INT NOT NULL DEFAULT 30,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_uptime_checks_user_id (user_id),
    INDEX idx_uptime_checks_status (status),
    INDEX idx_uptime_checks_created_at (created_at),
    INDEX idx_uptime_checks_user_status (user_id, status),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create performance metrics table for tracking API performance
CREATE TABLE IF NOT EXISTS performance_metrics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL,
    response_time INT NOT NULL COMMENT 'Response time in milliseconds',
    status_code INT NOT NULL,
    request_size BIGINT NULL COMMENT 'Request size in bytes',
    response_size BIGINT NULL COMMENT 'Response size in bytes',
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_performance_metrics_user_id (user_id),
    INDEX idx_performance_metrics_endpoint (endpoint),
    INDEX idx_performance_metrics_status_code (status_code),
    INDEX idx_performance_metrics_response_time (response_time),
    INDEX idx_performance_metrics_created_at (created_at),
    INDEX idx_performance_metrics_user_endpoint (user_id, endpoint),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create availability logs table for tracking service availability
CREATE TABLE IF NOT EXISTS availability_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    available BOOLEAN NOT NULL,
    duration_minutes INT NOT NULL,
    downtime_reason TEXT NULL,
    impact_level ENUM('none', 'low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'none',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_availability_logs_user_id (user_id),
    INDEX idx_availability_logs_service (service_name),
    INDEX idx_availability_logs_available (available),
    INDEX idx_availability_logs_impact (impact_level),
    INDEX idx_availability_logs_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create API response times table for detailed response time tracking
CREATE TABLE IF NOT EXISTS api_response_times (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time_ms INT NOT NULL,
    status_code INT NOT NULL,
    region VARCHAR(50) NULL,
    cdn_cache_status ENUM('hit', 'miss', 'bypass', 'expired') NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_api_response_times_user_id (user_id),
    INDEX idx_api_response_times_endpoint (endpoint),
    INDEX idx_api_response_times_response_time (response_time_ms),
    INDEX idx_api_response_times_created_at (created_at),
    INDEX idx_api_response_times_region (region),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create API logs table for comprehensive API logging
CREATE TABLE IF NOT EXISTS api_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    response_time_ms INT NOT NULL,
    request_size BIGINT NULL,
    response_size BIGINT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    referer TEXT NULL,
    request_id VARCHAR(36) NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_api_logs_user_id (user_id),
    INDEX idx_api_logs_endpoint (endpoint),
    INDEX idx_api_logs_status_code (status_code),
    INDEX idx_api_logs_created_at (created_at),
    INDEX idx_api_logs_request_id (request_id),
    INDEX idx_api_logs_user_status (user_id, status_code),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create team members table for team management
CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(36) PRIMARY KEY,
    owner_user_id VARCHAR(36) NOT NULL,
    member_user_id VARCHAR(36) NOT NULL,
    role ENUM('admin', 'editor', 'viewer', 'analyst') NOT NULL DEFAULT 'viewer',
    permissions JSON NULL COMMENT 'Specific permissions for the team member',
    status ENUM('invited', 'active', 'suspended', 'removed') NOT NULL DEFAULT 'invited',
    invite_token VARCHAR(64) NULL,
    invited_at TIMESTAMP NULL,
    joined_at TIMESTAMP NULL,
    last_activity TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_team_members_owner (owner_user_id),
    INDEX idx_team_members_member (member_user_id),
    INDEX idx_team_members_role (role),
    INDEX idx_team_members_status (status),
    INDEX idx_team_members_invite_token (invite_token),
    INDEX idx_team_members_owner_status (owner_user_id, status),
    
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (member_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_member (owner_user_id, member_user_id)
);

-- Create user activity logs table for tracking user activities
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id VARCHAR(36) NULL,
    details JSON NULL COMMENT 'Additional details about the activity',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    session_id VARCHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_activity_logs_user_id (user_id),
    INDEX idx_user_activity_logs_action (action),
    INDEX idx_user_activity_logs_resource (resource_type, resource_id),
    INDEX idx_user_activity_logs_created_at (created_at),
    INDEX idx_user_activity_logs_session (session_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create security logs table for security event tracking
CREATE TABLE IF NOT EXISTS security_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    details JSON NULL COMMENT 'Security event details',
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_security_logs_user_id (user_id),
    INDEX idx_security_logs_action (action),
    INDEX idx_security_logs_severity (severity),
    INDEX idx_security_logs_ip_address (ip_address),
    INDEX idx_security_logs_created_at (created_at),
    INDEX idx_security_logs_blocked (blocked),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create enterprise reports table for storing generated reports
CREATE TABLE IF NOT EXISTS enterprise_reports (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    report_type ENUM('sla_compliance', 'account_usage', 'team_activity', 'security_audit', 'performance_analysis') NOT NULL,
    period VARCHAR(20) NOT NULL COMMENT 'Report period (e.g., 30d, 6m, 1y)',
    format ENUM('json', 'excel', 'pdf', 'csv') NOT NULL DEFAULT 'json',
    data LONGTEXT NULL COMMENT 'Report data in JSON format',
    file_url TEXT NULL COMMENT 'URL to generated report file',
    include_charts BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    file_size BIGINT NULL,
    generated_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_enterprise_reports_user_id (user_id),
    INDEX idx_enterprise_reports_type (report_type),
    INDEX idx_enterprise_reports_status (status),
    INDEX idx_enterprise_reports_created_at (created_at),
    INDEX idx_enterprise_reports_expires_at (expires_at),
    INDEX idx_enterprise_reports_user_type (user_id, report_type),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create billing info table for enterprise billing management
CREATE TABLE IF NOT EXISTS billing_info (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    billing_email VARCHAR(255) NULL,
    company_name VARCHAR(255) NULL,
    tax_id VARCHAR(100) NULL,
    billing_address JSON NULL COMMENT 'Billing address information',
    payment_method JSON NULL COMMENT 'Payment method details (encrypted)',
    billing_cycle ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    next_billing_date DATE NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    invoice_settings JSON NULL COMMENT 'Invoice preferences and settings',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_billing_info_user_id (user_id),
    INDEX idx_billing_info_billing_email (billing_email),
    INDEX idx_billing_info_next_billing_date (next_billing_date),
    INDEX idx_billing_info_auto_renew (auto_renew),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_billing (user_id)
);

-- Create user profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    avatar_url TEXT NULL,
    phone VARCHAR(20) NULL,
    company_name VARCHAR(255) NULL,
    job_title VARCHAR(100) NULL,
    department VARCHAR(100) NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    notification_preferences JSON NULL COMMENT 'User notification preferences',
    security_settings JSON NULL COMMENT 'User security settings',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_profiles_user_id (user_id),
    INDEX idx_user_profiles_company (company_name),
    INDEX idx_user_profiles_timezone (timezone),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_profile (user_id)
);

-- Insert default SLA alert metrics
INSERT INTO sla_alert_metrics (id, name, description, metric_type, unit, category, threshold_value, threshold_operator) VALUES
('uptime-metric', 'System Uptime', 'Overall system uptime percentage', 'uptime', 'percentage', 'availability', 99.9, '>='),
('response-time-metric', 'Average Response Time', 'Average API response time', 'response_time', 'milliseconds', 'performance', 200, '<='),
('error-rate-metric', 'Error Rate', 'Percentage of failed requests', 'error_rate', 'percentage', 'reliability', 1.0, '<='),
('availability-metric', 'Service Availability', 'Service availability percentage', 'availability', 'percentage', 'availability', 99.5, '>='),
('performance-metric', 'Performance Score', 'Overall performance score', 'performance', 'score', 'performance', 85.0, '>=');

-- Create views for easier querying

-- View: SLA compliance summary
CREATE VIEW sla_compliance_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.plan,
    COUNT(DISTINCT sa.id) as total_alerts,
    COUNT(CASE WHEN sa.status = 'active' THEN 1 END) as active_alerts,
    COUNT(CASE WHEN sa.severity = 'critical' THEN 1 END) as critical_alerts,
    AVG(CASE WHEN uc.status = 'up' THEN 100 ELSE 0 END) as uptime_percentage,
    AVG(pm.response_time) as avg_response_time
FROM users u
LEFT JOIN sla_alerts sa ON u.id = sa.user_id
LEFT JOIN uptime_checks uc ON u.id = uc.user_id AND uc.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
LEFT JOIN performance_metrics pm ON u.id = pm.user_id AND pm.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
WHERE u.plan = 'Enterprise'
GROUP BY u.id, u.email, u.plan;

-- View: Team activity summary
CREATE VIEW team_activity_summary AS
SELECT 
    tm.owner_user_id,
    u_owner.email as owner_email,
    COUNT(DISTINCT tm.id) as total_members,
    COUNT(CASE WHEN tm.status = 'active' THEN 1 END) as active_members,
    COUNT(CASE WHEN tm.role = 'admin' THEN 1 END) as admin_members,
    COUNT(CASE WHEN tm.role = 'editor' THEN 1 END) as editor_members,
    COUNT(CASE WHEN tm.role = 'viewer' THEN 1 END) as viewer_members,
    COUNT(CASE WHEN tm.role = 'analyst' THEN 1 END) as analyst_members,
    MAX(tm.last_activity) as last_team_activity
FROM team_members tm
JOIN users u_owner ON tm.owner_user_id = u_owner.id
GROUP BY tm.owner_user_id, u_owner.email;

-- View: Enterprise account overview
CREATE VIEW enterprise_account_overview AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.plan,
    u.status,
    u.created_at,
    up.company_name,
    up.phone,
    up.timezone,
    bi.billing_email,
    bi.next_billing_date,
    COUNT(DISTINCT v.id) as total_videos,
    COUNT(DISTINCT ls.id) as total_livestreams,
    COUNT(DISTINCT tm.id) as team_size,
    COUNT(DISTINCT sa.id) as total_alerts,
    SUM(v.file_size) as total_storage_used,
    SUM(v.bandwidth_used) as total_bandwidth_used
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN billing_info bi ON u.id = bi.user_id
LEFT JOIN videos v ON u.id = v.user_id
LEFT JOIN livestreams ls ON u.id = ls.user_id
LEFT JOIN team_members tm ON u.id = tm.owner_user_id AND tm.status = 'active'
LEFT JOIN sla_alerts sa ON u.id = sa.user_id
WHERE u.plan = 'Enterprise'
GROUP BY u.id, u.email, u.first_name, u.last_name, u.plan, u.status, u.created_at, 
         up.company_name, up.phone, up.timezone, bi.billing_email, bi.next_billing_date;

-- Create indexes for better performance
CREATE INDEX idx_uptime_checks_user_created ON uptime_checks (user_id, created_at);
CREATE INDEX idx_performance_metrics_user_created ON performance_metrics (user_id, created_at);
CREATE INDEX idx_api_logs_user_created ON api_logs (user_id, created_at);
CREATE INDEX idx_user_activity_logs_user_created ON user_activity_logs (user_id, created_at);
CREATE INDEX idx_security_logs_user_created ON security_logs (user_id, created_at);

-- Add triggers for automatic updates

DELIMITER //

-- Trigger to update team member last activity
CREATE TRIGGER update_team_member_activity
AFTER INSERT ON user_activity_logs
FOR EACH ROW
BEGIN
    UPDATE team_members 
    SET last_activity = NOW()
    WHERE member_user_id = NEW.user_id;
END//

-- Trigger to increment SLA alert trigger count
CREATE TRIGGER increment_sla_alert_triggers
AFTER UPDATE ON sla_alerts
FOR EACH ROW
BEGIN
    IF NEW.last_triggered != OLD.last_triggered THEN
        UPDATE sla_alerts 
        SET trigger_count = trigger_count + 1
        WHERE id = NEW.id;
    END IF;
END//

-- Trigger to log security events for failed logins
CREATE TRIGGER log_failed_login_security_event
AFTER INSERT ON user_activity_logs
FOR EACH ROW
BEGIN
    IF NEW.action = 'login_failed' THEN
        INSERT INTO security_logs (
            id, user_id, action, severity, ip_address, user_agent, details, created_at
        )
        VALUES (
            UUID(), NEW.user_id, 'failed_login', 'medium', 
            JSON_UNQUOTE(JSON_EXTRACT(NEW.details, '$.ip_address')),
            JSON_UNQUOTE(JSON_EXTRACT(NEW.details, '$.user_agent')),
            NEW.details, NOW()
        );
    END IF;
END//

-- Trigger to auto-expire old reports
CREATE TRIGGER set_report_expiry
BEFORE INSERT ON enterprise_reports
FOR EACH ROW
BEGIN
    IF NEW.expires_at IS NULL THEN
        SET NEW.expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY);
    END IF;
END//

DELIMITER ;

-- Add comments for documentation
ALTER TABLE sla_alert_metrics COMMENT = 'Defines available SLA metrics that can be monitored';
ALTER TABLE sla_alerts COMMENT = 'User-configured SLA alerts and thresholds';
ALTER TABLE uptime_checks COMMENT = 'System uptime monitoring checks and results';
ALTER TABLE performance_metrics COMMENT = 'API performance metrics and response times';
ALTER TABLE availability_logs COMMENT = 'Service availability tracking and downtime logs';
ALTER TABLE api_response_times COMMENT = 'Detailed API response time measurements';
ALTER TABLE api_logs COMMENT = 'Comprehensive API request and response logging';
ALTER TABLE team_members COMMENT = 'Enterprise team member management';
ALTER TABLE user_activity_logs COMMENT = 'User activity tracking and audit logs';
ALTER TABLE security_logs COMMENT = 'Security event logging and monitoring';
ALTER TABLE enterprise_reports COMMENT = 'Generated enterprise reports and analytics';
ALTER TABLE billing_info COMMENT = 'Enterprise billing and payment information';
ALTER TABLE user_profiles COMMENT = 'Extended user profile information';
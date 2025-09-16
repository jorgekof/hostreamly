-- Migration: Create white label tables
-- Created: 2024-01-15
-- Description: Tables for white label functionality in Professional/Enterprise plans

-- Create white_label_configs table for brand configuration
CREATE TABLE IF NOT EXISTS white_label_configs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    company_name VARCHAR(100) NOT NULL DEFAULT 'My Company',
    company_logo_url TEXT NULL,
    company_favicon_url TEXT NULL,
    primary_color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    secondary_color VARCHAR(7) NOT NULL DEFAULT '#1e40af',
    accent_color VARCHAR(7) NOT NULL DEFAULT '#f59e0b',
    background_color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
    text_color VARCHAR(7) NOT NULL DEFAULT '#1f2937',
    custom_domain VARCHAR(255) NULL,
    domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
    custom_css TEXT NULL,
    theme_id VARCHAR(50) NULL,
    branding_settings JSON NULL COMMENT 'Settings for hiding branding, custom footer, etc.',
    player_settings JSON NULL COMMENT 'Video player customization settings',
    email_templates JSON NULL COMMENT 'Custom email template configurations',
    social_links JSON NULL COMMENT 'Social media links configuration',
    seo_settings JSON NULL COMMENT 'SEO meta tags and settings',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_white_label_configs_user_id (user_id),
    INDEX idx_white_label_configs_custom_domain (custom_domain),
    INDEX idx_white_label_configs_enabled (enabled),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_config (user_id)
);

-- Create white_label_assets table for uploaded assets
CREATE TABLE IF NOT EXISTS white_label_assets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    asset_type ENUM('logo', 'favicon', 'watermark', 'background', 'banner') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INT NULL,
    height INT NULL,
    alt_text VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_white_label_assets_user_id (user_id),
    INDEX idx_white_label_assets_type (asset_type),
    INDEX idx_white_label_assets_active (is_active),
    INDEX idx_white_label_assets_user_type (user_id, asset_type),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_asset_type (user_id, asset_type)
);

-- Create custom_domains table for domain management
CREATE TABLE IF NOT EXISTS custom_domains (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NULL,
    status ENUM('pending', 'verified', 'failed', 'suspended') NOT NULL DEFAULT 'pending',
    verification_token VARCHAR(64) NOT NULL,
    dns_records JSON NOT NULL COMMENT 'Required DNS records for domain setup',
    ssl_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ssl_status ENUM('pending', 'active', 'failed', 'expired') NOT NULL DEFAULT 'pending',
    ssl_certificate_id VARCHAR(100) NULL,
    cdn_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    cdn_status ENUM('pending', 'active', 'failed') NOT NULL DEFAULT 'pending',
    last_verification_attempt TIMESTAMP NULL,
    verification_attempts INT NOT NULL DEFAULT 0,
    verified_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_custom_domains_user_id (user_id),
    INDEX idx_custom_domains_domain (domain),
    INDEX idx_custom_domains_status (status),
    INDEX idx_custom_domains_verification_token (verification_token),
    INDEX idx_custom_domains_ssl_status (ssl_status),
    INDEX idx_custom_domains_expires_at (expires_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_domain (domain)
);

-- Create white_label_themes table for predefined themes
CREATE TABLE IF NOT EXISTS white_label_themes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    category ENUM('business', 'creative', 'minimal', 'dark', 'light', 'custom') NOT NULL DEFAULT 'business',
    preview_url TEXT NULL,
    config JSON NOT NULL COMMENT 'Theme color configuration and settings',
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_white_label_themes_category (category),
    INDEX idx_white_label_themes_premium (is_premium),
    INDEX idx_white_label_themes_active (is_active),
    INDEX idx_white_label_themes_sort (sort_order),
    
    UNIQUE KEY unique_theme_name (name)
);

-- Create domain_verification_logs table for tracking verification attempts
CREATE TABLE IF NOT EXISTS domain_verification_logs (
    id VARCHAR(36) PRIMARY KEY,
    domain_id VARCHAR(36) NOT NULL,
    verification_type ENUM('dns', 'http', 'ssl') NOT NULL,
    status ENUM('success', 'failed', 'pending') NOT NULL,
    details JSON NULL COMMENT 'Verification attempt details and errors',
    response_time_ms INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_domain_verification_logs_domain_id (domain_id),
    INDEX idx_domain_verification_logs_type (verification_type),
    INDEX idx_domain_verification_logs_status (status),
    INDEX idx_domain_verification_logs_created_at (created_at),
    
    FOREIGN KEY (domain_id) REFERENCES custom_domains(id) ON DELETE CASCADE
);

-- Create white_label_usage_stats table for tracking usage
CREATE TABLE IF NOT EXISTS white_label_usage_stats (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    stat_date DATE NOT NULL,
    custom_domain_requests INT NOT NULL DEFAULT 0,
    css_generations INT NOT NULL DEFAULT 0,
    asset_uploads INT NOT NULL DEFAULT 0,
    theme_applications INT NOT NULL DEFAULT 0,
    total_bandwidth_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_white_label_usage_stats_user_id (user_id),
    INDEX idx_white_label_usage_stats_date (stat_date),
    INDEX idx_white_label_usage_stats_user_date (user_id, stat_date),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, stat_date)
);

-- Insert default themes
INSERT INTO white_label_themes (id, name, description, category, config, is_premium, sort_order) VALUES
('default', 'Default', 'Clean and modern default theme', 'business', 
 JSON_OBJECT(
   'primary_color', '#3b82f6',
   'secondary_color', '#1e40af', 
   'accent_color', '#f59e0b',
   'background_color', '#ffffff',
   'text_color', '#1f2937'
 ), FALSE, 1),

('dark', 'Dark Mode', 'Sleek dark theme for modern applications', 'dark',
 JSON_OBJECT(
   'primary_color', '#6366f1',
   'secondary_color', '#4f46e5',
   'accent_color', '#06b6d4', 
   'background_color', '#111827',
   'text_color', '#f9fafb'
 ), FALSE, 2),

('minimal', 'Minimal White', 'Clean minimal theme with subtle colors', 'minimal',
 JSON_OBJECT(
   'primary_color', '#374151',
   'secondary_color', '#6b7280',
   'accent_color', '#10b981',
   'background_color', '#ffffff', 
   'text_color', '#111827'
 ), FALSE, 3),

('corporate', 'Corporate Blue', 'Professional corporate theme', 'business',
 JSON_OBJECT(
   'primary_color', '#1e40af',
   'secondary_color', '#1e3a8a',
   'accent_color', '#3b82f6',
   'background_color', '#f8fafc',
   'text_color', '#1e293b'
 ), TRUE, 4),

('creative', 'Creative Purple', 'Vibrant theme for creative professionals', 'creative',
 JSON_OBJECT(
   'primary_color', '#7c3aed',
   'secondary_color', '#6d28d9', 
   'accent_color', '#a855f7',
   'background_color', '#faf5ff',
   'text_color', '#581c87'
 ), TRUE, 5),

('nature', 'Nature Green', 'Fresh green theme inspired by nature', 'creative',
 JSON_OBJECT(
   'primary_color', '#059669',
   'secondary_color', '#047857',
   'accent_color', '#10b981',
   'background_color', '#f0fdf4',
   'text_color', '#064e3b'
 ), TRUE, 6),

('sunset', 'Sunset Orange', 'Warm sunset-inspired color palette', 'creative', 
 JSON_OBJECT(
   'primary_color', '#ea580c',
   'secondary_color', '#c2410c',
   'accent_color', '#fb923c',
   'background_color', '#fff7ed',
   'text_color', '#9a3412'
 ), TRUE, 7),

('ocean', 'Ocean Blue', 'Deep ocean blue professional theme', 'business',
 JSON_OBJECT(
   'primary_color', '#0369a1',
   'secondary_color', '#075985',
   'accent_color', '#0ea5e9', 
   'background_color', '#f0f9ff',
   'text_color', '#0c4a6e'
 ), TRUE, 8);

-- Create views for easier querying

-- View: Active white label configurations with assets
CREATE VIEW active_white_label_configs AS
SELECT 
    wlc.*,
    u.email as user_email,
    u.plan as user_plan,
    COUNT(DISTINCT wla.id) as total_assets,
    COUNT(DISTINCT cd.id) as total_domains,
    COUNT(CASE WHEN cd.status = 'verified' THEN 1 END) as verified_domains
FROM white_label_configs wlc
JOIN users u ON wlc.user_id = u.id
LEFT JOIN white_label_assets wla ON wlc.user_id = wla.user_id AND wla.is_active = TRUE
LEFT JOIN custom_domains cd ON wlc.user_id = cd.user_id
WHERE wlc.enabled = TRUE
GROUP BY wlc.id, u.email, u.plan;

-- View: Domain verification status summary
CREATE VIEW domain_verification_summary AS
SELECT 
    cd.id,
    cd.user_id,
    cd.domain,
    cd.subdomain,
    cd.status,
    cd.ssl_status,
    cd.verification_attempts,
    cd.last_verification_attempt,
    cd.verified_at,
    u.email as user_email,
    u.plan as user_plan,
    CASE 
        WHEN cd.status = 'verified' THEN 'Verified'
        WHEN cd.verification_attempts >= 5 THEN 'Failed (Max attempts)'
        WHEN cd.last_verification_attempt < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 'Stale'
        ELSE 'Pending'
    END as verification_status
FROM custom_domains cd
JOIN users u ON cd.user_id = u.id;

-- View: White label usage statistics
CREATE VIEW white_label_usage_summary AS
SELECT 
    wlus.user_id,
    u.email as user_email,
    u.plan as user_plan,
    DATE_FORMAT(wlus.stat_date, '%Y-%m') as month,
    SUM(wlus.custom_domain_requests) as total_domain_requests,
    SUM(wlus.css_generations) as total_css_generations,
    SUM(wlus.asset_uploads) as total_asset_uploads,
    SUM(wlus.theme_applications) as total_theme_applications,
    SUM(wlus.total_bandwidth_bytes) as total_bandwidth_bytes
FROM white_label_usage_stats wlus
JOIN users u ON wlus.user_id = u.id
GROUP BY wlus.user_id, u.email, u.plan, DATE_FORMAT(wlus.stat_date, '%Y-%m');

-- Create indexes for better performance
CREATE INDEX idx_white_label_configs_company_name ON white_label_configs (company_name);
CREATE INDEX idx_white_label_configs_theme_id ON white_label_configs (theme_id);
CREATE INDEX idx_white_label_assets_file_size ON white_label_assets (file_size);
CREATE INDEX idx_custom_domains_user_status ON custom_domains (user_id, status);
CREATE INDEX idx_domain_verification_logs_domain_type ON domain_verification_logs (domain_id, verification_type);

-- Add triggers for automatic updates

DELIMITER //

-- Trigger to update usage stats when assets are uploaded
CREATE TRIGGER update_usage_stats_on_asset_upload
AFTER INSERT ON white_label_assets
FOR EACH ROW
BEGIN
    INSERT INTO white_label_usage_stats (
        id, user_id, stat_date, asset_uploads
    )
    VALUES (
        UUID(), NEW.user_id, CURDATE(), 1
    )
    ON DUPLICATE KEY UPDATE
        asset_uploads = asset_uploads + 1,
        updated_at = NOW();
END//

-- Trigger to log domain verification attempts
CREATE TRIGGER log_domain_verification_attempt
AFTER UPDATE ON custom_domains
FOR EACH ROW
BEGIN
    IF NEW.last_verification_attempt != OLD.last_verification_attempt THEN
        INSERT INTO domain_verification_logs (
            id, domain_id, verification_type, status, details
        )
        VALUES (
            UUID(), NEW.id, 'dns', 
            CASE WHEN NEW.status = 'verified' THEN 'success' ELSE 'failed' END,
            JSON_OBJECT('attempt_number', NEW.verification_attempts, 'previous_status', OLD.status)
        );
    END IF;
END//

-- Trigger to update white label config when domain is verified
CREATE TRIGGER update_config_on_domain_verification
AFTER UPDATE ON custom_domains
FOR EACH ROW
BEGIN
    IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
        UPDATE white_label_configs 
        SET domain_verified = TRUE, updated_at = NOW()
        WHERE user_id = NEW.user_id AND custom_domain = NEW.domain;
    END IF;
END//

DELIMITER ;

-- Add comments for documentation
ALTER TABLE white_label_configs COMMENT = 'White label branding configurations for users';
ALTER TABLE white_label_assets COMMENT = 'Uploaded assets for white label branding';
ALTER TABLE custom_domains COMMENT = 'Custom domain configurations and verification status';
ALTER TABLE white_label_themes COMMENT = 'Predefined themes for white label configurations';
ALTER TABLE domain_verification_logs COMMENT = 'Logs of domain verification attempts';
ALTER TABLE white_label_usage_stats COMMENT = 'Usage statistics for white label features';
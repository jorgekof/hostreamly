const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { uploadFile, deleteFile } = require('../services/storageService');
const { validatePlan } = require('../middleware/planValidation');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const dns = require('dns').promises;
const axios = require('axios');

class WhiteLabelController {
  // Get white label configuration
  async getConfig(req, res) {
    try {
      const userId = req.user.id;
      
      const [config] = await db.execute(
        `SELECT wl.*, 
                GROUP_CONCAT(DISTINCT CONCAT(wa.id, ':', wa.asset_type, ':', wa.file_url) SEPARATOR '|') as assets,
                GROUP_CONCAT(DISTINCT CONCAT(cd.id, ':', cd.domain, ':', cd.status, ':', cd.ssl_enabled) SEPARATOR '|') as domains
         FROM white_label_configs wl
         LEFT JOIN white_label_assets wa ON wl.user_id = wa.user_id
         LEFT JOIN custom_domains cd ON wl.user_id = cd.user_id
         WHERE wl.user_id = ?
         GROUP BY wl.id`,
        [userId]
      );
      
      if (config.length === 0) {
        // Return default configuration
        return res.json({
          success: true,
          data: {
            user_id: userId,
            company_name: 'My Company',
            primary_color: '#3b82f6',
            secondary_color: '#1e40af',
            accent_color: '#f59e0b',
            background_color: '#ffffff',
            text_color: '#1f2937',
            domain_verified: false,
            branding_settings: {
              hide_powered_by: false,
              show_company_logo: true,
              custom_footer_text: null,
              custom_login_background: null
            },
            player_settings: {
              skin: 'default',
              controls_color: '#3b82f6',
              progress_color: '#f59e0b',
              watermark_enabled: false,
              watermark_position: 'bottom-right',
              watermark_opacity: 0.7
            },
            assets: [],
            domains: []
          }
        });
      }
      
      const configData = config[0];
      
      // Parse assets
      const assets = configData.assets ? 
        configData.assets.split('|').map(asset => {
          const [id, type, url] = asset.split(':');
          return { id, asset_type: type, file_url: url };
        }) : [];
      
      // Parse domains
      const domains = configData.domains ?
        configData.domains.split('|').map(domain => {
          const [id, domainName, status, sslEnabled] = domain.split(':');
          return { id, domain: domainName, status, ssl_enabled: sslEnabled === '1' };
        }) : [];
      
      res.json({
        success: true,
        data: {
          ...configData,
          branding_settings: JSON.parse(configData.branding_settings || '{}'),
          player_settings: JSON.parse(configData.player_settings || '{}'),
          email_templates: JSON.parse(configData.email_templates || '{}'),
          social_links: JSON.parse(configData.social_links || '{}'),
          seo_settings: JSON.parse(configData.seo_settings || '{}'),
          assets,
          domains
        }
      });
    } catch (error) {
      console.error('Error fetching white label config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch white label configuration'
      });
    }
  }
  
  // Update white label configuration
  async updateConfig(req, res) {
    try {
      const userId = req.user.id;
      const {
        company_name,
        company_logo_url,
        company_favicon_url,
        primary_color,
        secondary_color,
        accent_color,
        background_color,
        text_color,
        custom_domain,
        custom_css,
        branding_settings,
        player_settings,
        email_templates,
        social_links,
        seo_settings
      } = req.body;
      
      const configId = uuidv4();
      
      await db.execute(
        `INSERT INTO white_label_configs (
          id, user_id, company_name, company_logo_url, company_favicon_url,
          primary_color, secondary_color, accent_color, background_color, text_color,
          custom_domain, custom_css, branding_settings, player_settings,
          email_templates, social_links, seo_settings, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          company_name = VALUES(company_name),
          company_logo_url = VALUES(company_logo_url),
          company_favicon_url = VALUES(company_favicon_url),
          primary_color = VALUES(primary_color),
          secondary_color = VALUES(secondary_color),
          accent_color = VALUES(accent_color),
          background_color = VALUES(background_color),
          text_color = VALUES(text_color),
          custom_domain = VALUES(custom_domain),
          custom_css = VALUES(custom_css),
          branding_settings = VALUES(branding_settings),
          player_settings = VALUES(player_settings),
          email_templates = VALUES(email_templates),
          social_links = VALUES(social_links),
          seo_settings = VALUES(seo_settings),
          updated_at = NOW()`,
        [
          configId, userId, company_name, company_logo_url, company_favicon_url,
          primary_color, secondary_color, accent_color, background_color, text_color,
          custom_domain, custom_css,
          JSON.stringify(branding_settings || {}),
          JSON.stringify(player_settings || {}),
          JSON.stringify(email_templates || {}),
          JSON.stringify(social_links || {}),
          JSON.stringify(seo_settings || {})
        ]
      );
      
      res.json({
        success: true,
        message: 'White label configuration updated successfully'
      });
    } catch (error) {
      console.error('Error updating white label config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update white label configuration'
      });
    }
  }
  
  // Upload asset (logo, favicon, etc.)
  async uploadAsset(req, res) {
    try {
      const userId = req.user.id;
      const { asset_type } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }
      
      // Validate asset type
      const validTypes = ['logo', 'favicon', 'watermark', 'background', 'banner'];
      if (!validTypes.includes(asset_type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid asset type'
        });
      }
      
      // Upload file to storage
      const fileUrl = await uploadFile(req.file, `whitelabel/${userId}/${asset_type}`);
      
      const assetId = uuidv4();
      
      // Save asset info to database
      await db.execute(
        `INSERT INTO white_label_assets (
          id, user_id, asset_type, file_name, file_url, file_size, mime_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          file_name = VALUES(file_name),
          file_url = VALUES(file_url),
          file_size = VALUES(file_size),
          mime_type = VALUES(mime_type),
          updated_at = NOW()`,
        [
          assetId, userId, asset_type, req.file.originalname,
          fileUrl, req.file.size, req.file.mimetype
        ]
      );
      
      res.json({
        success: true,
        data: {
          id: assetId,
          asset_type,
          file_url: fileUrl,
          file_name: req.file.originalname,
          file_size: req.file.size,
          mime_type: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('Error uploading asset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload asset'
      });
    }
  }
  
  // Delete asset
  async deleteAsset(req, res) {
    try {
      const userId = req.user.id;
      const { assetId } = req.params;
      
      // Get asset info
      const [assets] = await db.execute(
        'SELECT * FROM white_label_assets WHERE id = ? AND user_id = ?',
        [assetId, userId]
      );
      
      if (assets.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Asset not found'
        });
      }
      
      const asset = assets[0];
      
      // Delete file from storage
      await deleteFile(asset.file_url);
      
      // Delete from database
      await db.execute(
        'DELETE FROM white_label_assets WHERE id = ? AND user_id = ?',
        [assetId, userId]
      );
      
      res.json({
        success: true,
        message: 'Asset deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete asset'
      });
    }
  }
  
  // Setup custom domain
  async setupCustomDomain(req, res) {
    try {
      const userId = req.user.id;
      const { domain, subdomain } = req.body;
      
      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
      if (!domainRegex.test(domain)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid domain format'
        });
      }
      
      // Check if domain already exists
      const [existingDomains] = await db.execute(
        'SELECT id FROM custom_domains WHERE domain = ? AND user_id != ?',
        [domain, userId]
      );
      
      if (existingDomains.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Domain already in use'
        });
      }
      
      const domainId = uuidv4();
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Generate DNS records
      const dnsRecords = [
        {
          type: 'CNAME',
          name: subdomain ? `${subdomain}.${domain}` : domain,
          value: 'hostreamly.com',
          ttl: 300
        },
        {
          type: 'TXT',
          name: `_hostreamly-verification.${domain}`,
          value: verificationToken,
          ttl: 300
        }
      ];
      
      // Save domain configuration
      await db.execute(
        `INSERT INTO custom_domains (
          id, user_id, domain, subdomain, verification_token, dns_records,
          status, ssl_enabled, cdn_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', true, true)
        ON DUPLICATE KEY UPDATE
          subdomain = VALUES(subdomain),
          verification_token = VALUES(verification_token),
          dns_records = VALUES(dns_records),
          status = 'pending',
          updated_at = NOW()`,
        [
          domainId, userId, domain, subdomain, verificationToken,
          JSON.stringify(dnsRecords)
        ]
      );
      
      res.json({
        success: true,
        data: {
          domain_id: domainId,
          domain,
          subdomain,
          verification_token: verificationToken,
          dns_records: dnsRecords,
          status: 'pending'
        }
      });
    } catch (error) {
      console.error('Error setting up custom domain:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to setup custom domain'
      });
    }
  }
  
  // Verify custom domain
  async verifyCustomDomain(req, res) {
    try {
      const userId = req.user.id;
      const { domain } = req.params;
      
      // Get domain configuration
      const [domains] = await db.execute(
        'SELECT * FROM custom_domains WHERE domain = ? AND user_id = ?',
        [domain, userId]
      );
      
      if (domains.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Domain not found'
        });
      }
      
      const domainConfig = domains[0];
      
      try {
        // Verify TXT record
        const txtRecords = await dns.resolveTxt(`_hostreamly-verification.${domain}`);
        const verificationRecord = txtRecords.flat().find(record => 
          record === domainConfig.verification_token
        );
        
        if (!verificationRecord) {
          return res.json({
            success: true,
            verified: false,
            status: 'pending',
            error: 'Verification TXT record not found'
          });
        }
        
        // Verify CNAME record
        const fullDomain = domainConfig.subdomain ? 
          `${domainConfig.subdomain}.${domain}` : domain;
        
        try {
          const cnameRecords = await dns.resolveCname(fullDomain);
          const validCname = cnameRecords.includes('hostreamly.com');
          
          if (!validCname) {
            return res.json({
              success: true,
              verified: false,
              status: 'pending',
              error: 'CNAME record not properly configured'
            });
          }
        } catch (cnameError) {
          return res.json({
            success: true,
            verified: false,
            status: 'pending',
            error: 'CNAME record not found'
          });
        }
        
        // Update domain status
        await db.execute(
          `UPDATE custom_domains 
           SET status = 'verified', verified_at = NOW(), updated_at = NOW()
           WHERE id = ?`,
          [domainConfig.id]
        );
        
        // Update white label config
        await db.execute(
          `UPDATE white_label_configs 
           SET custom_domain = ?, domain_verified = true, updated_at = NOW()
           WHERE user_id = ?`,
          [domain, userId]
        );
        
        res.json({
          success: true,
          verified: true,
          status: 'verified',
          ssl_status: 'pending' // SSL setup would be handled separately
        });
      } catch (dnsError) {
        console.error('DNS verification error:', dnsError);
        res.json({
          success: true,
          verified: false,
          status: 'failed',
          error: 'DNS verification failed'
        });
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify domain'
      });
    }
  }
  
  // Get custom domains
  async getCustomDomains(req, res) {
    try {
      const userId = req.user.id;
      
      const [domains] = await db.execute(
        `SELECT id, domain, subdomain, status, ssl_enabled, cdn_enabled,
                verification_token, dns_records, verified_at, created_at, updated_at
         FROM custom_domains 
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );
      
      const domainsWithParsedRecords = domains.map(domain => ({
        ...domain,
        dns_records: JSON.parse(domain.dns_records || '[]')
      }));
      
      res.json({
        success: true,
        data: domainsWithParsedRecords
      });
    } catch (error) {
      console.error('Error fetching custom domains:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch custom domains'
      });
    }
  }
  
  // Generate CSS
  async generateCSS(req, res) {
    try {
      const userId = req.user.id;
      
      const [configs] = await db.execute(
        'SELECT * FROM white_label_configs WHERE user_id = ?',
        [userId]
      );
      
      if (configs.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'White label configuration not found'
        });
      }
      
      const config = configs[0];
      const brandingSettings = JSON.parse(config.branding_settings || '{}');
      const playerSettings = JSON.parse(config.player_settings || '{}');
      
      const css = `
        :root {
          --wl-primary: ${config.primary_color};
          --wl-secondary: ${config.secondary_color};
          --wl-accent: ${config.accent_color};
          --wl-background: ${config.background_color};
          --wl-text: ${config.text_color};
          --wl-player-controls: ${playerSettings.controls_color || config.primary_color};
          --wl-player-progress: ${playerSettings.progress_color || config.accent_color};
        }
        
        .brand-primary { background-color: var(--wl-primary); color: white; }
        .brand-secondary { background-color: var(--wl-secondary); color: white; }
        .brand-accent { background-color: var(--wl-accent); color: white; }
        .brand-text { color: var(--wl-text); }
        .brand-bg { background-color: var(--wl-background); }
        
        .video-player {
          --controls-color: var(--wl-player-controls);
          --progress-color: var(--wl-player-progress);
        }
        
        ${brandingSettings.hide_powered_by ? '.powered-by { display: none !important; }' : ''}
        
        ${playerSettings.watermark_enabled ? `
        .video-watermark {
          position: absolute;
          ${playerSettings.watermark_position?.includes('top') ? 'top: 20px;' : 'bottom: 20px;'}
          ${playerSettings.watermark_position?.includes('left') ? 'left: 20px;' : 'right: 20px;'}
          opacity: ${playerSettings.watermark_opacity || 0.7};
          pointer-events: none;
          z-index: 1000;
        }
        ` : ''}
        
        ${config.custom_css || ''}
      `;
      
      res.setHeader('Content-Type', 'text/css');
      res.send(css);
    } catch (error) {
      console.error('Error generating CSS:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate CSS'
      });
    }
  }
  
  // Get available themes
  async getThemes(req, res) {
    try {
      const themes = [
        {
          id: 'default',
          name: 'Default',
          description: 'Clean and modern default theme',
          category: 'business',
          is_premium: false,
          config: {
            primary_color: '#3b82f6',
            secondary_color: '#1e40af',
            accent_color: '#f59e0b',
            background_color: '#ffffff',
            text_color: '#1f2937'
          }
        },
        {
          id: 'dark',
          name: 'Dark Mode',
          description: 'Sleek dark theme for modern applications',
          category: 'dark',
          is_premium: false,
          config: {
            primary_color: '#6366f1',
            secondary_color: '#4f46e5',
            accent_color: '#06b6d4',
            background_color: '#111827',
            text_color: '#f9fafb'
          }
        },
        {
          id: 'corporate',
          name: 'Corporate Blue',
          description: 'Professional corporate theme',
          category: 'business',
          is_premium: true,
          config: {
            primary_color: '#1e40af',
            secondary_color: '#1e3a8a',
            accent_color: '#3b82f6',
            background_color: '#f8fafc',
            text_color: '#1e293b'
          }
        },
        {
          id: 'creative',
          name: 'Creative Purple',
          description: 'Vibrant theme for creative professionals',
          category: 'creative',
          is_premium: true,
          config: {
            primary_color: '#7c3aed',
            secondary_color: '#6d28d9',
            accent_color: '#a855f7',
            background_color: '#faf5ff',
            text_color: '#581c87'
          }
        }
      ];
      
      res.json({
        success: true,
        data: themes
      });
    } catch (error) {
      console.error('Error fetching themes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch themes'
      });
    }
  }
  
  // Apply theme
  async applyTheme(req, res) {
    try {
      const userId = req.user.id;
      const { themeId } = req.params;
      
      // Get theme configuration
      const themes = [
        {
          id: 'default',
          config: {
            primary_color: '#3b82f6',
            secondary_color: '#1e40af',
            accent_color: '#f59e0b',
            background_color: '#ffffff',
            text_color: '#1f2937'
          }
        },
        {
          id: 'dark',
          config: {
            primary_color: '#6366f1',
            secondary_color: '#4f46e5',
            accent_color: '#06b6d4',
            background_color: '#111827',
            text_color: '#f9fafb'
          }
        },
        {
          id: 'corporate',
          config: {
            primary_color: '#1e40af',
            secondary_color: '#1e3a8a',
            accent_color: '#3b82f6',
            background_color: '#f8fafc',
            text_color: '#1e293b'
          }
        },
        {
          id: 'creative',
          config: {
            primary_color: '#7c3aed',
            secondary_color: '#6d28d9',
            accent_color: '#a855f7',
            background_color: '#faf5ff',
            text_color: '#581c87'
          }
        }
      ];
      
      const theme = themes.find(t => t.id === themeId);
      if (!theme) {
        return res.status(404).json({
          success: false,
          error: 'Theme not found'
        });
      }
      
      // Update configuration with theme colors
      const configId = uuidv4();
      
      await db.execute(
        `INSERT INTO white_label_configs (
          id, user_id, primary_color, secondary_color, accent_color,
          background_color, text_color, theme_id, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          primary_color = VALUES(primary_color),
          secondary_color = VALUES(secondary_color),
          accent_color = VALUES(accent_color),
          background_color = VALUES(background_color),
          text_color = VALUES(text_color),
          theme_id = VALUES(theme_id),
          updated_at = NOW()`,
        [
          configId, userId, theme.config.primary_color, theme.config.secondary_color,
          theme.config.accent_color, theme.config.background_color,
          theme.config.text_color, themeId
        ]
      );
      
      res.json({
        success: true,
        message: 'Theme applied successfully',
        data: theme.config
      });
    } catch (error) {
      console.error('Error applying theme:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to apply theme'
      });
    }
  }
}

module.exports = new WhiteLabelController();
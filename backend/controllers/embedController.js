const { Video, User, EmbedConfig } = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { Op } = require('sequelize');

/**
 * Enhanced Embed Controller with Domain Protection
 * 
 * Features:
 * - Generate secure embed codes with domain protection
 * - Whitelist/Blacklist domain validation
 * - Customizable iframe options
 * - Social media meta tags
 * - Secure sharing URLs
 * - Analytics tracking
 */
class EmbedController {

  /**
   * Generate embed code for a video with domain protection
   */
  async generateEmbedCode(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { videoId } = req.params;
      const {
        width = 640,
        height = 360,
        autoplay = false,
        controls = true,
        muted = false,
        loop = false,
        responsive = true,
        showTitle = true,
        showDescription = false,
        customCSS = '',
        // Domain protection settings
        domainProtectionEnabled = false,
        domainProtectionType = 'whitelist',
        allowedDomains = [],
        requireReferrer = true,
        allowApiAccess = false,
        expiresAt = null
      } = req.body;

      // Find video and check permissions
      const video = await Video.findOne({
        where: { 
          id: videoId,
          user_id: req.user.id 
        },
        include: [{
          model: User,
          attributes: ['id', 'username', 'profile_picture']
        }]
      });

      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found or access denied'
        });
      }

      // Generate secure embed token
      const embedToken = crypto.randomBytes(32).toString('hex');
      
      // Create embed configuration in database
      const embedConfig = await EmbedConfig.create({
        user_id: req.user.id,
        video_id: videoId,
        embed_token: embedToken,
        width,
        height,
        autoplay,
        controls,
        muted,
        loop,
        responsive,
        show_title: showTitle,
        show_description: showDescription,
        custom_css: customCSS,
        domain_protection_enabled: domainProtectionEnabled,
        domain_protection_type: domainProtectionType,
        allowed_domains: allowedDomains,
        require_referrer: requireReferrer,
        allow_api_access: allowApiAccess,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        is_active: true
      });
      
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const embedUrl = `${baseUrl}/embed/${embedToken}`;
      
      // Generate iframe code
      const iframeAttributes = [
        `src="${embedUrl}"`,
        `width="${width}"`,
        `height="${height}"`,
        'frameborder="0"',
        'allowfullscreen',
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"'
      ];

      if (responsive) {
        iframeAttributes.push('style="width: 100%; height: auto; aspect-ratio: 16/9;"');
      }

      const iframeCode = `<iframe ${iframeAttributes.join(' ')}></iframe>`;
      
      // Generate responsive wrapper if needed
      const responsiveCode = responsive ? 
        `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  ${iframeCode.replace('style="width: 100%; height: auto; aspect-ratio: 16/9;"', 'style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"')}
</div>` : 
        iframeCode;

      // Generate JavaScript SDK code
      const jsCode = `
<script src="${baseUrl}/js/hostreamly-player.js"></script>
<div id="hostreamly-player-${videoId}"></div>
<script>
  HostreamlyPlayer.init({
    container: '#hostreamly-player-${videoId}',
    token: '${embedToken}',
    width: ${width},
    height: ${height},
    autoplay: ${autoplay},
    controls: ${controls},
    muted: ${muted},
    loop: ${loop}
  });
</script>`;

      // Generate sharing URL with meta tags
      const shareUrl = `${baseUrl}/watch/${videoId}`;
      
      res.json({
        success: true,
        data: {
          embedToken,
          embedUrl,
          shareUrl,
          codes: {
            iframe: iframeCode,
            responsive: responsiveCode,
            javascript: jsCode
          },
          config: {
            id: embedConfig.id,
            width,
            height,
            autoplay,
            controls,
            muted,
            loop,
            responsive,
            showTitle,
            showDescription,
            domainProtectionEnabled,
            domainProtectionType,
            allowedDomains,
            requireReferrer,
            allowApiAccess,
            expiresAt
          },
          video: {
            id: video.id,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnail_url,
            duration: video.duration,
            user: video.User
          }
        }
      });

    } catch (error) {
      logger.error('Error generating embed code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate embed code',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get embed player page with domain validation
   */
  async getEmbedPlayer(req, res) {
    try {
      const { token } = req.params;
      const referrer = req.get('Referer');
      const userAgent = req.get('User-Agent');
      
      // Find embed configuration
      const embedConfig = await EmbedConfig.findOne({
        where: {
          embed_token: token,
          is_active: true
        },
        include: [{
          model: Video,
          as: 'Video',
          include: [{
            model: User,
            as: 'User',
            attributes: ['id', 'username', 'profile_picture']
          }]
        }]
      });

      if (!embedConfig) {
        return res.status(404).json({
          success: false,
          message: 'Embed configuration not found or expired'
        });
      }

      // Check if embed is expired
      if (embedConfig.isExpired()) {
        return res.status(410).json({
          success: false,
          message: 'Embed code has expired'
        });
      }

      // Validate domain protection
      if (embedConfig.domain_protection_enabled) {
        let domain = null;
        
        if (referrer) {
          try {
            const url = new URL(referrer);
            domain = url.hostname;
          } catch (e) {
            logger.warn('Invalid referrer URL:', referrer);
          }
        }

        // Check if domain is allowed
        if (!embedConfig.isDomainAllowed(domain)) {
          logger.warn(`Domain access denied for embed ${token}:`, {
            domain,
            referrer,
            userAgent,
            allowedDomains: embedConfig.allowed_domains,
            protectionType: embedConfig.domain_protection_type
          });
          
          return res.status(403).json({
            success: false,
            message: 'Access denied: Domain not authorized',
            code: 'DOMAIN_NOT_AUTHORIZED'
          });
        }
      }

      const video = embedConfig.Video;
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Increment view count asynchronously
      embedConfig.incrementViewCount().catch(err => {
        logger.error('Error incrementing embed view count:', err);
      });

      // Generate player HTML
      const playerHTML = this.generatePlayerHTML(embedConfig, video);
      
      res.json({
        success: true,
        data: {
          video: {
            id: video.id,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnail_url,
            duration: video.duration,
            stream_url: video.stream_url,
            user: video.User
          },
          config: {
            width: embedConfig.width,
            height: embedConfig.height,
            autoplay: embedConfig.autoplay,
            controls: embedConfig.controls,
            muted: embedConfig.muted,
            loop: embedConfig.loop,
            responsive: embedConfig.responsive,
            showTitle: embedConfig.show_title,
            showDescription: embedConfig.show_description,
            customCSS: embedConfig.custom_css
          },
          playerHTML
        }
      });

    } catch (error) {
      logger.error('Error getting embed player:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load embed player',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get embed configurations for a user
   */
  async getEmbedConfigs(req, res) {
    try {
      const { page = 1, limit = 20, videoId, active } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClause = {
        user_id: req.user.id
      };
      
      if (videoId) {
        whereClause.video_id = videoId;
      }
      
      if (active !== undefined) {
        whereClause.is_active = active === 'true';
      }

      const { count, rows: embedConfigs } = await EmbedConfig.findAndCountAll({
        where: whereClause,
        include: [{
          model: Video,
          as: 'Video',
          attributes: ['id', 'title', 'thumbnail_url', 'duration']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          embedConfigs: embedConfigs.map(config => ({
            id: config.id,
            embedToken: config.embed_token,
            video: config.Video,
            config: {
              width: config.width,
              height: config.height,
              domainProtectionEnabled: config.domain_protection_enabled,
              domainProtectionType: config.domain_protection_type,
              allowedDomains: config.allowed_domains,
              expiresAt: config.expires_at
            },
            stats: {
              viewCount: config.view_count,
              lastViewedAt: config.last_viewed_at
            },
            isActive: config.is_active,
            isExpired: config.isExpired(),
            createdAt: config.created_at
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Error getting embed configs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get embed configurations',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update embed configuration
   */
  async updateEmbedConfig(req, res) {
    try {
      const { configId } = req.params;
      const updates = req.body;
      
      const embedConfig = await EmbedConfig.findOne({
        where: {
          id: configId,
          user_id: req.user.id
        }
      });

      if (!embedConfig) {
        return res.status(404).json({
          success: false,
          message: 'Embed configuration not found'
        });
      }

      // Update allowed fields
      const allowedFields = [
        'width', 'height', 'autoplay', 'controls', 'muted', 'loop', 'responsive',
        'show_title', 'show_description', 'custom_css', 'domain_protection_enabled',
        'domain_protection_type', 'allowed_domains', 'require_referrer', 
        'allow_api_access', 'expires_at', 'is_active'
      ];

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          embedConfig[field] = updates[field];
        }
      });

      await embedConfig.save();

      res.json({
        success: true,
        data: {
          embedConfig: {
            id: embedConfig.id,
            embedToken: embedConfig.embed_token,
            config: {
              width: embedConfig.width,
              height: embedConfig.height,
              domainProtectionEnabled: embedConfig.domain_protection_enabled,
              domainProtectionType: embedConfig.domain_protection_type,
              allowedDomains: embedConfig.allowed_domains,
              expiresAt: embedConfig.expires_at
            },
            isActive: embedConfig.is_active,
            updatedAt: embedConfig.updated_at
          }
        }
      });

    } catch (error) {
      logger.error('Error updating embed config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update embed configuration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete embed configuration
   */
  async deleteEmbedConfig(req, res) {
    try {
      const { configId } = req.params;
      
      const embedConfig = await EmbedConfig.findOne({
        where: {
          id: configId,
          user_id: req.user.id
        }
      });

      if (!embedConfig) {
        return res.status(404).json({
          success: false,
          message: 'Embed configuration not found'
        });
      }

      await embedConfig.destroy();

      res.json({
        success: true,
        message: 'Embed configuration deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting embed config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete embed configuration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Generate player HTML
   */
  generatePlayerHTML(embedConfig, video) {
    const customCSS = embedConfig.custom_css || '';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${embedConfig.show_title ? video.title : 'Hostreamly Video'}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .video-container {
            position: relative;
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .video-player {
            width: 100%;
            height: 100%;
            max-width: ${embedConfig.width}px;
            max-height: ${embedConfig.height}px;
        }
        .video-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            color: white;
            padding: 20px;
            display: ${embedConfig.show_title || embedConfig.show_description ? 'block' : 'none'};
        }
        .video-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            display: ${embedConfig.show_title ? 'block' : 'none'};
        }
        .video-description {
            font-size: 14px;
            opacity: 0.9;
            display: ${embedConfig.show_description ? 'block' : 'none'};
        }
        ${customCSS}
    </style>
</head>
<body>
    <div class="video-container">
        <video 
            class="video-player"
            ${embedConfig.controls ? 'controls' : ''}
            ${embedConfig.autoplay ? 'autoplay' : ''}
            ${embedConfig.muted ? 'muted' : ''}
            ${embedConfig.loop ? 'loop' : ''}
            poster="${video.thumbnail_url || ''}"
            preload="metadata"
        >
            <source src="${video.stream_url}" type="video/mp4">
            Your browser does not support the video tag.
        </video>
        
        <div class="video-info">
            <div class="video-title">${video.title}</div>
            <div class="video-description">${video.description || ''}</div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Cleanup expired embed configurations (cron job)
   */
  async cleanupExpiredEmbeds(req, res) {
    try {
      const cleanedCount = await EmbedConfig.cleanupExpired();
      
      res.json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired embed configurations`
      });

    } catch (error) {
      logger.error('Error cleaning up expired embeds:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup expired embeds',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new EmbedController();
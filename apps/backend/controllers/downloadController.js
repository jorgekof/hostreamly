const { DownloadLink, Video, User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const { getClientIP, validateIPOrCIDR } = require('../utils/ipUtils');
const bunnyService = require('../services/BunnyService');
const { validationResult } = require('express-validator');

/**
 * Create a new download link
 */
const createDownloadLink = async (req, res) => {
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
      download_type = 'transcoded',
      quality,
      format,
      expires_in_hours = 24,
      max_downloads = 1,
      password,
      ip_restrictions = [],
      require_auth = false,
      notify_on_download = true,
      requester_email,
      requester_name,
      notes
    } = req.body;

    // Check if video exists and user has access
    const video = await Video.findOne({
      where: {
        id: videoId,
        [Op.or]: [
          { user_id: req.user.id },
          { privacy: 'public' }
        ]
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or access denied'
      });
    }

    // Validate IP restrictions
    if (ip_restrictions && ip_restrictions.length > 0) {
      for (const ip of ip_restrictions) {
        const validation = validateIPOrCIDR(ip);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: `Invalid IP restriction: ${ip} - ${validation.error}`
          });
        }
      }
    }

    // Hash password if provided
    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 12);
    }

    // Calculate expiration date
    const expires_at = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000);

    // Generate secure token
    const token = crypto.randomBytes(64).toString('hex');

    // Get video metadata for the download link
    let metadata = {
      video_title: video.title,
      video_duration: video.duration,
      original_filename: video.original_filename
    };

    // Add format-specific metadata
    if (download_type === 'transcoded' && quality) {
      try {
        const videoInfo = await bunnyService.getVideoInfo(video.bunny_video_id);
        const transcodedFile = videoInfo.videoLibrary?.find(v => v.height === parseInt(quality.replace('p', '')));
        if (transcodedFile) {
          metadata.file_size = transcodedFile.size;
          metadata.bitrate = transcodedFile.bitrate;
        }
      } catch (error) {
        logger.warn('Could not fetch video metadata for download link', {
          videoId,
          error: error.message
        });
      }
    }

    // Create download link
    const downloadLink = await DownloadLink.create({
      token,
      video_id: videoId,
      user_id: req.user.id,
      requester_email,
      requester_name,
      download_type,
      quality,
      format,
      expires_at,
      max_downloads,
      password_hash,
      ip_restrictions,
      require_auth,
      notify_on_download,
      metadata,
      notes
    });

    // Log the creation
    logger.info('Download link created', {
      linkId: downloadLink.id,
      videoId,
      userId: req.user.id,
      downloadType: download_type,
      expiresAt: expires_at
    });

    // Return the download link (without sensitive data)
    const response = {
      id: downloadLink.id,
      token: downloadLink.token,
      download_url: `${req.protocol}://${req.get('host')}/api/downloads/${downloadLink.token}`,
      video_id: downloadLink.video_id,
      download_type: downloadLink.download_type,
      quality: downloadLink.quality,
      format: downloadLink.format,
      expires_at: downloadLink.expires_at,
      max_downloads: downloadLink.max_downloads,
      download_count: downloadLink.download_count,
      status: downloadLink.status,
      created_at: downloadLink.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Download link created successfully',
      data: response
    });

  } catch (error) {
    logger.error('Error creating download link:', {
      error: error.message,
      stack: error.stack,
      videoId: req.params.videoId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create download link'
    });
  }
};

/**
 * Get download links for a video
 */
const getVideoDownloadLinks = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Check if user owns the video
    const video = await Video.findOne({
      where: {
        id: videoId,
        user_id: req.user.id
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or access denied'
      });
    }

    const whereClause = { video_id: videoId };
    if (status) {
      whereClause.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: downloadLinks } = await DownloadLink.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: {
        exclude: ['password_hash']
      }
    });

    res.json({
      success: true,
      data: {
        download_links: downloadLinks,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching download links:', {
      error: error.message,
      videoId: req.params.videoId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch download links'
    });
  }
};

/**
 * Get user's download links
 */
const getUserDownloadLinks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, video_id } = req.query;

    const whereClause = { user_id: req.user.id };
    if (status) {
      whereClause.status = status;
    }
    if (video_id) {
      whereClause.video_id = video_id;
    }

    const offset = (page - 1) * limit;

    const { count, rows: downloadLinks } = await DownloadLink.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnail_url', 'duration']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: {
        exclude: ['password_hash']
      }
    });

    res.json({
      success: true,
      data: {
        download_links: downloadLinks,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching user download links:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch download links'
    });
  }
};

/**
 * Update download link
 */
const updateDownloadLink = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { linkId } = req.params;
    const {
      expires_in_hours,
      max_downloads,
      password,
      ip_restrictions,
      status,
      notes
    } = req.body;

    // Find the download link
    const downloadLink = await DownloadLink.findOne({
      where: {
        id: linkId,
        user_id: req.user.id
      }
    });

    if (!downloadLink) {
      return res.status(404).json({
        success: false,
        message: 'Download link not found'
      });
    }

    // Prepare update data
    const updateData = {};

    if (expires_in_hours !== undefined) {
      updateData.expires_at = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000);
    }

    if (max_downloads !== undefined) {
      updateData.max_downloads = max_downloads;
    }

    if (password !== undefined) {
      if (password) {
        updateData.password_hash = await bcrypt.hash(password, 12);
      } else {
        updateData.password_hash = null;
      }
    }

    if (ip_restrictions !== undefined) {
      // Validate IP restrictions
      if (ip_restrictions && ip_restrictions.length > 0) {
        for (const ip of ip_restrictions) {
          const validation = validateIPOrCIDR(ip);
          if (!validation.valid) {
            return res.status(400).json({
              success: false,
              message: `Invalid IP restriction: ${ip} - ${validation.error}`
            });
          }
        }
      }
      updateData.ip_restrictions = ip_restrictions;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update the download link
    await downloadLink.update(updateData);

    logger.info('Download link updated', {
      linkId: downloadLink.id,
      userId: req.user.id,
      updates: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Download link updated successfully',
      data: {
        id: downloadLink.id,
        status: downloadLink.status,
        expires_at: downloadLink.expires_at,
        max_downloads: downloadLink.max_downloads,
        updated_at: downloadLink.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error updating download link:', {
      error: error.message,
      linkId: req.params.linkId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update download link'
    });
  }
};

/**
 * Delete download link
 */
const deleteDownloadLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const downloadLink = await DownloadLink.findOne({
      where: {
        id: linkId,
        user_id: req.user.id
      }
    });

    if (!downloadLink) {
      return res.status(404).json({
        success: false,
        message: 'Download link not found'
      });
    }

    await downloadLink.destroy();

    logger.info('Download link deleted', {
      linkId: downloadLink.id,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Download link deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting download link:', {
      error: error.message,
      linkId: req.params.linkId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete download link'
    });
  }
};

/**
 * Process download request
 */
const processDownload = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent');

    // Find the download link
    const downloadLink = await DownloadLink.findOne({
      where: { token },
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'bunny_video_id', 'user_id', 'file_path', 'original_filename']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!downloadLink) {
      return res.status(404).json({
        success: false,
        message: 'Download link not found'
      });
    }

    // Check if link is valid
    const canDownload = downloadLink.canDownload(clientIP);
    if (!canDownload.allowed) {
      return res.status(403).json({
        success: false,
        message: canDownload.reason
      });
    }

    // Check password if required
    if (downloadLink.password_hash) {
      if (!password) {
        return res.status(401).json({
          success: false,
          message: 'Password required',
          requires_password: true
        });
      }

      const isValidPassword = await bcrypt.compare(password, downloadLink.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    // Check authentication if required
    if (downloadLink.require_auth && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      let downloadUrl;
      let filename;

      // Get download URL based on type
      switch (downloadLink.download_type) {
        case 'original':
          downloadUrl = await bunnyService.getVideoDownloadUrl(downloadLink.video.bunny_video_id);
          filename = downloadLink.video.original_filename || `${downloadLink.video.title}.mp4`;
          break;

        case 'transcoded':
          if (downloadLink.quality) {
            downloadUrl = await bunnyService.getVideoDownloadUrl(
              downloadLink.video.bunny_video_id,
              downloadLink.quality
            );
            filename = `${downloadLink.video.title}_${downloadLink.quality}.mp4`;
          } else {
            downloadUrl = await bunnyService.getVideoDownloadUrl(downloadLink.video.bunny_video_id);
            filename = `${downloadLink.video.title}.mp4`;
          }
          break;

        case 'thumbnail':
          downloadUrl = await bunnyService.getVideoThumbnailUrl(downloadLink.video.bunny_video_id);
          filename = `${downloadLink.video.title}_thumbnail.jpg`;
          break;

        case 'preview':
          downloadUrl = await bunnyService.getVideoPreviewUrl(downloadLink.video.bunny_video_id);
          filename = `${downloadLink.video.title}_preview.gif`;
          break;

        default:
          throw new Error('Invalid download type');
      }

      // Increment download count
      await downloadLink.incrementDownload(clientIP, userAgent);

      // Log the download
      logger.info('File downloaded', {
        linkId: downloadLink.id,
        videoId: downloadLink.video.id,
        downloadType: downloadLink.download_type,
        clientIP,
        userAgent,
        downloadCount: downloadLink.download_count + 1
      });

      // Send notification if enabled
      if (downloadLink.notify_on_download) {
        // TODO: Implement notification system
        logger.info('Download notification triggered', {
          linkId: downloadLink.id,
          ownerEmail: downloadLink.user.email
        });
      }

      // Redirect to the actual file or return download URL
      if (req.query.redirect === 'false') {
        res.json({
          success: true,
          data: {
            download_url: downloadUrl,
            filename,
            remaining_downloads: downloadLink.max_downloads - downloadLink.download_count - 1
          }
        });
      } else {
        res.redirect(downloadUrl);
      }

    } catch (error) {
      logger.error('Error generating download URL:', {
        error: error.message,
        linkId: downloadLink.id,
        downloadType: downloadLink.download_type
      });

      res.status(500).json({
        success: false,
        message: 'Failed to generate download URL'
      });
    }

  } catch (error) {
    logger.error('Error processing download:', {
      error: error.message,
      stack: error.stack,
      token: req.params.token
    });

    res.status(500).json({
      success: false,
      message: 'Failed to process download'
    });
  }
};

/**
 * Get download link info (without processing download)
 */
const getDownloadLinkInfo = async (req, res) => {
  try {
    const { token } = req.params;

    const downloadLink = await DownloadLink.findOne({
      where: { token },
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnail_url', 'duration']
        }
      ],
      attributes: {
        exclude: ['password_hash']
      }
    });

    if (!downloadLink) {
      return res.status(404).json({
        success: false,
        message: 'Download link not found'
      });
    }

    const clientIP = getClientIP(req);
    const canDownload = downloadLink.canDownload(clientIP);

    res.json({
      success: true,
      data: {
        id: downloadLink.id,
        video: downloadLink.video,
        download_type: downloadLink.download_type,
        quality: downloadLink.quality,
        format: downloadLink.format,
        expires_at: downloadLink.expires_at,
        max_downloads: downloadLink.max_downloads,
        download_count: downloadLink.download_count,
        status: downloadLink.status,
        requires_password: !!downloadLink.password_hash,
        requires_auth: downloadLink.require_auth,
        can_download: canDownload.allowed,
        download_reason: canDownload.reason || null,
        remaining_downloads: downloadLink.max_downloads - downloadLink.download_count
      }
    });

  } catch (error) {
    logger.error('Error fetching download link info:', {
      error: error.message,
      token: req.params.token
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch download link info'
    });
  }
};

/**
 * Cleanup expired download links
 */
const cleanupExpiredLinks = async (req, res) => {
  try {
    const updatedCount = await DownloadLink.cleanupExpired();

    logger.info('Expired download links cleaned up', {
      count: updatedCount,
      adminId: req.user.id
    });

    res.json({
      success: true,
      message: `${updatedCount} expired download links cleaned up`
    });

  } catch (error) {
    logger.error('Error cleaning up expired links:', {
      error: error.message,
      adminId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired links'
    });
  }
};

module.exports = {
  createDownloadLink,
  getVideoDownloadLinks,
  getUserDownloadLinks,
  updateDownloadLink,
  deleteDownloadLink,
  processDownload,
  getDownloadLinkInfo,
  cleanupExpiredLinks
};
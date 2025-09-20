const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const bunnyService = require('./BunnyService');

/**
 * Thumbnail Service for Video Thumbnails
 * 
 * Features:
 * - Generate thumbnails from video frames
 * - Custom thumbnail upload
 * - Multiple thumbnail sizes
 * - Automatic thumbnail generation
 * - Social media optimized thumbnails
 */
class ThumbnailService {

  constructor() {
    this.thumbnailSizes = {
      small: { width: 320, height: 180 },
      medium: { width: 640, height: 360 },
      large: { width: 1280, height: 720 },
      social: { width: 1200, height: 630 } // Optimized for social sharing
    };
    
    this.uploadDir = path.join(process.cwd(), 'uploads', 'thumbnails');
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating thumbnail upload directory:', error);
    }
  }

  /**
   * Generate thumbnail from video URL
   */
  async generateFromVideo(videoUrl, timeOffset = 10) {
    try {
      // For Bunny.net videos, we can use their thumbnail generation API
      if (videoUrl.includes('bunnycdn.com') || videoUrl.includes('b-cdn.net')) {
        return await this.generateBunnyThumbnail(videoUrl, timeOffset);
      }
      
      // For other videos, we would need FFmpeg or similar
      // For now, return a placeholder
      return await this.generatePlaceholderThumbnail();
      
    } catch (error) {
      logger.error('Error generating thumbnail from video:', error);
      throw new Error('Failed to generate thumbnail from video');
    }
  }

  /**
   * Generate thumbnail using Bunny.net API
   */
  async generateBunnyThumbnail(videoUrl, timeOffset = 10) {
    try {
      // Extract video ID from Bunny URL
      const videoId = this.extractBunnyVideoId(videoUrl);
      
      if (!videoId) {
        throw new Error('Could not extract video ID from Bunny URL');
      }

      // Generate thumbnail URL with time offset
      const thumbnailUrl = `${videoUrl.replace('.mp4', '')}_${timeOffset}s.jpg`;
      
      // Download and process thumbnail
      const response = await axios.get(thumbnailUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      if (response.status !== 200) {
        throw new Error('Failed to download thumbnail from Bunny');
      }

      const imageBuffer = Buffer.from(response.data);
      
      // Generate multiple sizes
      const thumbnails = await this.generateMultipleSizes(imageBuffer, videoId);
      
      return thumbnails;
      
    } catch (error) {
      logger.error('Error generating Bunny thumbnail:', error);
      // Fallback to placeholder
      return await this.generatePlaceholderThumbnail();
    }
  }

  /**
   * Extract video ID from Bunny.net URL
   */
  extractBunnyVideoId(url) {
    const matches = url.match(/\/([a-f0-9-]{36})\.mp4/i);
    return matches ? matches[1] : null;
  }

  /**
   * Generate multiple thumbnail sizes
   */
  async generateMultipleSizes(imageBuffer, videoId) {
    const thumbnails = {};
    const timestamp = Date.now();
    
    try {
      for (const [sizeName, dimensions] of Object.entries(this.thumbnailSizes)) {
        const filename = `${videoId}_${sizeName}_${timestamp}.jpg`;
        const filepath = path.join(this.uploadDir, filename);
        
        // Resize and optimize image
        const processedBuffer = await sharp(imageBuffer)
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({
            quality: 85,
            progressive: true
          })
          .toBuffer();
        
        // Save to disk
        await fs.writeFile(filepath, processedBuffer);
        
        // Generate URL (in production, upload to CDN)
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const thumbnailUrl = `${baseUrl}/uploads/thumbnails/${filename}`;
        
        thumbnails[sizeName] = {
          url: thumbnailUrl,
          width: dimensions.width,
          height: dimensions.height,
          filename,
          size: processedBuffer.length
        };
      }
      
      return thumbnails;
      
    } catch (error) {
      logger.error('Error generating multiple thumbnail sizes:', error);
      throw error;
    }
  }

  /**
   * Generate placeholder thumbnail
   */
  async generatePlaceholderThumbnail() {
    try {
      const thumbnails = {};
      const timestamp = Date.now();
      const placeholderId = crypto.randomBytes(8).toString('hex');
      
      for (const [sizeName, dimensions] of Object.entries(this.thumbnailSizes)) {
        // Create a simple gradient placeholder
        const placeholderBuffer = await sharp({
          create: {
            width: dimensions.width,
            height: dimensions.height,
            channels: 3,
            background: { r: 45, g: 55, b: 72 }
          }
        })
        .composite([{
          input: Buffer.from(
            `<svg width="${dimensions.width}" height="${dimensions.height}">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grad)" />
              <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(dimensions.width, dimensions.height) * 0.1}" fill="white" text-anchor="middle" dy=".3em">▶</text>
            </svg>`
          ),
          top: 0,
          left: 0
        }])
        .jpeg({ quality: 85 })
        .toBuffer();
        
        const filename = `placeholder_${placeholderId}_${sizeName}_${timestamp}.jpg`;
        const filepath = path.join(this.uploadDir, filename);
        
        await fs.writeFile(filepath, placeholderBuffer);
        
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const thumbnailUrl = `${baseUrl}/uploads/thumbnails/${filename}`;
        
        thumbnails[sizeName] = {
          url: thumbnailUrl,
          width: dimensions.width,
          height: dimensions.height,
          filename,
          size: placeholderBuffer.length,
          isPlaceholder: true
        };
      }
      
      return thumbnails;
      
    } catch (error) {
      logger.error('Error generating placeholder thumbnail:', error);
      throw error;
    }
  }

  /**
   * Upload custom thumbnail
   */
  async uploadCustomThumbnail(imageBuffer, videoId, userId) {
    try {
      // Validate image
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image file');
      }

      // Check file size (max 5MB)
      if (imageBuffer.length > 5 * 1024 * 1024) {
        throw new Error('Image file too large (max 5MB)');
      }

      // Generate thumbnails
      const thumbnails = await this.generateMultipleSizes(imageBuffer, videoId);
      
      // Log upload
      logger.info('Custom thumbnail uploaded', {
        videoId,
        userId,
        originalSize: imageBuffer.length,
        generatedSizes: Object.keys(thumbnails).length
      });
      
      return thumbnails;
      
    } catch (error) {
      logger.error('Error uploading custom thumbnail:', error);
      throw error;
    }
  }

  /**
   * Delete thumbnail files
   */
  async deleteThumbnails(thumbnails) {
    try {
      const deletePromises = Object.values(thumbnails).map(async (thumbnail) => {
        if (thumbnail.filename) {
          const filepath = path.join(this.uploadDir, thumbnail.filename);
          try {
            await fs.unlink(filepath);
          } catch (error) {
            // File might not exist, ignore error
            logger.warn('Could not delete thumbnail file:', filepath);
          }
        }
      });
      
      await Promise.all(deletePromises);
      
    } catch (error) {
      logger.error('Error deleting thumbnails:', error);
    }
  }

  /**
   * Get thumbnail for social sharing
   */
  getSocialThumbnail(thumbnails) {
    // Prefer social size, fallback to large, then medium
    return thumbnails.social || thumbnails.large || thumbnails.medium || thumbnails.small;
  }

  /**
   * Get responsive thumbnail URLs
   */
  getResponsiveThumbnails(thumbnails) {
    const responsive = [];
    
    Object.entries(thumbnails).forEach(([size, thumbnail]) => {
      if (!thumbnail.isPlaceholder) {
        responsive.push({
          url: thumbnail.url,
          width: thumbnail.width,
          height: thumbnail.height,
          size: size
        });
      }
    });
    
    return responsive;
  }

  /**
   * Generate thumbnail from time offset
   */
  async generateAtTime(videoUrl, timeOffset) {
    try {
      return await this.generateFromVideo(videoUrl, timeOffset);
    } catch (error) {
      logger.error('Error generating thumbnail at time:', error);
      return await this.generatePlaceholderThumbnail();
    }
  }

  /**
   * Optimize existing thumbnail
   */
  async optimizeThumbnail(thumbnailPath) {
    try {
      const imageBuffer = await fs.readFile(thumbnailPath);
      
      const optimizedBuffer = await sharp(imageBuffer)
        .jpeg({
          quality: 85,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
      
      await fs.writeFile(thumbnailPath, optimizedBuffer);
      
      return {
        originalSize: imageBuffer.length,
        optimizedSize: optimizedBuffer.length,
        savings: imageBuffer.length - optimizedBuffer.length
      };
      
    } catch (error) {
      logger.error('Error optimizing thumbnail:', error);
      throw error;
    }
  }

  /**
   * Get thumbnail statistics
   */
  async getThumbnailStats(userId) {
    try {
      // This would typically query the database
      // For now, return mock data
      return {
        totalThumbnails: 0,
        totalSize: 0,
        customThumbnails: 0,
        generatedThumbnails: 0
      };
    } catch (error) {
      logger.error('Error getting thumbnail stats:', error);
      throw error;
    }
  }
}

module.exports = new ThumbnailService();
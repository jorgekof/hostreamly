const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

class BunnyService {
  constructor() {
    this.apiKey = process.env.BUNNY_API_KEY;
    this.storageApiKey = process.env.BUNNY_STORAGE_API_KEY;
    this.streamApiKey = process.env.BUNNY_STREAM_API_KEY;
    this.libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    this.collectionId = process.env.BUNNY_STREAM_COLLECTION_ID;
    this.cdnHostname = process.env.BUNNY_CDN_HOSTNAME;
    this.storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
    this.storageRegion = process.env.BUNNY_STORAGE_REGION || 'de';
    
    // API endpoints
    this.streamBaseUrl = 'https://video.bunnycdn.com';
    this.apiBaseUrl = 'https://api.bunny.net';
    this.storageBaseUrl = `https://${this.storageRegion}.storage.bunnycdn.com`;
    
    // Initialize HTTP clients
    this.streamClient = axios.create({
      baseURL: this.streamBaseUrl,
      headers: {
        'AccessKey': this.streamApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    this.apiClient = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'AccessKey': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    this.storageClient = axios.create({
      baseURL: this.storageBaseUrl,
      headers: {
        'AccessKey': this.storageApiKey
      },
      timeout: 60000
    });
    
    // Add response interceptors for logging
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    // Stream API interceptor
    this.streamClient.interceptors.response.use(
      (response) => {
        logger.bunnynet('stream_api_success', 'success', {
          method: response.config.method,
          url: response.config.url,
          status: response.status
        });
        return response;
      },
      (error) => {
        logger.bunnynet('stream_api_error', 'error', {
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        throw error;
      }
    );
    
    // API interceptor
    this.apiClient.interceptors.response.use(
      (response) => {
        logger.bunnynet('api_success', 'success', {
          method: response.config.method,
          url: response.config.url,
          status: response.status
        });
        return response;
      },
      (error) => {
        logger.bunnynet('api_error', 'error', {
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        throw error;
      }
    );
  }
  
  // Stream API Methods
  
  /**
   * Create a new video in Bunny Stream
   */
  async createVideo(title, collectionId = null) {
    try {
      const response = await this.streamClient.post(`/library/${this.libraryId}/videos`, {
        title,
        collectionId: collectionId || this.collectionId
      });
      
      logger.bunnynet('video_created', 'success', {
        videoId: response.data.guid,
        title
      });
      
      return response.data;
    } catch (error) {
      logger.bunnynet('video_creation_failed', 'error', {
        title,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Upload video file to Bunny Stream
   */
  async uploadVideo(videoId, filePath) {
    try {
      const fileStream = fs.createReadStream(filePath);
      const fileSize = fs.statSync(filePath).size;
      
      const response = await this.streamClient.put(
        `/library/${this.libraryId}/videos/${videoId}`,
        fileStream,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileSize
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 300000 // 5 minutes
        }
      );
      
      logger.bunnynet('video_uploaded', 'success', {
        videoId,
        fileSize,
        filePath: path.basename(filePath)
      });
      
      return response.data;
    } catch (error) {
      logger.bunnynet('video_upload_failed', 'error', {
        videoId,
        filePath: path.basename(filePath),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get video embed URL for Bunny Stream
   */
  getVideoEmbedUrl(videoId) {
    return `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}`;
  }

  /**
   * Get video thumbnail URL
   */
  getVideoThumbnailUrl(videoId, width = 1280, height = 720) {
    return `https://vz-${this.libraryId.substring(0, 8)}.b-cdn.net/${videoId}/thumbnail.jpg?width=${width}&height=${height}`;
  }

  /**
   * Get video direct play URL (for custom player)
   */
  getVideoPlayUrl(videoId) {
    return `https://vz-${this.libraryId.substring(0, 8)}.b-cdn.net/${videoId}/playlist.m3u8`;
  }
  
  /**
   * Get video information
   */
  async getVideo(videoId) {
    try {
      const cacheKey = `bunny:video:${videoId}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const response = await this.streamClient.get(`/library/${this.libraryId}/videos/${videoId}`);
      
      // Cache for 5 minutes
      await cache.set(cacheKey, response.data, 300);
      
      return response.data;
    } catch (error) {
      logger.bunnynet('get_video_failed', 'error', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Update video metadata
   */
  async updateVideo(videoId, updates) {
    try {
      const response = await this.streamClient.post(
        `/library/${this.libraryId}/videos/${videoId}`,
        updates
      );
      
      // Invalidate cache
      await cache.del(`bunny:video:${videoId}`);
      
      logger.bunnynet('video_updated', 'success', {
        videoId,
        updates: Object.keys(updates)
      });
      
      return response.data;
    } catch (error) {
      logger.bunnynet('video_update_failed', 'error', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Delete video from Bunny Stream
   */
  async deleteVideo(videoId) {
    try {
      await this.streamClient.delete(`/library/${this.libraryId}/videos/${videoId}`);
      
      // Invalidate cache
      await cache.del(`bunny:video:${videoId}`);
      
      logger.bunnynet('video_deleted', 'success', { videoId });
      
      return true;
    } catch (error) {
      logger.bunnynet('video_deletion_failed', 'error', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get video statistics
   */
  async getVideoStatistics(videoId, dateFrom = null, dateTo = null) {
    try {
      const params = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      
      const response = await this.streamClient.get(
        `/library/${this.libraryId}/videos/${videoId}/statistics`,
        { params }
      );
      
      return response.data;
    } catch (error) {
      logger.bunnynet('get_video_statistics_failed', 'error', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Generate signed URL for video playback
   */
  generateSignedUrl(videoId, expirationTime = 3600, userIp = null) {
    try {
      const securityKey = process.env.BUNNY_STREAM_WEBHOOK_SECRET;
      const expires = Math.floor(Date.now() / 1000) + expirationTime;
      
      let authString = `${this.libraryId}${securityKey}${expires}${videoId}`;
      if (userIp) {
        authString += userIp;
      }
      
      const hash = crypto.createHash('sha256').update(authString).digest('hex');
      
      const baseUrl = `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}`;
      const signedUrl = `${baseUrl}?token=${hash}&expires=${expires}`;
      
      if (userIp) {
        signedUrl += `&ip=${userIp}`;
      }
      
      return signedUrl;
    } catch (error) {
      logger.bunnynet('signed_url_generation_failed', 'error', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }
  
  // CDN API Methods
  
  /**
   * Purge CDN cache for specific URLs
   */
  async purgeCdnCache(urls) {
    try {
      const urlArray = Array.isArray(urls) ? urls : [urls];
      
      const response = await this.apiClient.post('/purge', {
        url: urlArray
      });
      
      logger.bunnynet('cdn_cache_purged', 'success', {
        urls: urlArray,
        count: urlArray.length
      });
      
      return response.data;
    } catch (error) {
      logger.bunnynet('cdn_cache_purge_failed', 'error', {
        urls,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get CDN statistics
   */
  async getCdnStatistics(dateFrom, dateTo, pullZoneId = null) {
    try {
      const params = {
        dateFrom,
        dateTo
      };
      
      if (pullZoneId) {
        params.pullZone = pullZoneId;
      }
      
      const response = await this.apiClient.get('/statistics', { params });
      
      return response.data;
    } catch (error) {
      logger.bunnynet('get_cdn_statistics_failed', 'error', {
        dateFrom,
        dateTo,
        error: error.message
      });
      throw error;
    }
  }
  
  // Storage API Methods
  
  /**
   * Upload file to Bunny Storage
   */
  async uploadToStorage(filePath, remotePath) {
    try {
      const fileStream = fs.createReadStream(filePath);
      const fileSize = fs.statSync(filePath).size;
      
      const response = await this.storageClient.put(
        `/${this.storageZoneName}/${remotePath}`,
        fileStream,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileSize
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      logger.bunnynet('file_uploaded_to_storage', 'success', {
        filePath: path.basename(filePath),
        remotePath,
        fileSize
      });
      
      return {
        success: true,
        url: `https://${this.cdnHostname}/${remotePath}`,
        size: fileSize
      };
    } catch (error) {
      logger.bunnynet('storage_upload_failed', 'error', {
        filePath: path.basename(filePath),
        remotePath,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Delete file from Bunny Storage
   */
  async deleteFromStorage(remotePath) {
    try {
      await this.storageClient.delete(`/${this.storageZoneName}/${remotePath}`);
      
      logger.bunnynet('file_deleted_from_storage', 'success', {
        remotePath
      });
      
      return true;
    } catch (error) {
      logger.bunnynet('storage_deletion_failed', 'error', {
        remotePath,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * List files in storage directory
   */
  async listStorageFiles(directory = '') {
    try {
      const response = await this.storageClient.get(
        `/${this.storageZoneName}/${directory}`
      );
      
      return response.data;
    } catch (error) {
      logger.bunnynet('storage_list_failed', 'error', {
        directory,
        error: error.message
      });
      throw error;
    }
  }
  
  // DRM Methods
  
  /**
   * Enable DRM for video
   */
  async enableDrm(videoId, drmConfig = {}) {
    try {
      const config = {
        enableDRM: true,
        enableMP4Fallback: false,
        ...drmConfig
      };
      
      const response = await this.updateVideo(videoId, config);
      
      logger.bunnynet('drm_enabled', 'success', {
        videoId,
        config
      });
      
      return response;
    } catch (error) {
      logger.bunnynet('drm_enable_failed', 'error', {
        videoId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Generate DRM license URL
   */
  generateDrmLicenseUrl(videoId, userId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const token = crypto
      .createHash('sha256')
      .update(`${videoId}${userId}${timestamp}${process.env.DRM_ENCRYPTION_KEY}`)
      .digest('hex');
    
    return `${process.env.DRM_KEY_SERVER_URL}/license?video=${videoId}&user=${userId}&token=${token}&ts=${timestamp}`;
  }
  
  // Utility Methods
  
  /**
   * Get video embed code
   */
  getEmbedCode(videoId, options = {}) {
    const {
      width = 640,
      height = 360,
      autoplay = false,
      controls = true,
      responsive = true
    } = options;
    
    const params = new URLSearchParams();
    if (autoplay) params.append('autoplay', 'true');
    if (!controls) params.append('controls', 'false');
    
    const src = `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}?${params.toString()}`;
    
    if (responsive) {
      return `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
          <iframe src="${src}" 
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                  allowfullscreen>
          </iframe>
        </div>
      `;
    }
    
    return `<iframe src="${src}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
  }
  
  /**
   * Get video thumbnail URL
   */
  getThumbnailUrl(videoId, width = 1280, height = 720) {
    return `https://vz-${this.libraryId}.b-cdn.net/${videoId}/thumbnail.jpg?width=${width}&height=${height}`;
  }
  
  /**
   * Get video preview URL
   */
  getPreviewUrl(videoId) {
    return `https://vz-${this.libraryId}.b-cdn.net/${videoId}/preview.webp`;
  }
  
  /**
   * Get HLS streaming URL
   */
  getHlsUrl(videoId) {
    return `https://vz-${this.libraryId}.b-cdn.net/${videoId}/playlist.m3u8`;
  }
  
  /**
   * Get MP4 direct URL
   */
  getMp4Url(videoId, resolution = 'original') {
    return `https://vz-${this.libraryId}.b-cdn.net/${videoId}/play_${resolution}.mp4`;
  }
}

module.exports = new BunnyService();
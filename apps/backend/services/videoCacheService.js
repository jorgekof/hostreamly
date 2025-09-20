const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const Video = require('../models/Video');
const User = require('../models/User');

/**
 * Video Cache Service
 * Optimizes frequent video queries using Redis cache
 */
class VideoCacheService {
  constructor() {
    this.defaultTTL = 300; // 5 minutes
    this.popularVideosTTL = 600; // 10 minutes
    this.userVideosTTL = 180; // 3 minutes
    this.searchTTL = 120; // 2 minutes
  }

  /**
   * Generate cache key for different query types
   */
  generateKey(type, params = {}) {
    switch (type) {
      case 'video_by_id':
        return `video:${params.id}`;
      case 'video_by_slug':
        return `video:slug:${params.slug}`;
      case 'public_videos':
        return `videos:public:${params.limit}:${params.offset}:${params.orderBy}:${params.orderDir}`;
      case 'user_videos':
        return `videos:user:${params.userId}:${params.limit}:${params.offset}`;
      case 'popular_videos':
        return `videos:popular:${params.limit}:${params.days}`;
      case 'search_videos':
        return `videos:search:${Buffer.from(params.query).toString('base64')}:${params.limit}:${params.offset}`;
      case 'video_analytics':
        return `analytics:video:${params.videoId}`;
      case 'user_video_count':
        return `count:user_videos:${params.userId}`;
      default:
        throw new Error(`Unknown cache key type: ${type}`);
    }
  }

  /**
   * Get video by ID with caching
   */
  async getVideoById(id, includeUser = true) {
    try {
      const cacheKey = this.generateKey('video_by_id', { id });
      let video = await cache.get(cacheKey);

      if (!video) {
        const options = {
          where: { id }
        };

        if (includeUser) {
          options.include = [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
          }];
        }

        video = await Video.findOne(options);
        
        if (video) {
          await cache.set(cacheKey, video, this.defaultTTL);
          logger.debug('Video cached by ID', { videoId: id });
        }
      } else {
        logger.debug('Video retrieved from cache by ID', { videoId: id });
      }

      return video;
    } catch (error) {
      logger.error('Error getting video by ID from cache:', error);
      // Fallback to direct database query
      return await Video.findByPk(id);
    }
  }

  /**
   * Get video by slug with caching
   */
  async getVideoBySlug(slug) {
    try {
      const cacheKey = this.generateKey('video_by_slug', { slug });
      let video = await cache.get(cacheKey);

      if (!video) {
        video = await Video.findBySlug(slug);
        
        if (video) {
          await cache.set(cacheKey, video, this.defaultTTL);
          logger.debug('Video cached by slug', { slug });
        }
      } else {
        logger.debug('Video retrieved from cache by slug', { slug });
      }

      return video;
    } catch (error) {
      logger.error('Error getting video by slug from cache:', error);
      return await Video.findBySlug(slug);
    }
  }

  /**
   * Get public videos with caching
   */
  async getPublicVideos(limit = 20, offset = 0, orderBy = 'created_at', orderDir = 'DESC') {
    try {
      const cacheKey = this.generateKey('public_videos', { limit, offset, orderBy, orderDir });
      let result = await cache.get(cacheKey);

      if (!result) {
        result = await Video.getPublicVideos(limit, offset, orderBy, orderDir);
        
        if (result) {
          await cache.set(cacheKey, result, this.defaultTTL);
          logger.debug('Public videos cached', { limit, offset, orderBy, orderDir });
        }
      } else {
        logger.debug('Public videos retrieved from cache', { limit, offset });
      }

      return result;
    } catch (error) {
      logger.error('Error getting public videos from cache:', error);
      return await Video.getPublicVideos(limit, offset, orderBy, orderDir);
    }
  }

  /**
   * Get user videos with caching
   */
  async getUserVideos(userId, limit = 20, offset = 0) {
    try {
      const cacheKey = this.generateKey('user_videos', { userId, limit, offset });
      let result = await cache.get(cacheKey);

      if (!result) {
        result = await Video.getUserVideos(userId, limit, offset);
        
        if (result) {
          await cache.set(cacheKey, result, this.userVideosTTL);
          logger.debug('User videos cached', { userId, limit, offset });
        }
      } else {
        logger.debug('User videos retrieved from cache', { userId, limit, offset });
      }

      return result;
    } catch (error) {
      logger.error('Error getting user videos from cache:', error);
      return await Video.getUserVideos(userId, limit, offset);
    }
  }

  /**
   * Get popular videos with caching
   */
  async getPopularVideos(limit = 20, days = 7) {
    try {
      const cacheKey = this.generateKey('popular_videos', { limit, days });
      let result = await cache.get(cacheKey);

      if (!result) {
        result = await Video.getPopularVideos(limit, days);
        
        if (result) {
          await cache.set(cacheKey, result, this.popularVideosTTL);
          logger.debug('Popular videos cached', { limit, days });
        }
      } else {
        logger.debug('Popular videos retrieved from cache', { limit, days });
      }

      return result;
    } catch (error) {
      logger.error('Error getting popular videos from cache:', error);
      return await Video.getPopularVideos(limit, days);
    }
  }

  /**
   * Search videos with caching
   */
  async searchVideos(query, limit = 20, offset = 0) {
    try {
      const cacheKey = this.generateKey('search_videos', { query, limit, offset });
      let result = await cache.get(cacheKey);

      if (!result) {
        result = await Video.searchVideos(query, limit, offset);
        
        if (result) {
          await cache.set(cacheKey, result, this.searchTTL);
          logger.debug('Search results cached', { query, limit, offset });
        }
      } else {
        logger.debug('Search results retrieved from cache', { query, limit, offset });
      }

      return result;
    } catch (error) {
      logger.error('Error searching videos from cache:', error);
      return await Video.searchVideos(query, limit, offset);
    }
  }

  /**
   * Get video analytics with caching
   */
  async getVideoAnalytics(videoId) {
    try {
      const cacheKey = this.generateKey('video_analytics', { videoId });
      let analytics = await cache.get(cacheKey);

      if (!analytics) {
        const video = await Video.findByPk(videoId);
        
        if (video) {
          analytics = video.getAnalytics();
          await cache.set(cacheKey, analytics, 60); // Cache for 1 minute
          logger.debug('Video analytics cached', { videoId });
        }
      } else {
        logger.debug('Video analytics retrieved from cache', { videoId });
      }

      return analytics;
    } catch (error) {
      logger.error('Error getting video analytics from cache:', error);
      const video = await Video.findByPk(videoId);
      return video ? video.getAnalytics() : null;
    }
  }

  /**
   * Get user video count with caching
   */
  async getUserVideoCount(userId) {
    try {
      const cacheKey = this.generateKey('user_video_count', { userId });
      let count = await cache.get(cacheKey);

      if (count === null) {
        count = await Video.count({ where: { user_id: userId } });
        await cache.set(cacheKey, count, this.userVideosTTL);
        logger.debug('User video count cached', { userId, count });
      } else {
        logger.debug('User video count retrieved from cache', { userId, count });
      }

      return count;
    } catch (error) {
      logger.error('Error getting user video count from cache:', error);
      return await Video.count({ where: { user_id: userId } });
    }
  }

  /**
   * Invalidate cache for a specific video
   */
  async invalidateVideo(videoId, slug = null) {
    try {
      const keys = [
        this.generateKey('video_by_id', { id: videoId })
      ];

      if (slug) {
        keys.push(this.generateKey('video_by_slug', { slug }));
      }

      await cache.del(keys);
      logger.debug('Video cache invalidated', { videoId, slug });
    } catch (error) {
      logger.error('Error invalidating video cache:', error);
    }
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserVideos(userId) {
    try {
      const pattern = `videos:user:${userId}:*`;
      const countKey = this.generateKey('user_video_count', { userId });
      
      await cache.delPattern(pattern);
      await cache.del(countKey);
      
      logger.debug('User videos cache invalidated', { userId });
    } catch (error) {
      logger.error('Error invalidating user videos cache:', error);
    }
  }

  /**
   * Invalidate public videos cache
   */
  async invalidatePublicVideos() {
    try {
      const pattern = 'videos:public:*';
      await cache.delPattern(pattern);
      logger.debug('Public videos cache invalidated');
    } catch (error) {
      logger.error('Error invalidating public videos cache:', error);
    }
  }

  /**
   * Invalidate popular videos cache
   */
  async invalidatePopularVideos() {
    try {
      const pattern = 'videos:popular:*';
      await cache.delPattern(pattern);
      logger.debug('Popular videos cache invalidated');
    } catch (error) {
      logger.error('Error invalidating popular videos cache:', error);
    }
  }

  /**
   * Invalidate search cache
   */
  async invalidateSearchCache() {
    try {
      const pattern = 'videos:search:*';
      await cache.delPattern(pattern);
      logger.debug('Search cache invalidated');
    } catch (error) {
      logger.error('Error invalidating search cache:', error);
    }
  }

  /**
   * Warm up cache with popular content
   */
  async warmUpCache() {
    try {
      logger.info('Starting cache warm-up...');
      
      // Warm up popular videos
      await this.getPopularVideos(20, 7);
      await this.getPopularVideos(50, 30);
      
      // Warm up recent public videos
      await this.getPublicVideos(20, 0, 'created_at', 'DESC');
      await this.getPublicVideos(20, 0, 'view_count', 'DESC');
      
      logger.info('Cache warm-up completed');
    } catch (error) {
      logger.error('Error during cache warm-up:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const patterns = [
        'video:*',
        'videos:*',
        'analytics:*',
        'count:*'
      ];
      
      const stats = {};
      
      for (const pattern of patterns) {
        const keys = await cache.keys(pattern);
        stats[pattern] = keys.length;
      }
      
      return stats;
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {};
    }
  }
}

module.exports = new VideoCacheService();
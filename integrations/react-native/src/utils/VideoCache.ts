/**
 * Video Cache Manager
 * Handles video caching, offline storage, and cache management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';

import {
  CacheConfig,
  HostreamlyVideo,
  VideoMetadata,
  CachedVideo,
  CacheStats,
  BunnyVaultError,
} from '../types';
import {
  CACHE_CONFIG,
  STORAGE_KEYS,
  ERROR_CODES,
} from '../constants';

/**
 * Video Cache Manager Class
 */
export class VideoCache {
  private config: CacheConfig;
  private cacheDir: string;
  private isInitialized: boolean = false;
  private cacheIndex: Map<string, CachedVideo> = new Map();
  private downloadQueue: Map<string, Promise<void>> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = {
      ...CACHE_CONFIG,
      ...config,
    };

    // Set cache directory
    this.cacheDir = `${RNFS.CachesDirectoryPath}/bunnyvault-videos`;
  }

  /**
   * Initialize cache system
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing VideoCache...');

      // Create cache directory if it doesn't exist
      const dirExists = await RNFS.exists(this.cacheDir);
      if (!dirExists) {
        await RNFS.mkdir(this.cacheDir);
      }

      // Load cache index from storage
      await this.loadCacheIndex();

      // Validate cached files
      await this.validateCachedFiles();

      // Start periodic cleanup if enabled
      if (this.config.enablePeriodicCleanup) {
        this.startPeriodicCleanup();
      }

      // Perform initial cleanup if needed
      await this.performCleanupIfNeeded();

      this.isInitialized = true;
      console.log('VideoCache initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VideoCache:', error);
      throw new BunnyVaultError(
        'Failed to initialize video cache',
        ERROR_CODES.CACHE_ERROR,
        error
      );
    }
  }

  /**
   * Load cache index from storage
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_INDEX);
      if (indexData) {
        const parsedIndex = JSON.parse(indexData);
        this.cacheIndex = new Map(Object.entries(parsedIndex));
        console.log(`Loaded ${this.cacheIndex.size} cached videos from index`);
      }
    } catch (error) {
      console.warn('Failed to load cache index:', error);
      this.cacheIndex = new Map();
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexObject = Object.fromEntries(this.cacheIndex);
      await AsyncStorage.setItem(STORAGE_KEYS.CACHE_INDEX, JSON.stringify(indexObject));
    } catch (error) {
      console.warn('Failed to save cache index:', error);
    }
  }

  /**
   * Validate cached files exist on disk
   */
  private async validateCachedFiles(): Promise<void> {
    const invalidEntries: string[] = [];

    for (const [videoId, cachedVideo] of this.cacheIndex) {
      try {
        const exists = await RNFS.exists(cachedVideo.filePath);
        if (!exists) {
          console.warn(`Cached file not found: ${cachedVideo.filePath}`);
          invalidEntries.push(videoId);
        }
      } catch (error) {
        console.warn(`Error validating cached file for ${videoId}:`, error);
        invalidEntries.push(videoId);
      }
    }

    // Remove invalid entries
    for (const videoId of invalidEntries) {
      this.cacheIndex.delete(videoId);
    }

    if (invalidEntries.length > 0) {
      console.log(`Removed ${invalidEntries.length} invalid cache entries`);
      await this.saveCacheIndex();
    }
  }

  /**
   * Check if video is cached
   */
  isCached(videoId: string): boolean {
    return this.cacheIndex.has(videoId);
  }

  /**
   * Get cached video info
   */
  getCachedVideo(videoId: string): CachedVideo | null {
    return this.cacheIndex.get(videoId) || null;
  }

  /**
   * Get cached video file path
   */
  getCachedVideoPath(videoId: string): string | null {
    const cachedVideo = this.cacheIndex.get(videoId);
    return cachedVideo ? cachedVideo.filePath : null;
  }

  /**
   * Cache video from URL
   */
  async cacheVideo(
    video: BunnyVaultVideo,
    streamUrl: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new BunnyVaultError(
        'VideoCache not initialized',
        ERROR_CODES.CACHE_ERROR
      );
    }

    // Check if already cached
    if (this.isCached(video.id)) {
      console.log(`Video ${video.id} is already cached`);
      return;
    }

    // Check if download is already in progress
    if (this.downloadQueue.has(video.id)) {
      console.log(`Video ${video.id} is already being downloaded`);
      return this.downloadQueue.get(video.id);
    }

    // Check cache size limits
    await this.performCleanupIfNeeded();

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new BunnyVaultError(
        'No network connection available for caching',
        ERROR_CODES.NETWORK_ERROR
      );
    }

    // Start download
    const downloadPromise = this.downloadVideo(video, streamUrl, priority);
    this.downloadQueue.set(video.id, downloadPromise);

    try {
      await downloadPromise;
    } finally {
      this.downloadQueue.delete(video.id);
    }
  }

  /**
   * Download video file
   */
  private async downloadVideo(
    video: BunnyVaultVideo,
    streamUrl: string,
    priority: 'high' | 'normal' | 'low'
  ): Promise<void> {
    const fileName = `${video.id}.mp4`;
    const filePath = `${this.cacheDir}/${fileName}`;
    const tempPath = `${filePath}.tmp`;

    try {
      console.log(`Starting download for video ${video.id}`);

      // Download file to temporary location
      const downloadResult = await RNFS.downloadFile({
        fromUrl: streamUrl,
        toFile: tempPath,
        background: priority !== 'high',
        discretionary: priority === 'low',
        cacheable: false,
        progressDivider: 10,
        begin: (res) => {
          console.log(`Download started for ${video.id}:`, res);
        },
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Download progress for ${video.id}: ${progress.toFixed(1)}%`);
        },
      }).promise;

      if (downloadResult.statusCode === 200) {
        // Move from temp to final location
        await RNFS.moveFile(tempPath, filePath);

        // Get file stats
        const fileStats = await RNFS.stat(filePath);

        // Create cache entry
        const cachedVideo: CachedVideo = {
          videoId: video.id,
          filePath,
          fileSize: fileStats.size,
          cachedAt: Date.now(),
          lastAccessed: Date.now(),
          downloadTime: Date.now(),
          quality: 'auto', // TODO: Extract from video metadata
          metadata: {
            title: video.title,
            duration: video.duration,
            thumbnailUrl: video.thumbnailUrl,
          },
        };

        // Add to cache index
        this.cacheIndex.set(video.id, cachedVideo);
        await this.saveCacheIndex();

        console.log(`Video ${video.id} cached successfully (${fileStats.size} bytes)`);
      } else {
        throw new Error(`Download failed with status code: ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error(`Failed to download video ${video.id}:`, error);

      // Clean up temp file if it exists
      try {
        const tempExists = await RNFS.exists(tempPath);
        if (tempExists) {
          await RNFS.unlink(tempPath);
        }
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError);
      }

      throw new BunnyVaultError(
        `Failed to cache video: ${error.message}`,
        ERROR_CODES.CACHE_ERROR,
        error
      );
    }
  }

  /**
   * Remove video from cache
   */
  async removeCachedVideo(videoId: string): Promise<void> {
    const cachedVideo = this.cacheIndex.get(videoId);
    if (!cachedVideo) {
      console.warn(`Video ${videoId} is not cached`);
      return;
    }

    try {
      // Delete file from disk
      const exists = await RNFS.exists(cachedVideo.filePath);
      if (exists) {
        await RNFS.unlink(cachedVideo.filePath);
      }

      // Remove from cache index
      this.cacheIndex.delete(videoId);
      await this.saveCacheIndex();

      console.log(`Video ${videoId} removed from cache`);
    } catch (error) {
      console.error(`Failed to remove cached video ${videoId}:`, error);
      throw new BunnyVaultError(
        `Failed to remove cached video: ${error.message}`,
        ERROR_CODES.CACHE_ERROR,
        error
      );
    }
  }

  /**
   * Update last accessed time for cached video
   */
  async updateLastAccessed(videoId: string): Promise<void> {
    const cachedVideo = this.cacheIndex.get(videoId);
    if (cachedVideo) {
      cachedVideo.lastAccessed = Date.now();
      this.cacheIndex.set(videoId, cachedVideo);
      await this.saveCacheIndex();
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    let totalSize = 0;
    let oldestCacheTime = Date.now();
    let newestCacheTime = 0;

    for (const cachedVideo of this.cacheIndex.values()) {
      totalSize += cachedVideo.fileSize;
      oldestCacheTime = Math.min(oldestCacheTime, cachedVideo.cachedAt);
      newestCacheTime = Math.max(newestCacheTime, cachedVideo.cachedAt);
    }

    return {
      totalVideos: this.cacheIndex.size,
      totalSize,
      maxSize: this.config.maxCacheSize,
      usagePercentage: (totalSize / this.config.maxCacheSize) * 100,
      oldestCacheTime: oldestCacheTime === Date.now() ? null : oldestCacheTime,
      newestCacheTime: newestCacheTime === 0 ? null : newestCacheTime,
      activeDownloads: this.downloadQueue.size,
    };
  }

  /**
   * Get list of cached videos
   */
  getCachedVideosList(): CachedVideo[] {
    return Array.from(this.cacheIndex.values());
  }

  /**
   * Perform cleanup if needed
   */
  private async performCleanupIfNeeded(): Promise<void> {
    const stats = await this.getCacheStats();
    
    // Check if cleanup is needed
    if (stats.usagePercentage > 90 || stats.totalVideos > this.config.maxCachedVideos) {
      console.log('Cache cleanup needed:', stats);
      await this.performCleanup();
    }
  }

  /**
   * Perform cache cleanup
   */
  private async performCleanup(): Promise<void> {
    console.log('Starting cache cleanup...');

    // Get sorted list of cached videos (oldest first, least accessed first)
    const cachedVideos = Array.from(this.cacheIndex.values()).sort((a, b) => {
      // First sort by last accessed time
      const accessDiff = a.lastAccessed - b.lastAccessed;
      if (accessDiff !== 0) return accessDiff;
      
      // Then by cache time
      return a.cachedAt - b.cachedAt;
    });

    const targetSize = this.config.maxCacheSize * 0.8; // Clean to 80% of max size
    let currentSize = cachedVideos.reduce((sum, video) => sum + video.fileSize, 0);
    let removedCount = 0;

    // Remove videos until we're under the target size
    for (const cachedVideo of cachedVideos) {
      if (currentSize <= targetSize && this.cacheIndex.size <= this.config.maxCachedVideos) {
        break;
      }

      try {
        await this.removeCachedVideo(cachedVideo.videoId);
        currentSize -= cachedVideo.fileSize;
        removedCount++;
      } catch (error) {
        console.warn(`Failed to remove cached video during cleanup:`, error);
      }
    }

    console.log(`Cache cleanup completed: removed ${removedCount} videos`);
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.performCleanupIfNeeded();
      } catch (error) {
        console.error('Periodic cleanup failed:', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Stop periodic cleanup
   */
  private stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Clear all cached videos
   */
  async clearCache(): Promise<void> {
    console.log('Clearing all cached videos...');

    // Cancel any ongoing downloads
    this.downloadQueue.clear();

    // Remove all cached files
    const cachedVideos = Array.from(this.cacheIndex.keys());
    for (const videoId of cachedVideos) {
      try {
        await this.removeCachedVideo(videoId);
      } catch (error) {
        console.warn(`Failed to remove cached video ${videoId}:`, error);
      }
    }

    console.log('Cache cleared successfully');
  }

  /**
   * Cleanup and destroy cache instance
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up VideoCache...');

    // Stop periodic cleanup
    this.stopPeriodicCleanup();

    // Cancel ongoing downloads
    this.downloadQueue.clear();

    // Save final cache index
    await this.saveCacheIndex();

    // Reset state
    this.isInitialized = false;
    this.cacheIndex.clear();

    console.log('VideoCache cleanup completed');
  }

  /**
   * Pre-cache videos for offline viewing
   */
  async precacheVideos(
    videos: BunnyVaultVideo[],
    getStreamUrl: (videoId: string) => Promise<string>
  ): Promise<void> {
    console.log(`Pre-caching ${videos.length} videos...`);

    const promises = videos.map(async (video) => {
      try {
        if (!this.isCached(video.id)) {
          const streamUrl = await getStreamUrl(video.id);
          await this.cacheVideo(video, streamUrl, 'low');
        }
      } catch (error) {
        console.warn(`Failed to pre-cache video ${video.id}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('Pre-caching completed');
  }
}

export default VideoCache;
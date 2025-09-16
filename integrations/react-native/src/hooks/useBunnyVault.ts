/**
 * useBunnyVault Hook
 * Main hook for accessing BunnyVault SDK functionality
 */

import { useContext, useCallback, useMemo } from 'react';
import { BunnyVaultContext } from '../providers/BunnyVaultProvider';
import {
  UseBunnyVaultReturn,
  BunnyVaultVideo,
  GetVideosParams,
  SearchParams,
  BunnyVaultError,
  APIResponse,
} from '../types';
import { ERROR_CODES } from '../constants';

/**
 * Main hook for accessing BunnyVault SDK functionality
 * Provides access to API, analytics, cache, and utility functions
 */
export const useBunnyVault = (): UseBunnyVaultReturn => {
  const context = useContext(BunnyVaultContext);
  
  if (!context) {
    throw new BunnyVaultError(
      'useBunnyVault must be used within a BunnyVaultProvider',
      ERROR_CODES.INITIALIZATION_ERROR
    );
  }
  
  const { api, analytics, cache, isOnline, isInitialized } = context;
  
  /**
   * Get a single video by ID
   * Checks cache first, then API, with offline fallback
   */
  const getVideo = useCallback(async (videoId: string): Promise<BunnyVaultVideo | null> => {
    try {
      // Validate video ID
      if (!videoId || typeof videoId !== 'string') {
        throw new BunnyVaultError(
          'Invalid video ID provided',
          ERROR_CODES.CONFIGURATION_ERROR
        );
      }
      
      // Check cache first
      const cachedVideo = await cache.getVideo(videoId);
      if (cachedVideo) {
        return cachedVideo;
      }
      
      // If offline and no cache, return null
      if (!isOnline) {
        console.warn(`Video ${videoId} not available offline`);
        return null;
      }
      
      // Fetch from API
      const response = await api.getVideo(videoId);
      
      if (response.success && response.data) {
        // Cache the video for future use
        await cache.setVideo(videoId, response.data);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get video:', error);
      
      if (error instanceof BunnyVaultError) {
        throw error;
      }
      
      throw new BunnyVaultError(
        'Failed to fetch video',
        ERROR_CODES.API_ERROR,
        error
      );
    }
  }, [api, cache, isOnline]);
  
  /**
   * Get multiple videos with optional filtering and pagination
   */
  const getVideos = useCallback(async (params: GetVideosParams = {}): Promise<BunnyVaultVideo[]> => {
    try {
      // If offline, return cached videos only
      if (!isOnline) {
        const cachedVideos = await cache.getAllVideos();
        return applyClientSideFiltering(cachedVideos, params);
      }
      
      // Fetch from API
      const response = await api.getVideos(params);
      
      if (response.success && response.data) {
        // Cache videos for offline use
        const videos = Array.isArray(response.data) ? response.data : [];
        await Promise.all(
          videos.map(video => cache.setVideo(video.id, video))
        );
        
        return videos;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get videos:', error);
      
      // Fallback to cached videos on error
      if (!isOnline) {
        const cachedVideos = await cache.getAllVideos();
        return applyClientSideFiltering(cachedVideos, params);
      }
      
      throw new BunnyVaultError(
        'Failed to fetch videos',
        ERROR_CODES.API_ERROR,
        error
      );
    }
  }, [api, cache, isOnline]);
  
  /**
   * Search videos by query with optional parameters
   */
  const searchVideos = useCallback(async (
    query: string, 
    params: SearchParams = {}
  ): Promise<BunnyVaultVideo[]> => {
    try {
      // Validate query
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new BunnyVaultError(
          'Search query is required',
          ERROR_CODES.CONFIGURATION_ERROR
        );
      }
      
      const searchParams = { ...params, query: query.trim() };
      
      // If offline, search in cached videos
      if (!isOnline) {
        const cachedVideos = await cache.getAllVideos();
        return performClientSideSearch(cachedVideos, searchParams);
      }
      
      // Search via API
      const response = await api.searchVideos(searchParams);
      
      if (response.success && response.data) {
        const videos = Array.isArray(response.data) ? response.data : [];
        
        // Cache search results
        await Promise.all(
          videos.map(video => cache.setVideo(video.id, video))
        );
        
        return videos;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to search videos:', error);
      
      // Fallback to cached search on error
      if (!isOnline) {
        const cachedVideos = await cache.getAllVideos();
        return performClientSideSearch(cachedVideos, { ...params, query });
      }
      
      throw new BunnyVaultError(
        'Failed to search videos',
        ERROR_CODES.API_ERROR,
        error
      );
    }
  }, [api, cache, isOnline]);
  
  /**
   * Get video categories
   */
  const getCategories = useCallback(async (): Promise<string[]> => {
    try {
      if (!isOnline) {
        // Extract categories from cached videos
        const cachedVideos = await cache.getAllVideos();
        const categories = new Set<string>();
        
        cachedVideos.forEach(video => {
          if (video.metadata?.category) {
            categories.add(video.metadata.category);
          }
        });
        
        return Array.from(categories).sort();
      }
      
      const response = await api.getCategories();
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }, [api, cache, isOnline]);
  
  /**
   * Get video tags
   */
  const getTags = useCallback(async (): Promise<string[]> => {
    try {
      if (!isOnline) {
        // Extract tags from cached videos
        const cachedVideos = await cache.getAllVideos();
        const tags = new Set<string>();
        
        cachedVideos.forEach(video => {
          if (video.metadata?.tags) {
            video.metadata.tags.forEach(tag => tags.add(tag));
          }
        });
        
        return Array.from(tags).sort();
      }
      
      const response = await api.getTags();
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Failed to get tags:', error);
      return [];
    }
  }, [api, cache, isOnline]);
  
  /**
   * Clear all cached data
   */
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await cache.clear();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw new BunnyVaultError(
        'Failed to clear cache',
        ERROR_CODES.CACHE_ERROR,
        error
      );
    }
  }, [cache]);
  
  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    try {
      return await cache.getStats();
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalVideos: 0,
        totalSize: 0,
        lastUpdated: null,
      };
    }
  }, [cache]);
  
  /**
   * Preload videos for offline use
   */
  const preloadVideos = useCallback(async (videoIds: string[]): Promise<void> => {
    try {
      if (!isOnline) {
        throw new BunnyVaultError(
          'Cannot preload videos while offline',
          ERROR_CODES.NO_INTERNET
        );
      }
      
      const promises = videoIds.map(async (videoId) => {
        try {
          const video = await getVideo(videoId);
          if (video) {
            await cache.preloadVideo(videoId);
          }
        } catch (error) {
          console.warn(`Failed to preload video ${videoId}:`, error);
        }
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to preload videos:', error);
      throw error;
    }
  }, [getVideo, cache, isOnline]);
  
  // Memoized return value
  const returnValue = useMemo((): UseBunnyVaultReturn => ({
    api,
    analytics,
    cache,
    isOnline,
    isInitialized,
    getVideo,
    getVideos,
    searchVideos,
    getCategories,
    getTags,
    clearCache,
    getCacheStats,
    preloadVideos,
  }), [
    api,
    analytics,
    cache,
    isOnline,
    isInitialized,
    getVideo,
    getVideos,
    searchVideos,
    getCategories,
    getTags,
    clearCache,
    getCacheStats,
    preloadVideos,
  ]);
  
  return returnValue;
};

/**
 * Apply client-side filtering to videos (for offline use)
 */
function applyClientSideFiltering(
  videos: BunnyVaultVideo[], 
  params: GetVideosParams
): BunnyVaultVideo[] {
  let filtered = [...videos];
  
  // Filter by category
  if (params.category) {
    filtered = filtered.filter(video => 
      video.metadata?.category === params.category
    );
  }
  
  // Filter by tags
  if (params.tags && params.tags.length > 0) {
    filtered = filtered.filter(video => 
      video.metadata?.tags?.some(tag => params.tags!.includes(tag))
    );
  }
  
  // Sort
  if (params.sortBy) {
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (params.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updated':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        default:
          return 0;
      }
      
      if (params.sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }
  
  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return filtered.slice(startIndex, endIndex);
}

/**
 * Perform client-side search (for offline use)
 */
function performClientSideSearch(
  videos: BunnyVaultVideo[], 
  params: SearchParams
): BunnyVaultVideo[] {
  const query = params.query.toLowerCase();
  const searchIn = params.searchIn || ['title', 'description', 'tags'];
  
  let filtered = videos.filter(video => {
    // Search in title
    if (searchIn.includes('title') && video.title.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in description
    if (searchIn.includes('description') && 
        video.description?.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in tags
    if (searchIn.includes('tags') && 
        video.metadata?.tags?.some(tag => tag.toLowerCase().includes(query))) {
      return true;
    }
    
    return false;
  });
  
  // Apply additional filtering
  return applyClientSideFiltering(filtered, params);
}

export default useBunnyVault;
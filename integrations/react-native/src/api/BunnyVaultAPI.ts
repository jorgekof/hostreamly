/**
 * BunnyVault API Client
 * Handles all API communications with BunnyVault backend
 */

import {
  BunnyVaultAPIConfig,
  BunnyVaultVideo,
  VideoMetadata,
  VideoSearchParams,
  VideoCategory,
  VideoTag,
  APIResponse,
  BunnyVaultError,
  AnalyticsEvent,
  VideoQuality,
  VideoStats,
} from '../types';
import {
  API_CONFIG,
  ERROR_CODES,
  VIDEO_QUALITIES,
  HTTP_STATUS,
} from '../constants';

/**
 * BunnyVault API Client Class
 */
export class BunnyVaultAPI {
  private config: BunnyVaultAPIConfig;
  private baseHeaders: Record<string, string>;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  constructor(config: BunnyVaultAPIConfig) {
    this.config = {
      ...API_CONFIG,
      ...config,
    };

    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-API-Version': this.config.apiVersion || '1.0',
      'X-Client-Platform': 'react-native',
      'X-Client-Version': '1.0.0',
    };

    // Add custom headers if provided
    if (this.config.customHeaders) {
      Object.assign(this.baseHeaders, this.config.customHeaders);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/health');
      return response.success;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options: {
      timeout?: number;
      retries?: number;
      cache?: boolean;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<APIResponse<T>> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      cache = false,
      priority = 'normal',
    } = options;

    const url = `${this.config.baseUrl}${endpoint}`;
    const requestKey = `${method}:${url}:${JSON.stringify(data || {})}`;

    // Check if request is already in progress (deduplication)
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }

    // Create request promise
    const requestPromise = this.executeRequest<T>(
      method,
      url,
      data,
      { timeout, retries, cache, priority }
    );

    // Add to queue
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Remove from queue when done
      this.requestQueue.delete(requestKey);
    }
  }

  /**
   * Execute HTTP request
   */
  private async executeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    options: {
      timeout?: number;
      retries?: number;
      cache?: boolean;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<APIResponse<T>> {
    const { timeout, retries = 0 } = options;
    const attemptKey = `${method}:${url}`;
    const currentAttempt = this.retryAttempts.get(attemptKey) || 0;

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: this.baseHeaders,
        signal: controller.signal,
      };

      // Add body for POST/PUT requests
      if (data && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(data);
      }

      // Make request
      const response = await fetch(url, requestOptions);

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Reset retry attempts on success
      this.retryAttempts.delete(attemptKey);

      // Handle response
      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API request failed (attempt ${currentAttempt + 1}):`, error);

      // Check if we should retry
      if (currentAttempt < retries && this.shouldRetry(error)) {
        this.retryAttempts.set(attemptKey, currentAttempt + 1);
        
        // Calculate retry delay with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, currentAttempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry request
        return this.executeRequest<T>(method, url, data, options);
      }

      // Reset retry attempts
      this.retryAttempts.delete(attemptKey);

      // Throw error
      throw this.createError(error, `Request failed: ${method} ${url}`);
    }
  }

  /**
   * Handle HTTP response
   */
  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    try {
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new BunnyVaultError(
          `HTTP ${response.status}: ${response.statusText}`,
          this.getErrorCodeFromStatus(response.status),
          { status: response.status, body: errorText }
        );
      }

      // Parse JSON response
      const data = await response.json();

      // Return structured response
      return {
        success: true,
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      if (error instanceof BunnyVaultError) {
        throw error;
      }

      throw new BunnyVaultError(
        'Failed to parse response',
        ERROR_CODES.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      return true;
    }

    // Retry on specific HTTP status codes
    if (error instanceof BunnyVaultError && error.originalError?.status) {
      const status = error.originalError.status;
      return status >= 500 || status === 408 || status === 429;
    }

    return false;
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return ERROR_CODES.AUTHENTICATION_ERROR;
      case HTTP_STATUS.FORBIDDEN:
        return ERROR_CODES.AUTHORIZATION_ERROR;
      case HTTP_STATUS.NOT_FOUND:
        return ERROR_CODES.VIDEO_NOT_FOUND;
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return ERROR_CODES.RATE_LIMIT_ERROR;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return ERROR_CODES.SERVER_ERROR;
      default:
        return ERROR_CODES.NETWORK_ERROR;
    }
  }

  /**
   * Create BunnyVaultError from generic error
   */
  private createError(error: any, message: string): BunnyVaultError {
    if (error instanceof BunnyVaultError) {
      return error;
    }

    let errorCode = ERROR_CODES.NETWORK_ERROR;
    
    if (error.name === 'AbortError') {
      errorCode = ERROR_CODES.TIMEOUT_ERROR;
      message = 'Request timeout';
    } else if (error.name === 'TypeError') {
      errorCode = ERROR_CODES.NETWORK_ERROR;
      message = 'Network error';
    }

    return new BunnyVaultError(message, errorCode, error);
  }

  // =============================================================================
  // VIDEO API METHODS
  // =============================================================================

  /**
   * Get video by ID
   */
  async getVideo(videoId: string): Promise<BunnyVaultVideo> {
    const response = await this.makeRequest<BunnyVaultVideo>(
      'GET',
      `/videos/${videoId}`,
      undefined,
      { cache: true }
    );
    return response.data;
  }

  /**
   * Get multiple videos by IDs
   */
  async getVideos(videoIds: string[]): Promise<BunnyVaultVideo[]> {
    const response = await this.makeRequest<BunnyVaultVideo[]>(
      'POST',
      '/videos/batch',
      { videoIds },
      { cache: true }
    );
    return response.data;
  }

  /**
   * Search videos
   */
  async searchVideos(params: VideoSearchParams): Promise<{
    videos: BunnyVaultVideo[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await this.makeRequest<{
      videos: BunnyVaultVideo[];
      total: number;
      page: number;
      limit: number;
    }>(
      'GET',
      `/videos/search?${queryParams.toString()}`,
      undefined,
      { cache: true }
    );
    
    return response.data;
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
    const response = await this.makeRequest<VideoMetadata>(
      'GET',
      `/videos/${videoId}/metadata`,
      undefined,
      { cache: true }
    );
    return response.data;
  }

  /**
   * Get video streaming URL
   */
  async getVideoStreamUrl(
    videoId: string,
    quality: VideoQuality = 'auto'
  ): Promise<string> {
    const response = await this.makeRequest<{ streamUrl: string }>(
      'GET',
      `/videos/${videoId}/stream?quality=${quality}`,
      undefined,
      { cache: false, priority: 'high' }
    );
    return response.data.streamUrl;
  }

  /**
   * Get video thumbnail URL
   */
  async getVideoThumbnail(
    videoId: string,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<string> {
    const response = await this.makeRequest<{ thumbnailUrl: string }>(
      'GET',
      `/videos/${videoId}/thumbnail?size=${size}`,
      undefined,
      { cache: true }
    );
    return response.data.thumbnailUrl;
  }

  /**
   * Get video stats
   */
  async getVideoStats(videoId: string): Promise<VideoStats> {
    const response = await this.makeRequest<VideoStats>(
      'GET',
      `/videos/${videoId}/stats`
    );
    return response.data;
  }

  // =============================================================================
  // CATEGORY API METHODS
  // =============================================================================

  /**
   * Get all categories
   */
  async getCategories(): Promise<VideoCategory[]> {
    const response = await this.makeRequest<VideoCategory[]>(
      'GET',
      '/categories',
      undefined,
      { cache: true }
    );
    return response.data;
  }

  /**
   * Get videos by category
   */
  async getVideosByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    videos: BunnyVaultVideo[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await this.makeRequest<{
      videos: BunnyVaultVideo[];
      total: number;
      page: number;
      limit: number;
    }>(
      'GET',
      `/categories/${categoryId}/videos?page=${page}&limit=${limit}`,
      undefined,
      { cache: true }
    );
    return response.data;
  }

  // =============================================================================
  // TAG API METHODS
  // =============================================================================

  /**
   * Get all tags
   */
  async getTags(): Promise<VideoTag[]> {
    const response = await this.makeRequest<VideoTag[]>(
      'GET',
      '/tags',
      undefined,
      { cache: true }
    );
    return response.data;
  }

  /**
   * Get videos by tag
   */
  async getVideosByTag(
    tagId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    videos: BunnyVaultVideo[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await this.makeRequest<{
      videos: BunnyVaultVideo[];
      total: number;
      page: number;
      limit: number;
    }>(
      'GET',
      `/tags/${tagId}/videos?page=${page}&limit=${limit}`,
      undefined,
      { cache: true }
    );
    return response.data;
  }

  // =============================================================================
  // ANALYTICS API METHODS
  // =============================================================================

  /**
   * Track analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    await this.makeRequest(
      'POST',
      '/analytics/events',
      event,
      { priority: 'low', retries: 1 }
    );
  }

  /**
   * Track multiple analytics events
   */
  async trackEvents(events: AnalyticsEvent[]): Promise<void> {
    await this.makeRequest(
      'POST',
      '/analytics/events/batch',
      { events },
      { priority: 'low', retries: 1 }
    );
  }

  /**
   * Get analytics data
   */
  async getAnalytics(
    videoId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const params = new URLSearchParams();
    
    if (videoId) params.append('videoId', videoId);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await this.makeRequest(
      'GET',
      `/analytics?${params.toString()}`
    );
    
    return response.data;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Update API configuration
   */
  updateConfig(newConfig: Partial<BunnyVaultAPIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update headers if API key changed
    if (newConfig.apiKey) {
      this.baseHeaders['Authorization'] = `Bearer ${newConfig.apiKey}`;
    }
    
    // Update custom headers
    if (newConfig.customHeaders) {
      Object.assign(this.baseHeaders, newConfig.customHeaders);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): BunnyVaultAPIConfig {
    return { ...this.config };
  }

  /**
   * Clear request queue and retry attempts
   */
  clearCache(): void {
    this.requestQueue.clear();
    this.retryAttempts.clear();
  }

  /**
   * Get request queue status
   */
  getQueueStatus(): {
    activeRequests: number;
    retryAttempts: number;
  } {
    return {
      activeRequests: this.requestQueue.size,
      retryAttempts: this.retryAttempts.size,
    };
  }
}

export default BunnyVaultAPI;
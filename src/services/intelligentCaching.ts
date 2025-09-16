/**
 * Intelligent Caching System
 * Advanced caching with ML-based prediction and adaptive streaming optimization
 */

import { LRUCache } from 'lru-cache';

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageResponseTime: number;
  totalRequests: number;
  cacheSize: number;
  memoryUsage: number;
}

interface VideoMetadata {
  id: string;
  size: number;
  duration: number;
  quality: string;
  bitrate: number;
  codec: string;
  popularity: number;
  lastAccessed: number;
  accessCount: number;
  userSegment: string;
  geolocation: string;
}

interface PredictionModel {
  predictNextAccess(videoId: string, userContext: UserContext): number;
  updateModel(accessPattern: AccessPattern): void;
  getPopularityScore(videoId: string): number;
}

interface UserContext {
  userId: string;
  location: string;
  deviceType: string;
  connectionSpeed: number;
  viewingHistory: string[];
  preferences: {
    quality: string;
    autoplay: boolean;
    skipIntros: boolean;
  };
}

interface AccessPattern {
  videoId: string;
  userId: string;
  timestamp: number;
  duration: number;
  quality: string;
  completed: boolean;
  dropoffPoint?: number;
}

interface CacheStrategy {
  name: string;
  priority: number;
  shouldCache(video: VideoMetadata, context: UserContext): boolean;
  getEvictionScore(video: VideoMetadata): number;
}

class MLPredictionModel implements PredictionModel {
  private accessPatterns: Map<string, AccessPattern[]> = new Map();
  private popularityScores: Map<string, number> = new Map();
  private userSimilarity: Map<string, string[]> = new Map();
  private timeDecayFactor = 0.95;
  private popularityThreshold = 0.7;

  predictNextAccess(videoId: string, userContext: UserContext): number {
    const baseScore = this.getPopularityScore(videoId);
    const userScore = this.getUserAffinityScore(videoId, userContext);
    const timeScore = this.getTimeBasedScore(videoId);
    const contextScore = this.getContextualScore(videoId, userContext);
    
    return (baseScore * 0.3 + userScore * 0.4 + timeScore * 0.2 + contextScore * 0.1);
  }

  updateModel(accessPattern: AccessPattern): void {
    const videoId = accessPattern.videoId;
    const patterns = this.accessPatterns.get(videoId) || [];
    patterns.push(accessPattern);
    
    // Keep only recent patterns (last 1000)
    if (patterns.length > 1000) {
      patterns.splice(0, patterns.length - 1000);
    }
    
    this.accessPatterns.set(videoId, patterns);
    this.updatePopularityScore(videoId);
    this.updateUserSimilarity(accessPattern);
  }

  getPopularityScore(videoId: string): number {
    return this.popularityScores.get(videoId) || 0;
  }

  private getUserAffinityScore(videoId: string, userContext: UserContext): number {
    const similarUsers = this.userSimilarity.get(userContext.userId) || [];
    let affinityScore = 0;
    
    for (const similarUserId of similarUsers) {
      const patterns = this.accessPatterns.get(videoId) || [];
      const userPatterns = patterns.filter(p => p.userId === similarUserId);
      
      if (userPatterns.length > 0) {
        affinityScore += userPatterns.length / patterns.length;
      }
    }
    
    return Math.min(affinityScore, 1);
  }

  private getTimeBasedScore(videoId: string): number {
    const patterns = this.accessPatterns.get(videoId) || [];
    if (patterns.length === 0) return 0;
    
    const now = Date.now();
    const recentPatterns = patterns.filter(p => now - p.timestamp < 24 * 60 * 60 * 1000);
    
    return recentPatterns.length / patterns.length;
  }

  private getContextualScore(videoId: string, userContext: UserContext): number {
    const patterns = this.accessPatterns.get(videoId) || [];
    const contextualPatterns = patterns.filter(p => {
      // Match similar context (device, location, time of day)
      return this.isSimilarContext(p, userContext);
    });
    
    return contextualPatterns.length / Math.max(patterns.length, 1);
  }

  private updatePopularityScore(videoId: string): void {
    const patterns = this.accessPatterns.get(videoId) || [];
    const now = Date.now();
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (const pattern of patterns) {
      const age = now - pattern.timestamp;
      const weight = Math.pow(this.timeDecayFactor, age / (24 * 60 * 60 * 1000));
      const completionBonus = pattern.completed ? 1.5 : 1;
      
      weightedScore += weight * completionBonus;
      totalWeight += weight;
    }
    
    const popularityScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    this.popularityScores.set(videoId, popularityScore);
  }

  private updateUserSimilarity(accessPattern: AccessPattern): void {
    // Simplified collaborative filtering
    const userId = accessPattern.userId;
    const videoId = accessPattern.videoId;
    
    // Find users who also accessed this video
    const allPatterns = Array.from(this.accessPatterns.values()).flat();
    const similarUserIds = allPatterns
      .filter(p => p.videoId === videoId && p.userId !== userId)
      .map(p => p.userId);
    
    const currentSimilar = this.userSimilarity.get(userId) || [];
    const updatedSimilar = [...new Set([...currentSimilar, ...similarUserIds])]
      .slice(0, 50); // Keep top 50 similar users
    
    this.userSimilarity.set(userId, updatedSimilar);
  }

  private isSimilarContext(pattern: AccessPattern, userContext: UserContext): boolean {
    // Simplified context similarity
    const patternHour = new Date(pattern.timestamp).getHours();
    const currentHour = new Date().getHours();
    
    return Math.abs(patternHour - currentHour) <= 2;
  }
}

class AdaptiveCacheStrategy implements CacheStrategy {
  name = 'adaptive';
  priority = 1;

  constructor(private predictionModel: PredictionModel) {}

  shouldCache(video: VideoMetadata, context: UserContext): boolean {
    const predictionScore = this.predictionModel.predictNextAccess(video.id, context);
    const popularityScore = this.predictionModel.getPopularityScore(video.id);
    
    // Cache if high prediction score or high popularity
    return predictionScore > 0.6 || popularityScore > 0.8;
  }

  getEvictionScore(video: VideoMetadata): number {
    const timeSinceAccess = Date.now() - video.lastAccessed;
    const accessFrequency = video.accessCount / Math.max(1, timeSinceAccess / (24 * 60 * 60 * 1000));
    const sizeScore = 1 / (video.size / (1024 * 1024)); // Prefer smaller files
    
    return accessFrequency * sizeScore;
  }
}

class GeographicCacheStrategy implements CacheStrategy {
  name = 'geographic';
  priority = 2;

  shouldCache(video: VideoMetadata, context: UserContext): boolean {
    // Cache videos popular in user's region
    return video.geolocation === context.location && video.popularity > 0.5;
  }

  getEvictionScore(video: VideoMetadata): number {
    return video.popularity * (video.accessCount / Math.max(1, video.size / (1024 * 1024)));
  }
}

class QualityCacheStrategy implements CacheStrategy {
  name = 'quality';
  priority = 3;

  shouldCache(video: VideoMetadata, context: UserContext): boolean {
    // Cache multiple qualities based on connection speed
    const preferredQualities = this.getPreferredQualities(context.connectionSpeed);
    return preferredQualities.includes(video.quality);
  }

  getEvictionScore(video: VideoMetadata): number {
    const qualityScore = this.getQualityScore(video.quality);
    return qualityScore * video.accessCount;
  }

  private getPreferredQualities(connectionSpeed: number): string[] {
    if (connectionSpeed > 10) return ['4K', '1080p', '720p'];
    if (connectionSpeed > 5) return ['1080p', '720p', '480p'];
    if (connectionSpeed > 2) return ['720p', '480p', '360p'];
    return ['480p', '360p', '240p'];
  }

  private getQualityScore(quality: string): number {
    const scores = { '4K': 1, '1080p': 0.8, '720p': 0.6, '480p': 0.4, '360p': 0.2, '240p': 0.1 };
    return scores[quality as keyof typeof scores] || 0.1;
  }
}

export class IntelligentCachingSystem {
  private cache: LRUCache<string, ArrayBuffer>;
  private metadata: Map<string, VideoMetadata> = new Map();
  private predictionModel: MLPredictionModel;
  private strategies: CacheStrategy[];
  private metrics: CacheMetrics;
  private isOptimizing = false;
  private optimizationInterval: NodeJS.Timeout | null = null;

  constructor(options: {
    maxSize: number;
    maxAge: number;
    updateInterval?: number;
  }) {
    this.cache = new LRUCache({
      max: options.maxSize,
      maxAge: options.maxAge,
      sizeCalculation: (value: ArrayBuffer) => value.byteLength,
      dispose: (value: ArrayBuffer, key: string) => {
        this.onEviction(key);
      }
    });

    this.predictionModel = new MLPredictionModel();
    this.strategies = [
      new AdaptiveCacheStrategy(this.predictionModel),
      new GeographicCacheStrategy(),
      new QualityCacheStrategy()
    ];

    this.metrics = {
      hitRate: 0,
      missRate: 0,
      evictionRate: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      cacheSize: 0,
      memoryUsage: 0
    };

    // Start optimization loop
    this.startOptimization(options.updateInterval || 60000);
  }

  async get(videoId: string, userContext: UserContext): Promise<ArrayBuffer | null> {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    const cached = this.cache.get(videoId);
    if (cached) {
      this.metrics.hitRate = (this.metrics.hitRate * (this.metrics.totalRequests - 1) + 1) / this.metrics.totalRequests;
      this.updateAccessMetadata(videoId);
      
      const responseTime = performance.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      return cached;
    }

    this.metrics.missRate = (this.metrics.missRate * (this.metrics.totalRequests - 1) + 1) / this.metrics.totalRequests;
    
    // Predict and prefetch related content
    this.prefetchPredictedContent(videoId, userContext);
    
    return null;
  }

  async set(videoId: string, data: ArrayBuffer, metadata: VideoMetadata, userContext: UserContext): Promise<void> {
    // Check if we should cache this video
    const shouldCache = this.strategies.some(strategy => 
      strategy.shouldCache(metadata, userContext)
    );

    if (!shouldCache) {
      return;
    }

    // Make room if necessary
    await this.optimizeCache(userContext);

    this.cache.set(videoId, data);
    this.metadata.set(videoId, {
      ...metadata,
      lastAccessed: Date.now(),
      accessCount: (this.metadata.get(videoId)?.accessCount || 0) + 1
    });

    this.updateCacheMetrics();
  }

  trackAccess(accessPattern: AccessPattern): void {
    this.predictionModel.updateModel(accessPattern);
    
    const metadata = this.metadata.get(accessPattern.videoId);
    if (metadata) {
      metadata.lastAccessed = accessPattern.timestamp;
      metadata.accessCount++;
      this.metadata.set(accessPattern.videoId, metadata);
    }
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  async prefetch(videoIds: string[], userContext: UserContext): Promise<void> {
    for (const videoId of videoIds) {
      if (!this.cache.has(videoId)) {
        // Simulate prefetch (in real implementation, fetch from CDN)
        const predictionScore = this.predictionModel.predictNextAccess(videoId, userContext);
        
        if (predictionScore > 0.7) {
          console.log(`Prefetching video ${videoId} with score ${predictionScore}`);
          // await this.fetchAndCache(videoId, userContext);
        }
      }
    }
  }

  private async optimizeCache(userContext: UserContext): Promise<void> {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    
    try {
      // Get eviction candidates
      const candidates = Array.from(this.metadata.entries())
        .map(([videoId, metadata]) => ({
          videoId,
          metadata,
          evictionScore: this.calculateEvictionScore(metadata, userContext)
        }))
        .sort((a, b) => a.evictionScore - b.evictionScore);

      // Remove least valuable items if cache is near capacity
      const cacheUtilization = this.cache.size / this.cache.max;
      if (cacheUtilization > 0.8) {
        const itemsToRemove = Math.floor(candidates.length * 0.1);
        
        for (let i = 0; i < itemsToRemove; i++) {
          const candidate = candidates[i];
          this.cache.delete(candidate.videoId);
          this.metadata.delete(candidate.videoId);
          this.metrics.evictionRate++;
        }
      }
    } finally {
      this.isOptimizing = false;
    }
  }

  private calculateEvictionScore(metadata: VideoMetadata, userContext: UserContext): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const strategy of this.strategies) {
      const score = strategy.getEvictionScore(metadata);
      totalScore += score * strategy.priority;
      totalWeight += strategy.priority;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private async prefetchPredictedContent(videoId: string, userContext: UserContext): Promise<void> {
    // Get related videos based on user's viewing history
    const relatedVideos = userContext.viewingHistory
      .slice(-10) // Last 10 videos
      .filter(id => id !== videoId);

    // Predict which videos user might watch next
    const predictions = relatedVideos
      .map(id => ({
        videoId: id,
        score: this.predictionModel.predictNextAccess(id, userContext)
      }))
      .filter(p => p.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 predictions

    // Prefetch predicted videos
    for (const prediction of predictions) {
      if (!this.cache.has(prediction.videoId)) {
        console.log(`Prefetching predicted video ${prediction.videoId} with score ${prediction.score}`);
        // In real implementation: await this.fetchAndCache(prediction.videoId, userContext);
      }
    }
  }

  private updateAccessMetadata(videoId: string): void {
    const metadata = this.metadata.get(videoId);
    if (metadata) {
      metadata.lastAccessed = Date.now();
      metadata.accessCount++;
      this.metadata.set(videoId, metadata);
    }
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalRequests = this.metrics.totalRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  private updateCacheMetrics(): void {
    this.metrics.cacheSize = this.cache.size;
    this.metrics.memoryUsage = Array.from(this.cache.values())
      .reduce((total, buffer) => total + buffer.byteLength, 0);
  }

  private onEviction(videoId: string): void {
    this.metadata.delete(videoId);
    console.log(`Evicted video ${videoId} from cache`);
  }

  private startOptimization(interval: number): void {
    this.optimizationInterval = setInterval(async () => {
      // Periodic cache optimization
      const userContext: UserContext = {
        userId: 'system',
        location: 'global',
        deviceType: 'server',
        connectionSpeed: 100,
        viewingHistory: [],
        preferences: {
          quality: '1080p',
          autoplay: false,
          skipIntros: false
        }
      };
      
      await this.optimizeCache(userContext);
      
      // Log metrics
      console.log('Cache Metrics:', this.getMetrics());
    }, interval);
  }

  destroy(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
    this.cache.clear();
    this.metadata.clear();
  }
}

export default IntelligentCachingSystem;
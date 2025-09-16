/**
 * Analytics Tracker
 * Handles video analytics, event tracking, and performance metrics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';

import {
  AnalyticsConfig,
  AnalyticsEvent,
  VideoAnalytics,
  SessionAnalytics,
  PerformanceMetrics,
  BunnyVaultError,
} from '../types';
import {
  ANALYTICS_CONFIG,
  STORAGE_KEYS,
  ERROR_CODES,
} from '../constants';

/**
 * Analytics Tracker Class
 */
export class AnalyticsTracker {
  private config: AnalyticsConfig;
  private isInitialized: boolean = false;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionData: SessionAnalytics;
  private flushTimer: NodeJS.Timeout | null = null;
  private deviceInfo: any = {};
  private isOnline: boolean = true;

  constructor(config: AnalyticsConfig) {
    this.config = {
      ...ANALYTICS_CONFIG,
      ...config,
    };

    // Initialize session data
    this.sessionData = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      videosWatched: 0,
      totalWatchTime: 0,
      eventsTracked: 0,
      errors: 0,
    };
  }

  /**
   * Initialize analytics tracker
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing AnalyticsTracker...');

      // Collect device information
      await this.collectDeviceInfo();

      // Load persisted events
      await this.loadPersistedEvents();

      // Setup network monitoring
      this.setupNetworkMonitoring();

      // Start periodic flush if enabled
      if (this.config.autoFlush) {
        this.startPeriodicFlush();
      }

      // Track session start
      await this.trackSessionStart();

      this.isInitialized = true;
      console.log('AnalyticsTracker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AnalyticsTracker:', error);
      throw new BunnyVaultError(
        'Failed to initialize analytics tracker',
        ERROR_CODES.ANALYTICS_ERROR,
        error
      );
    }
  }

  /**
   * Collect device information
   */
  private async collectDeviceInfo(): Promise<void> {
    try {
      this.deviceInfo = {
        deviceId: await DeviceInfo.getUniqueId(),
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
        systemName: await DeviceInfo.getSystemName(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        appVersion: await DeviceInfo.getVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
        bundleId: await DeviceInfo.getBundleId(),
        isTablet: await DeviceInfo.isTablet(),
        hasNotch: await DeviceInfo.hasNotch(),
        screenWidth: 0, // Will be set by components
        screenHeight: 0, // Will be set by components
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: await DeviceInfo.getDeviceLocale(),
      };
    } catch (error) {
      console.warn('Failed to collect device info:', error);
      this.deviceInfo = {
        deviceId: 'unknown',
        platform: 'react-native',
      };
    }
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      // If we came back online, flush pending events
      if (!wasOnline && this.isOnline && this.eventQueue.length > 0) {
        this.flush();
      }
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected && state.isInternetReachable;
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'sessionId' | 'deviceInfo'>): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Create full event with session and device info
      const fullEvent: AnalyticsEvent = {
        ...event,
        sessionId: this.sessionData.sessionId,
        deviceInfo: this.deviceInfo,
        timestamp: event.timestamp || Date.now(),
      };

      // Add to queue
      this.eventQueue.push(fullEvent);
      this.sessionData.eventsTracked++;
      this.sessionData.lastActivity = Date.now();

      // Update session data based on event type
      this.updateSessionData(fullEvent);

      // Persist events if offline or queue is getting large
      if (!this.isOnline || this.eventQueue.length >= this.config.maxQueueSize) {
        await this.persistEvents();
      }

      // Auto-flush if queue is full or for high-priority events
      if (this.eventQueue.length >= this.config.flushThreshold || 
          event.type === 'error' || event.type === 'video_error') {
        await this.flush();
      }

      console.log(`Analytics event tracked: ${event.type}`, event);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      this.sessionData.errors++;
    }
  }

  /**
   * Update session data based on event
   */
  private updateSessionData(event: AnalyticsEvent): void {
    switch (event.type) {
      case 'video_start':
        this.sessionData.videosWatched++;
        break;
      
      case 'video_progress':
        if (event.data?.watchTime) {
          this.sessionData.totalWatchTime += event.data.watchTime;
        }
        break;
      
      case 'error':
      case 'video_error':
        this.sessionData.errors++;
        break;
    }
  }

  /**
   * Track video-specific events
   */
  async trackVideoEvent(
    type: 'video_start' | 'video_pause' | 'video_resume' | 'video_end' | 'video_seek' | 'video_quality_change',
    videoId: string,
    data?: any
  ): Promise<void> {
    await this.trackEvent({
      type,
      videoId,
      timestamp: Date.now(),
      data,
    });
  }

  /**
   * Track video progress
   */
  async trackVideoProgress(
    videoId: string,
    currentTime: number,
    duration: number,
    quality?: string
  ): Promise<void> {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    await this.trackEvent({
      type: 'video_progress',
      videoId,
      timestamp: Date.now(),
      data: {
        currentTime,
        duration,
        progress,
        quality,
        watchTime: currentTime,
      },
    });
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(
    videoId: string,
    metrics: PerformanceMetrics
  ): Promise<void> {
    await this.trackEvent({
      type: 'performance',
      videoId,
      timestamp: Date.now(),
      data: metrics,
    });
  }

  /**
   * Track error events
   */
  async trackError(
    error: Error | BunnyVaultError,
    videoId?: string,
    context?: any
  ): Promise<void> {
    await this.trackEvent({
      type: 'error',
      videoId: videoId || 'system',
      timestamp: Date.now(),
      data: {
        message: error.message,
        stack: error.stack,
        code: error instanceof BunnyVaultError ? error.code : 'UNKNOWN_ERROR',
        context,
      },
    });
  }

  /**
   * Track session start
   */
  private async trackSessionStart(): Promise<void> {
    await this.trackEvent({
      type: 'session_start',
      videoId: 'system',
      timestamp: this.sessionData.startTime,
      data: {
        sessionId: this.sessionData.sessionId,
        deviceInfo: this.deviceInfo,
      },
    });
  }

  /**
   * Track session end
   */
  async trackSessionEnd(): Promise<void> {
    const sessionDuration = Date.now() - this.sessionData.startTime;
    
    await this.trackEvent({
      type: 'session_end',
      videoId: 'system',
      timestamp: Date.now(),
      data: {
        sessionId: this.sessionData.sessionId,
        duration: sessionDuration,
        videosWatched: this.sessionData.videosWatched,
        totalWatchTime: this.sessionData.totalWatchTime,
        eventsTracked: this.sessionData.eventsTracked,
        errors: this.sessionData.errors,
      },
    });

    // Flush remaining events
    await this.flush();
  }

  /**
   * Get video analytics
   */
  getVideoAnalytics(videoId: string): VideoAnalytics {
    const videoEvents = this.eventQueue.filter(event => event.videoId === videoId);
    
    let totalWatchTime = 0;
    let maxProgress = 0;
    let playCount = 0;
    let pauseCount = 0;
    let seekCount = 0;
    let qualityChanges = 0;
    let errors = 0;
    let lastWatchTime = 0;

    videoEvents.forEach(event => {
      switch (event.type) {
        case 'video_start':
          playCount++;
          break;
        case 'video_pause':
          pauseCount++;
          break;
        case 'video_seek':
          seekCount++;
          break;
        case 'video_quality_change':
          qualityChanges++;
          break;
        case 'video_progress':
          if (event.data?.progress) {
            maxProgress = Math.max(maxProgress, event.data.progress);
          }
          if (event.data?.watchTime) {
            totalWatchTime = Math.max(totalWatchTime, event.data.watchTime);
            lastWatchTime = event.data.watchTime;
          }
          break;
        case 'error':
        case 'video_error':
          errors++;
          break;
      }
    });

    return {
      videoId,
      totalWatchTime,
      maxProgress,
      playCount,
      pauseCount,
      seekCount,
      qualityChanges,
      errors,
      lastWatchTime,
      firstWatchTime: videoEvents.find(e => e.type === 'video_start')?.timestamp || 0,
      lastActivityTime: Math.max(...videoEvents.map(e => e.timestamp)),
    };
  }

  /**
   * Get session analytics
   */
  getSessionAnalytics(): SessionAnalytics {
    return {
      ...this.sessionData,
      duration: Date.now() - this.sessionData.startTime,
    };
  }

  /**
   * Persist events to storage
   */
  private async persistEvents(): Promise<void> {
    try {
      if (this.eventQueue.length === 0) {
        return;
      }

      // Load existing persisted events
      const existingEventsData = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_EVENTS);
      const existingEvents = existingEventsData ? JSON.parse(existingEventsData) : [];

      // Combine with current queue
      const allEvents = [...existingEvents, ...this.eventQueue];

      // Keep only recent events to prevent storage bloat
      const maxPersistedEvents = this.config.maxQueueSize * 2;
      const eventsToKeep = allEvents.slice(-maxPersistedEvents);

      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS_EVENTS, JSON.stringify(eventsToKeep));
      
      console.log(`Persisted ${this.eventQueue.length} analytics events`);
    } catch (error) {
      console.error('Failed to persist analytics events:', error);
    }
  }

  /**
   * Load persisted events
   */
  private async loadPersistedEvents(): Promise<void> {
    try {
      const eventsData = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_EVENTS);
      if (eventsData) {
        const persistedEvents = JSON.parse(eventsData);
        this.eventQueue = persistedEvents;
        console.log(`Loaded ${this.eventQueue.length} persisted analytics events`);
      }
    } catch (error) {
      console.warn('Failed to load persisted analytics events:', error);
      this.eventQueue = [];
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(async () => {
      try {
        await this.flush();
      } catch (error) {
        console.error('Periodic flush failed:', error);
      }
    }, this.config.flushInterval);
  }

  /**
   * Stop periodic flush
   */
  private stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Flush events to server
   */
  async flush(): Promise<void> {
    if (!this.config.enabled || this.eventQueue.length === 0 || !this.isOnline) {
      return;
    }

    try {
      console.log(`Flushing ${this.eventQueue.length} analytics events...`);

      // Create batch of events to send
      const eventsToSend = [...this.eventQueue];
      
      // Clear queue immediately to prevent duplicate sends
      this.eventQueue = [];

      // Send events to server (this would be implemented by the API client)
      // For now, we'll just log them
      if (this.config.debug) {
        console.log('Analytics events to send:', eventsToSend);
      }

      // Clear persisted events after successful flush
      await AsyncStorage.removeItem(STORAGE_KEYS.ANALYTICS_EVENTS);

      console.log(`Successfully flushed ${eventsToSend.length} analytics events`);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      
      // Re-add events to queue if flush failed
      // (In a real implementation, you might want to implement more sophisticated retry logic)
    }
  }

  /**
   * Set screen dimensions
   */
  setScreenDimensions(width: number, height: number): void {
    this.deviceInfo.screenWidth = width;
    this.deviceInfo.screenHeight = height;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart periodic flush if interval changed
    if (newConfig.flushInterval && this.config.autoFlush) {
      this.startPeriodicFlush();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueSize: number;
    maxQueueSize: number;
    isOnline: boolean;
    lastFlush: number | null;
  } {
    return {
      queueSize: this.eventQueue.length,
      maxQueueSize: this.config.maxQueueSize,
      isOnline: this.isOnline,
      lastFlush: null, // Would track this in a real implementation
    };
  }

  /**
   * Clear all analytics data
   */
  async clearData(): Promise<void> {
    console.log('Clearing all analytics data...');
    
    // Clear queue
    this.eventQueue = [];
    
    // Clear persisted events
    await AsyncStorage.removeItem(STORAGE_KEYS.ANALYTICS_EVENTS);
    
    // Reset session data
    this.sessionData = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      videosWatched: 0,
      totalWatchTime: 0,
      eventsTracked: 0,
      errors: 0,
    };
    
    console.log('Analytics data cleared');
  }

  /**
   * Destroy analytics tracker
   */
  destroy(): void {
    console.log('Destroying AnalyticsTracker...');
    
    // Stop periodic flush
    this.stopPeriodicFlush();
    
    // Track session end
    this.trackSessionEnd();
    
    // Reset state
    this.isInitialized = false;
    this.eventQueue = [];
    
    console.log('AnalyticsTracker destroyed');
  }
}

export default AnalyticsTracker;
/**
 * BunnyVault React Native SDK Types
 * TypeScript definitions for all SDK components and utilities
 */

import { ViewStyle, TextStyle } from 'react-native';

// Core Video Types
export interface BunnyVaultVideo {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  url: string;
  hlsUrl?: string;
  dashUrl?: string;
  metadata?: VideoMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface VideoMetadata {
  width?: number;
  height?: number;
  bitrate?: number;
  fps?: number;
  codec?: string;
  size?: number;
  tags?: string[];
  category?: string;
  language?: string;
  subtitles?: Subtitle[];
}

export interface Subtitle {
  language: string;
  label: string;
  url: string;
  default?: boolean;
}

// Player Configuration
export interface PlayerConfig {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  fullscreen?: boolean;
  pip?: boolean; // Picture in Picture
  quality?: VideoQuality;
  startTime?: number;
  playbackRate?: number;
  volume?: number;
  poster?: string;
  preload?: 'none' | 'metadata' | 'auto';
}

export type VideoQuality = 'auto' | '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';

// Player Events
export interface PlayerEvents {
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: VideoError) => void;
  onProgress?: (progress: VideoProgress) => void;
  onSeek?: (time: number) => void;
  onFullscreenEnter?: () => void;
  onFullscreenExit?: () => void;
  onQualityChange?: (quality: VideoQuality) => void;
  onVolumeChange?: (volume: number) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onBuffer?: (isBuffering: boolean) => void;
}

export interface VideoProgress {
  currentTime: number;
  duration: number;
  percentage: number;
  buffered: number;
  played: number;
}

export interface VideoError {
  code: string;
  message: string;
  details?: any;
}

// Component Props
export interface BunnyVaultPlayerProps {
  videoId: string;
  config?: PlayerConfig;
  events?: PlayerEvents;
  style?: ViewStyle;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  showControls?: boolean;
  showProgress?: boolean;
  showTitle?: boolean;
  customControls?: React.ReactNode;
  analyticsEnabled?: boolean;
  offlineEnabled?: boolean;
  cachingEnabled?: boolean;
}

export interface BunnyVaultGalleryProps {
  videos?: BunnyVaultVideo[];
  videoIds?: string[];
  category?: string;
  tags?: string[];
  limit?: number;
  columns?: number;
  spacing?: number;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  onVideoSelect?: (video: BunnyVaultVideo) => void;
  showTitles?: boolean;
  showDuration?: boolean;
  autoplay?: boolean;
  infiniteScroll?: boolean;
}

export interface BunnyVaultThumbnailProps {
  videoId: string;
  video?: BunnyVaultVideo;
  style?: ViewStyle;
  imageStyle?: ViewStyle;
  textStyle?: TextStyle;
  showTitle?: boolean;
  showDuration?: boolean;
  showPlayButton?: boolean;
  onPress?: (video: BunnyVaultVideo) => void;
  placeholder?: React.ReactNode;
}

export interface BunnyVaultLiveStreamProps {
  streamId: string;
  config?: PlayerConfig;
  events?: PlayerEvents;
  style?: ViewStyle;
  showViewerCount?: boolean;
  showChatEnabled?: boolean;
  chatStyle?: ViewStyle;
  onChatMessage?: (message: ChatMessage) => void;
}

// Live Stream Types
export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  streamUrl: string;
  chatUrl?: string;
  isLive: boolean;
  viewerCount?: number;
  startedAt?: string;
  scheduledAt?: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  avatar?: string;
}

// API Types
export interface BunnyVaultAPIConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  cacheTTL?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Analytics Types
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  videoId: string;
  timestamp: number;
  data?: any;
  userId?: string;
  sessionId: string;
}

export type AnalyticsEventType = 
  | 'video_start'
  | 'video_play'
  | 'video_pause'
  | 'video_end'
  | 'video_seek'
  | 'video_quality_change'
  | 'video_fullscreen'
  | 'video_error'
  | 'video_buffer'
  | 'video_progress';

export interface AnalyticsConfig {
  enabled: boolean;
  batchSize?: number;
  flushInterval?: number;
  endpoint?: string;
  userId?: string;
  customData?: Record<string, any>;
}

// Caching Types
export interface CacheConfig {
  enabled: boolean;
  maxSize?: number; // in MB
  maxAge?: number; // in milliseconds
  strategy?: CacheStrategy;
  preloadEnabled?: boolean;
}

export type CacheStrategy = 'lru' | 'fifo' | 'manual';

export interface CachedVideo {
  videoId: string;
  localPath: string;
  size: number;
  cachedAt: number;
  lastAccessed: number;
  metadata: VideoMetadata;
}

// Offline Types
export interface OfflineConfig {
  enabled: boolean;
  maxVideos?: number;
  maxSize?: number; // in MB
  quality?: VideoQuality;
  wifiOnly?: boolean;
}

export interface DownloadProgress {
  videoId: string;
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

export interface OfflineVideo {
  videoId: string;
  localPath: string;
  downloadedAt: number;
  size: number;
  quality: VideoQuality;
  metadata: VideoMetadata;
}

// Provider Types
export interface BunnyVaultProviderProps {
  children: React.ReactNode;
  config: BunnyVaultAPIConfig;
  analyticsConfig?: AnalyticsConfig;
  cacheConfig?: CacheConfig;
  offlineConfig?: OfflineConfig;
}

export interface BunnyVaultContextValue {
  api: BunnyVaultAPI;
  analytics: AnalyticsTracker;
  cache: VideoCache;
  config: BunnyVaultAPIConfig;
  isOnline: boolean;
  isInitialized: boolean;
}

// Hook Return Types
export interface UseBunnyVaultReturn {
  api: BunnyVaultAPI;
  analytics: AnalyticsTracker;
  cache: VideoCache;
  isOnline: boolean;
  isInitialized: boolean;
  getVideo: (videoId: string) => Promise<BunnyVaultVideo | null>;
  getVideos: (params?: GetVideosParams) => Promise<BunnyVaultVideo[]>;
  searchVideos: (query: string, params?: SearchParams) => Promise<BunnyVaultVideo[]>;
}

export interface UseVideoProgressReturn {
  progress: VideoProgress | null;
  isPlaying: boolean;
  isPaused: boolean;
  isEnded: boolean;
  isBuffering: boolean;
  error: VideoError | null;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
}

export interface UseVideoAnalyticsReturn {
  trackEvent: (event: Partial<AnalyticsEvent>) => void;
  getSessionStats: () => SessionStats;
  flushEvents: () => Promise<void>;
}

export interface UseOfflineVideoReturn {
  downloadVideo: (videoId: string, quality?: VideoQuality) => Promise<void>;
  deleteVideo: (videoId: string) => Promise<void>;
  getDownloadProgress: (videoId: string) => DownloadProgress | null;
  getOfflineVideos: () => OfflineVideo[];
  isVideoOffline: (videoId: string) => boolean;
  getOfflineVideoPath: (videoId: string) => string | null;
}

// Utility Types
export interface GetVideosParams {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  sortBy?: 'created' | 'updated' | 'title' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends GetVideosParams {
  query: string;
  searchIn?: ('title' | 'description' | 'tags')[];
}

export interface SessionStats {
  sessionId: string;
  startTime: number;
  duration: number;
  videosWatched: number;
  totalWatchTime: number;
  eventsTracked: number;
}

// Error Types
export class BunnyVaultError extends Error {
  code: string;
  details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'BunnyVaultError';
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends BunnyVaultError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class APIError extends BunnyVaultError {
  statusCode?: number;
  
  constructor(message: string, statusCode?: number, details?: any) {
    super(message, 'API_ERROR', details);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

export class CacheError extends BunnyVaultError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', details);
    this.name = 'CacheError';
  }
}

export class OfflineError extends BunnyVaultError {
  constructor(message: string, details?: any) {
    super(message, 'OFFLINE_ERROR', details);
    this.name = 'OfflineError';
  }
}
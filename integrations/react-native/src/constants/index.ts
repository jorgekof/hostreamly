/**
 * BunnyVault React Native SDK Constants
 * Configuration constants and default values
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.bunnyvault.com/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  CACHE_TTL: 300000, // 5 minutes
} as const;

// Video Player Defaults
export const PLAYER_DEFAULTS = {
  AUTOPLAY: false,
  MUTED: false,
  LOOP: false,
  CONTROLS: true,
  FULLSCREEN: true,
  PIP: true,
  QUALITY: 'auto' as const,
  START_TIME: 0,
  PLAYBACK_RATE: 1.0,
  VOLUME: 1.0,
  PRELOAD: 'metadata' as const,
  RESIZE_MODE: 'contain' as const,
} as const;

// Video Qualities
export const VIDEO_QUALITIES = [
  'auto',
  '144p',
  '240p',
  '360p',
  '480p',
  '720p',
  '1080p',
  '1440p',
  '2160p',
] as const;

// Playback Rates
export const PLAYBACK_RATES = [
  0.25,
  0.5,
  0.75,
  1.0,
  1.25,
  1.5,
  1.75,
  2.0,
] as const;

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  ENABLED: true,
  BATCH_SIZE: 50,
  FLUSH_INTERVAL: 30000, // 30 seconds
  ENDPOINT: '/analytics/events',
  SESSION_TIMEOUT: 1800000, // 30 minutes
} as const;

// Analytics Event Types
export const ANALYTICS_EVENTS = {
  VIDEO_START: 'video_start',
  VIDEO_PLAY: 'video_play',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_END: 'video_end',
  VIDEO_SEEK: 'video_seek',
  VIDEO_QUALITY_CHANGE: 'video_quality_change',
  VIDEO_FULLSCREEN: 'video_fullscreen',
  VIDEO_ERROR: 'video_error',
  VIDEO_BUFFER: 'video_buffer',
  VIDEO_PROGRESS: 'video_progress',
} as const;

// Progress Tracking
export const PROGRESS_CONFIG = {
  UPDATE_INTERVAL: 1000, // 1 second
  MILESTONE_PERCENTAGES: [25, 50, 75, 90, 100],
  BUFFER_THRESHOLD: 0.1, // 10%
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  ENABLED: true,
  MAX_SIZE: 500, // 500 MB
  MAX_AGE: 604800000, // 7 days
  STRATEGY: 'lru' as const,
  PRELOAD_ENABLED: false,
  STORAGE_KEY: '@bunnyvault_cache',
} as const;

// Cache Strategies
export const CACHE_STRATEGIES = {
  LRU: 'lru',
  FIFO: 'fifo',
  MANUAL: 'manual',
} as const;

// Offline Configuration
export const OFFLINE_CONFIG = {
  ENABLED: true,
  MAX_VIDEOS: 50,
  MAX_SIZE: 2048, // 2 GB
  QUALITY: '720p' as const,
  WIFI_ONLY: true,
  STORAGE_KEY: '@bunnyvault_offline',
} as const;

// Download States
export const DOWNLOAD_STATES = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  READ_TIMEOUT: 30000, // 30 seconds
  MAX_CONCURRENT_DOWNLOADS: 3,
  RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_DELAY: 30000, // 30 seconds
} as const;

// Error Codes
export const ERROR_CODES = {
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  NO_INTERNET: 'NO_INTERNET',
  
  // API Errors
  API_ERROR: 'API_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Video Errors
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  VIDEO_UNAVAILABLE: 'VIDEO_UNAVAILABLE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  PLAYBACK_ERROR: 'PLAYBACK_ERROR',
  DECODE_ERROR: 'DECODE_ERROR',
  
  // Cache Errors
  CACHE_ERROR: 'CACHE_ERROR',
  STORAGE_FULL: 'STORAGE_FULL',
  CACHE_CORRUPTED: 'CACHE_CORRUPTED',
  
  // Offline Errors
  OFFLINE_ERROR: 'OFFLINE_ERROR',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  INSUFFICIENT_STORAGE: 'INSUFFICIENT_STORAGE',
  WIFI_REQUIRED: 'WIFI_REQUIRED',
  
  // General Errors
  INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// File Extensions
export const VIDEO_EXTENSIONS = {
  MP4: '.mp4',
  M3U8: '.m3u8',
  MPD: '.mpd',
  WEBM: '.webm',
  MOV: '.mov',
  AVI: '.avi',
  MKV: '.mkv',
} as const;

// MIME Types
export const MIME_TYPES = {
  MP4: 'video/mp4',
  HLS: 'application/vnd.apple.mpegurl',
  DASH: 'application/dash+xml',
  WEBM: 'video/webm',
  JSON: 'application/json',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  API_CONFIG: '@bunnyvault_api_config',
  USER_PREFERENCES: '@bunnyvault_user_preferences',
  ANALYTICS_SESSION: '@bunnyvault_analytics_session',
  CACHE_INDEX: '@bunnyvault_cache_index',
  OFFLINE_INDEX: '@bunnyvault_offline_index',
  DOWNLOAD_QUEUE: '@bunnyvault_download_queue',
  PLAYBACK_HISTORY: '@bunnyvault_playback_history',
} as const;

// UI Constants
export const UI_CONFIG = {
  GALLERY_COLUMNS: 2,
  GALLERY_SPACING: 10,
  THUMBNAIL_ASPECT_RATIO: 16 / 9,
  CONTROL_FADE_TIMEOUT: 3000, // 3 seconds
  LOADING_TIMEOUT: 10000, // 10 seconds
  TOAST_DURATION: 3000, // 3 seconds
} as const;

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
} as const;

// Colors (can be customized by theme)
export const COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#5856D6',
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
  ERROR: '#FF3B30',
  INFO: '#5AC8FA',
  
  // Neutral Colors
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  GRAY_100: '#F2F2F7',
  GRAY_200: '#E5E5EA',
  GRAY_300: '#D1D1D6',
  GRAY_400: '#C7C7CC',
  GRAY_500: '#AEAEB2',
  GRAY_600: '#8E8E93',
  GRAY_700: '#636366',
  GRAY_800: '#48484A',
  GRAY_900: '#1C1C1E',
  
  // Overlay Colors
  OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.3)',
  OVERLAY_MEDIUM: 'rgba(0, 0, 0, 0.5)',
  OVERLAY_DARK: 'rgba(0, 0, 0, 0.7)',
} as const;

// Z-Index Layers
export const Z_INDEX = {
  BACKGROUND: -1,
  CONTENT: 0,
  OVERLAY: 100,
  CONTROLS: 200,
  MODAL: 300,
  TOAST: 400,
  TOOLTIP: 500,
} as const;

// Device Capabilities
export const DEVICE_CAPABILITIES = {
  MIN_ANDROID_VERSION: 21, // Android 5.0
  MIN_IOS_VERSION: '11.0',
  REQUIRED_PERMISSIONS: {
    ANDROID: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.WAKE_LOCK',
    ],
    IOS: [
      'NSAppTransportSecurity',
    ],
  },
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ANALYTICS_ENABLED: true,
  OFFLINE_ENABLED: true,
  CACHE_ENABLED: true,
  PIP_ENABLED: true,
  LIVE_STREAMING_ENABLED: true,
  SUBTITLES_ENABLED: true,
  QUALITY_SELECTOR_ENABLED: true,
  PLAYBACK_SPEED_ENABLED: true,
  FULLSCREEN_ENABLED: true,
  SHARING_ENABLED: true,
} as const;

// Regular Expressions
export const REGEX = {
  VIDEO_ID: /^[a-zA-Z0-9_-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  HLS_URL: /\.m3u8(\?.*)?$/,
  DASH_URL: /\.mpd(\?.*)?$/,
  TIME_FORMAT: /^\d{2}:\d{2}:\d{2}$/,
} as const;

// Default Texts (can be localized)
export const DEFAULT_TEXTS = {
  LOADING: 'Loading...',
  ERROR: 'An error occurred',
  NO_INTERNET: 'No internet connection',
  VIDEO_UNAVAILABLE: 'Video unavailable',
  RETRY: 'Retry',
  CANCEL: 'Cancel',
  OK: 'OK',
  PLAY: 'Play',
  PAUSE: 'Pause',
  FULLSCREEN: 'Fullscreen',
  EXIT_FULLSCREEN: 'Exit Fullscreen',
  MUTE: 'Mute',
  UNMUTE: 'Unmute',
  QUALITY: 'Quality',
  SPEED: 'Speed',
  SUBTITLES: 'Subtitles',
  DOWNLOAD: 'Download',
  DELETE: 'Delete',
  SHARE: 'Share',
} as const;
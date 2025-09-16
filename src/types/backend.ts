// Backend API Types - Replacement for Supabase types

// Authentication Types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatar?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Video Types
export interface Video {
  id: string;
  title: string;
  description?: string;
  filename: string;
  fileSize: number;
  duration?: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  videoUrl?: string;
  thumbnailUrl?: string;
  cdnUrl?: string;
  embedCode?: string;
  resolution?: string;
  bitrate?: number;
  codec?: string;
  frameRate?: number;
  views: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoUploadRequest {
  title: string;
  description?: string;
  file: File;
}

export interface VideoUpdateRequest {
  title?: string;
  description?: string;
}

export interface ProcessingLog {
  id: string;
  videoId: string;
  stage: string;
  status: string;
  message?: string;
  progress?: number;
  createdAt: string;
}

// Analytics Types
export interface AnalyticsEvent {
  id: string;
  videoId: string;
  eventType: string;
  userId?: string;
  sessionId?: string;
  timestampPosition?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AnalyticsData {
  timestamp: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  videoIds?: string[];
  metrics?: string[];
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsResponse {
  data: AnalyticsData[];
  total: number;
  period: {
    start: string;
    end: string;
  };
}

export interface VideoStats {
  totalViews: number;
  uniqueViewers: number;
  averageWatchTime: number;
  completionRate: number;
  engagementRate: number;
}

// Live Streaming Types
export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended';
  streamKey: string;
  streamUrl: string;
  playbackUrl: string;
  quality: string;
  framerate: number;
  allowRecording: boolean;
  viewerCount: number;
  maxViewers: number;
  userId: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreamStats {
  viewerCount: number;
  peakViewers: number;
  totalWatchTime: number;
  averageWatchTime: number;
  chatMessages: number;
}

// Subtitle Types
export interface SubtitleTrack {
  id: string;
  videoId: string;
  language: string;
  languageCode: string;
  label: string;
  format: 'srt' | 'vtt';
  fileUrl: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Thumbnail Types
export interface ThumbnailConfig {
  id: string;
  name: string;
  count: number;
  format: 'jpg' | 'png' | 'webp';
  quality: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
  timestamps?: number[];
  enabled: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThumbnailTemplate {
  id: string;
  name: string;
  config: ThumbnailConfig;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoThumbnail {
  id: string;
  videoId: string;
  url: string;
  timestamp: number;
  width: number;
  height: number;
  format: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ThumbnailGenerationJob {
  id: string;
  videoId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  configId?: string;
  templateId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// CDN and Storage Types
export interface CDNConfig {
  id: string;
  userId: string;
  provider: 'bunny' | 'cloudflare' | 'aws';
  settings: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StorageConfig {
  id: string;
  userId: string;
  provider: 'bunny' | 's3' | 'gcs';
  settings: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// White Label Types
export interface WhiteLabelConfig {
  id: string;
  userId: string;
  brandName: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain?: string;
  customCSS?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteLabelAsset {
  id: string;
  userId: string;
  assetType: 'logo' | 'favicon' | 'background' | 'banner';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

// Webhook Types
export interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  deliveredAt?: string;
  createdAt: string;
}

// Plan and Billing Types
export interface UserPlan {
  id: string;
  userId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  startedAt: string;
  expiresAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  maxVideos: number;
  maxStorage: number; // in bytes
  maxBandwidth: number; // in bytes per month
  maxDuration: number; // in seconds
  allowLiveStreaming: boolean;
  allowCustomDomain: boolean;
  allowWhiteLabel: boolean;
  allowAnalytics: boolean;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Security Types
export interface SecurityMetrics {
  timestamp: string;
  threatsDetected: number;
  blockedRequests: number;
  failedAuthentications: number;
  suspiciousActivities: number;
}

export interface ThreatDetection {
  id: string;
  type: 'malware' | 'phishing' | 'spam' | 'abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

// Moderation Types
export interface ModerationRule {
  id: string;
  name: string;
  type: 'content' | 'metadata' | 'custom';
  conditions: Record<string, unknown>;
  action: 'flag' | 'block' | 'review';
  enabled: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationResult {
  id: string;
  videoId: string;
  ruleId: string;
  status: 'pending' | 'approved' | 'rejected';
  confidence: number;
  flags: string[];
  reviewedAt?: string;
  reviewerId?: string;
  createdAt: string;
}

// Performance Types
export interface PerformanceMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  responseTime: number;
  errorRate: number;
}

export interface OptimizationRule {
  id: string;
  name: string;
  type: 'caching' | 'compression' | 'cdn' | 'database';
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  enabled: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

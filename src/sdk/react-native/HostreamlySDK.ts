import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { bunnyConfig } from '../../config/bunnyConfig';
import type { BunnyRegion, BunnyResolution } from '../../config/bunnyConfig';

// Interfaces para React Native SDK
export interface HostreamlyConfig {
  apiKey: string;
  libraryId: string;
  region: BunnyRegion;
  enableOfflineMode: boolean;
  maxCacheSize: number; // MB
  enableAnalytics: boolean;
  enableDRM: boolean;
  customHeaders?: Record<string, string>;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  duration: number;
  thumbnailUrl: string;
  streamUrl: string;
  downloadUrl?: string;
  resolutions: BunnyResolution[];
  chapters?: VideoChapter[];
  subtitles?: SubtitleTrack[];
  metadata?: Record<string, any>;
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  thumbnailUrl?: string;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  isDefault: boolean;
}

export interface PlaybackOptions {
  autoplay?: boolean;
  startTime?: number;
  quality?: BunnyResolution;
  enableAdaptiveStreaming?: boolean;
  enableOfflinePlayback?: boolean;
  enablePictureInPicture?: boolean;
  enableBackgroundPlayback?: boolean;
  playbackRate?: number;
  volume?: number;
}

export interface DownloadOptions {
  quality: BunnyResolution;
  includeSubtitles: boolean;
  priority: 'high' | 'medium' | 'low';
  wifiOnly: boolean;
  deleteAfterDays?: number;
}

export interface DownloadProgress {
  videoId: string;
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  estimatedTimeRemaining?: number; // seconds
}

export interface PlaybackState {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  playbackRate: number;
  volume: number;
  quality: BunnyResolution;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
}

export interface AnalyticsEvent {
  type: 'play' | 'pause' | 'seek' | 'quality_change' | 'fullscreen' | 'error' | 'complete';
  videoId: string;
  timestamp: number;
  currentTime: number;
  data?: Record<string, any>;
}

export interface NetworkInfo {
  isConnected: boolean;
  type: string;
  isWiFi: boolean;
  bandwidth?: number;
}

// Clase principal del SDK
export class HostreamlySDK {
  private static instance: HostreamlySDK;
  private config: HostreamlyConfig;
  private eventEmitter: NativeEventEmitter;
  private isInitialized: boolean = false;
  private downloadQueue: Map<string, DownloadProgress> = new Map();
  private playbackStates: Map<string, PlaybackState> = new Map();
  private analyticsEvents: AnalyticsEvent[] = [];
  private networkInfo: NetworkInfo = { isConnected: false, type: 'unknown', isWiFi: false };

  private constructor() {
    // Singleton pattern
    this.eventEmitter = new NativeEventEmitter(NativeModules.HostreamlyNative);
    this.setupEventListeners();
    this.setupNetworkMonitoring();
  }

  public static getInstance(): HostreamlySDK {
    if (!HostreamlySDK.instance) {
      HostreamlySDK.instance = new HostreamlySDK();
    }
    return HostreamlySDK.instance;
  }

  // Inicialización del SDK
  public async initialize(config: HostreamlyConfig): Promise<boolean> {
    try {
      this.config = config;
      
      // Configurar Bunny CDN
      bunnyConfig.setApiKey(config.apiKey);
      bunnyConfig.setLibraryId(config.libraryId);
      bunnyConfig.setRegion(config.region);
      
      // Inicializar módulo nativo
      if (NativeModules.HostreamlyNative) {
        await NativeModules.HostreamlyNative.initialize(config);
      }
      
      // Configurar almacenamiento offline
      if (config.enableOfflineMode) {
        await this.setupOfflineStorage();
      }
      
      // Configurar analytics
      if (config.enableAnalytics) {
        await this.setupAnalytics();
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Hostreamly SDK initialization failed:', error);
      return false;
    }
  }

  // Métodos de reproducción de video
  public async loadVideo(videoId: string, options?: PlaybackOptions): Promise<VideoMetadata> {
    this.ensureInitialized();
    
    try {
      // Verificar si el video está disponible offline
      const offlineVideo = await this.getOfflineVideo(videoId);
      if (offlineVideo && options?.enableOfflinePlayback) {
        return offlineVideo;
      }
      
      // Cargar video desde Bunny CDN
      const videoUrl = bunnyConfig.getVideoUrl(videoId);
      const metadata = await this.fetchVideoMetadata(videoId);
      
      // Configurar opciones de reproducción
      if (NativeModules.HostreamlyNative) {
        await NativeModules.HostreamlyNative.loadVideo(videoId, {
          ...options,
          streamUrl: metadata.streamUrl
        });
      }
      
      return metadata;
    } catch (error) {
      console.error('Error loading video:', error);
      throw error;
    }
  }

  public async play(videoId: string): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
      await NativeModules.HostreamlyNative.play(videoId);
    }
    
    this.trackAnalyticsEvent({
      type: 'play',
      videoId,
      timestamp: Date.now(),
      currentTime: this.getCurrentTime(videoId)
    });
  }

  public async pause(videoId: string): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
        await NativeModules.HostreamlyNative.pause(videoId);
    }
    
    this.trackAnalyticsEvent({
      type: 'pause',
      videoId,
      timestamp: Date.now(),
      currentTime: this.getCurrentTime(videoId)
    });
  }

  public async seek(videoId: string, time: number): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
        await NativeModules.HostreamlyNative.seek(videoId, time);
    }
    
    this.trackAnalyticsEvent({
      type: 'seek',
      videoId,
      timestamp: Date.now(),
      currentTime: time
    });
  }

  public async setPlaybackRate(videoId: string, rate: number): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
        await NativeModules.HostreamlyNative.setPlaybackRate(videoId, rate);
    }
  }

  public async setVolume(videoId: string, volume: number): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
      await NativeModules.HostreamlyNative.setVolume(videoId, Math.max(0, Math.min(1, volume)));
    }
  }

  public async setQuality(videoId: string, quality: BunnyResolution): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
      await NativeModules.HostreamlyNative.setQuality(videoId, quality);
    }
    
    this.trackAnalyticsEvent({
      type: 'quality_change',
      videoId,
      timestamp: Date.now(),
      currentTime: this.getCurrentTime(videoId),
      data: { quality }
    });
  }

  public async enterFullscreen(videoId: string): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
      await NativeModules.HostreamlyNative.enterFullscreen(videoId);
    }
    
    this.trackAnalyticsEvent({
      type: 'fullscreen',
      videoId,
      timestamp: Date.now(),
      currentTime: this.getCurrentTime(videoId),
      data: { fullscreen: true }
    });
  }

  public async exitFullscreen(videoId: string): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
      await NativeModules.HostreamlyNative.exitFullscreen(videoId);
    }
    
    this.trackAnalyticsEvent({
      type: 'fullscreen',
      videoId,
      timestamp: Date.now(),
      currentTime: this.getCurrentTime(videoId),
      data: { fullscreen: false }
    });
  }

  // Métodos de descarga offline
  public async downloadVideo(videoId: string, options: DownloadOptions): Promise<boolean> {
    this.ensureInitialized();
    
    if (!this.config.enableOfflineMode) {
      throw new Error('Offline mode is not enabled');
    }
    
    // Verificar conexión WiFi si es requerida
    if (options.wifiOnly && !this.networkInfo.isWiFi) {
      throw new Error('WiFi connection required for download');
    }
    
    try {
      const downloadProgress: DownloadProgress = {
        videoId,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        status: 'pending'
      };
      
      this.downloadQueue.set(videoId, downloadProgress);
      
      if (NativeModules.HostreamlyNative) {
        const success = await NativeModules.HostreamlyNative.downloadVideo(videoId, options);
        return success;
      }
      
      return false;
    } catch (error) {
      console.error('Error downloading video:', error);
      return false;
    }
  }

  public async pauseDownload(videoId: string): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
        await NativeModules.HostreamlyNative.pauseDownload(videoId);
    }
    
    const progress = this.downloadQueue.get(videoId);
    if (progress) {
      progress.status = 'paused';
      this.downloadQueue.set(videoId, progress);
    }
  }

  public async resumeDownload(videoId: string): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
        await NativeModules.HostreamlyNative.resumeDownload(videoId);
    }
    
    const progress = this.downloadQueue.get(videoId);
    if (progress) {
      progress.status = 'downloading';
      this.downloadQueue.set(videoId, progress);
    }
  }

  public async cancelDownload(videoId: string): Promise<void> {
    this.ensureInitialized();
    
    if (NativeModules.HostreamlyNative) {
        await NativeModules.HostreamlyNative.cancelDownload(videoId);
    }
    
    this.downloadQueue.delete(videoId);
  }

  public async deleteOfflineVideo(videoId: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      if (NativeModules.HostreamlyNative) {
        await NativeModules.HostreamlyNative.deleteOfflineVideo(videoId);
      }
      
      // Eliminar de AsyncStorage
      await AsyncStorage.removeItem(`offline_video_${videoId}`);
      return true;
    } catch (error) {
      console.error('Error deleting offline video:', error);
      return false;
    }
  }

  public getDownloadProgress(videoId: string): DownloadProgress | null {
    return this.downloadQueue.get(videoId) || null;
  }

  public async getOfflineVideos(): Promise<VideoMetadata[]> {
    this.ensureInitialized();
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_video_'));
      
      const videos: VideoMetadata[] = [];
      for (const key of offlineKeys) {
        const videoData = await AsyncStorage.getItem(key);
        if (videoData) {
          videos.push(JSON.parse(videoData));
        }
      }
      
      return videos;
    } catch (error) {
      console.error('Error getting offline videos:', error);
      return [];
    }
  }

  // Métodos de estado de reproducción
  public getPlaybackState(videoId: string): PlaybackState | null {
    return this.playbackStates.get(videoId) || null;
  }

  public getCurrentTime(videoId: string): number {
    const state = this.playbackStates.get(videoId);
    return state?.currentTime || 0;
  }

  public getDuration(videoId: string): number {
    const state = this.playbackStates.get(videoId);
    return state?.duration || 0;
  }

  public isPlaying(videoId: string): boolean {
    const state = this.playbackStates.get(videoId);
    return state?.isPlaying || false;
  }

  // Métodos de analytics
  public getAnalyticsEvents(): AnalyticsEvent[] {
    return [...this.analyticsEvents];
  }

  public async sendAnalytics(): Promise<boolean> {
    if (!this.config.enableAnalytics || this.analyticsEvents.length === 0) {
      return true;
    }
    
    try {
      // Enviar eventos a Bunny Analytics
      const response = await fetch(`${bunnyConfig.getApiBaseUrl()}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          events: this.analyticsEvents,
          libraryId: this.config.libraryId
        })
      });
      
      if (response.ok) {
        this.analyticsEvents = [];
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sending analytics:', error);
      return false;
    }
  }

  // Métodos de configuración
  public updateConfig(updates: Partial<HostreamlyConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getConfig(): HostreamlyConfig {
    return { ...this.config };
  }

  public getNetworkInfo(): NetworkInfo {
    return { ...this.networkInfo };
  }

  // Métodos de limpieza
  public async cleanup(): Promise<void> {
    // Enviar analytics pendientes
    await this.sendAnalytics();
    
    // Limpiar estados
    this.downloadQueue.clear();
    this.playbackStates.clear();
    this.analyticsEvents = [];
    
    // Cleanup módulo nativo
    if (NativeModules.HostreamlyNative) {
      await NativeModules.HostreamlyNative.cleanup();
    }
    
    this.isInitialized = false;
  }

  // Métodos privados
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Hostreamly SDK is not initialized. Call initialize() first.');
    }
  }

  private async setupOfflineStorage(): Promise<void> {
    try {
      // Configurar límites de almacenamiento
      const maxCacheSize = this.config.maxCacheSize * 1024 * 1024; // Convert MB to bytes
      
      if (NativeModules.HostreamlyNative) {
      await NativeModules.HostreamlyNative.setupOfflineStorage(maxCacheSize);
      }
    } catch (error) {
      console.error('Error setting up offline storage:', error);
    }
  }

  private async setupAnalytics(): Promise<void> {
    // Configurar envío automático de analytics cada 30 segundos
    setInterval(() => {
      this.sendAnalytics();
    }, 30000);
  }

  private setupEventListeners(): void {
    // Eventos de reproducción
    this.eventEmitter.addListener('playbackStateChanged', (data: PlaybackState) => {
      this.playbackStates.set(data.videoId, data);
    });
    
    // Eventos de descarga
    this.eventEmitter.addListener('downloadProgressChanged', (data: DownloadProgress) => {
      this.downloadQueue.set(data.videoId, data);
    });
    
    // Eventos de error
    this.eventEmitter.addListener('playbackError', (data: { videoId: string; error: string }) => {
      this.trackAnalyticsEvent({
        type: 'error',
        videoId: data.videoId,
        timestamp: Date.now(),
        currentTime: this.getCurrentTime(data.videoId),
        data: { error: data.error }
      });
    });
    
    // Eventos de finalización
    this.eventEmitter.addListener('playbackComplete', (data: { videoId: string }) => {
      this.trackAnalyticsEvent({
        type: 'complete',
        videoId: data.videoId,
        timestamp: Date.now(),
        currentTime: this.getDuration(data.videoId)
      });
    });
  }

  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      this.networkInfo = {
        isConnected: state.isConnected || false,
        type: state.type,
        isWiFi: state.type === 'wifi',
        bandwidth: state.details?.downlinkMax
      };
    });
  }

  private async fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
    const response = await fetch(`${bunnyConfig.getApiBaseUrl()}/library/${this.config.libraryId}/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video metadata: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.guid,
      title: data.title,
      description: data.description,
      duration: data.length,
      thumbnailUrl: bunnyConfig.getThumbnailUrl(videoId),
      streamUrl: bunnyConfig.getVideoUrl(videoId),
      downloadUrl: bunnyConfig.getDownloadUrl(videoId),
      resolutions: data.availableResolutions || ['240p', '360p', '480p', '720p', '1080p'],
      chapters: data.chapters || [],
      subtitles: data.captions || [],
      metadata: data.metadata || {}
    };
  }

  private async getOfflineVideo(videoId: string): Promise<VideoMetadata | null> {
    try {
      const videoData = await AsyncStorage.getItem(`offline_video_${videoId}`);
      return videoData ? JSON.parse(videoData) : null;
    } catch (error) {
      console.error('Error getting offline video:', error);
      return null;
    }
  }

  private trackAnalyticsEvent(event: AnalyticsEvent): void {
    if (!this.config.enableAnalytics) return;
    
    this.analyticsEvents.push(event);
    
    // Limitar el número de eventos en memoria
    if (this.analyticsEvents.length > 1000) {
      this.analyticsEvents = this.analyticsEvents.slice(-500);
    }
  }
}

// Hook personalizado para React Native
export const useHostreamly = () => {
  const sdk = HostreamlySDK.getInstance();
  
  return {
    // Métodos de inicialización
    initialize: sdk.initialize.bind(sdk),
    cleanup: sdk.cleanup.bind(sdk),
    
    // Métodos de reproducción
    loadVideo: sdk.loadVideo.bind(sdk),
    play: sdk.play.bind(sdk),
    pause: sdk.pause.bind(sdk),
    seek: sdk.seek.bind(sdk),
    setPlaybackRate: sdk.setPlaybackRate.bind(sdk),
    setVolume: sdk.setVolume.bind(sdk),
    setQuality: sdk.setQuality.bind(sdk),
    enterFullscreen: sdk.enterFullscreen.bind(sdk),
    exitFullscreen: sdk.exitFullscreen.bind(sdk),
    
    // Métodos offline
    downloadVideo: sdk.downloadVideo.bind(sdk),
    pauseDownload: sdk.pauseDownload.bind(sdk),
    resumeDownload: sdk.resumeDownload.bind(sdk),
    cancelDownload: sdk.cancelDownload.bind(sdk),
    deleteOfflineVideo: sdk.deleteOfflineVideo.bind(sdk),
    getDownloadProgress: sdk.getDownloadProgress.bind(sdk),
    getOfflineVideos: sdk.getOfflineVideos.bind(sdk),
    
    // Métodos de estado
    getPlaybackState: sdk.getPlaybackState.bind(sdk),
    getCurrentTime: sdk.getCurrentTime.bind(sdk),
    getDuration: sdk.getDuration.bind(sdk),
    isPlaying: sdk.isPlaying.bind(sdk),
    
    // Métodos de analytics
    getAnalyticsEvents: sdk.getAnalyticsEvents.bind(sdk),
    sendAnalytics: sdk.sendAnalytics.bind(sdk),
    
    // Métodos de configuración
    updateConfig: sdk.updateConfig.bind(sdk),
    getConfig: sdk.getConfig.bind(sdk),
    getNetworkInfo: sdk.getNetworkInfo.bind(sdk)
  };
};

export default HostreamlySDK;
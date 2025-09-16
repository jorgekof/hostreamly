// Configuración para Bunny.net CDN y Stream
export interface BunnyStreamConfig {
  libraryId: string;
  apiKey: string;
  cdnUrl: string;
  streamUrl: string;
  pullZoneId?: string;
  storageZoneName?: string;
  region?: 'de' | 'ny' | 'la' | 'sg' | 'syd';
}

export interface BunnyCDNConfig {
  pullZoneId: string;
  apiKey: string;
  cdnUrl: string;
  storageZoneName: string;
  region: 'de' | 'ny' | 'la' | 'sg' | 'syd';
}

export interface BunnyVideoConfig {
  libraryId: string;
  apiKey: string;
  collectionId?: string;
  webhookUrl?: string;
  allowedOrigins?: string[];
  playerKeyColor?: string;
  enabledResolutions?: string[];
  watermarkUrl?: string;
  captionsFontSize?: number;
  captionsBackground?: boolean;
}

// Configuración principal de Bunny.net
export class BunnyConfig {
  private static instance: BunnyConfig;
  
  public readonly stream: BunnyStreamConfig;
  public readonly cdn: BunnyCDNConfig;
  public readonly video: BunnyVideoConfig;

  private constructor() {
    // Configuración de Bunny Stream
    this.stream = {
      libraryId: process.env.VITE_BUNNY_LIBRARY_ID || '',
      apiKey: process.env.VITE_BUNNY_API_KEY || '',
      cdnUrl: process.env.VITE_BUNNY_CDN_URL || 'https://iframe.mediadelivery.net',
      streamUrl: process.env.VITE_BUNNY_STREAM_URL || 'https://video.bunnycdn.com',
      pullZoneId: process.env.VITE_BUNNY_PULL_ZONE_ID,
      storageZoneName: process.env.VITE_BUNNY_STORAGE_ZONE,
      region: (process.env.VITE_BUNNY_REGION as any) || 'de'
    };

    // Configuración de Bunny CDN
    this.cdn = {
      pullZoneId: process.env.VITE_BUNNY_PULL_ZONE_ID || '',
      apiKey: process.env.VITE_BUNNY_CDN_API_KEY || process.env.VITE_BUNNY_API_KEY || '',
      cdnUrl: process.env.VITE_BUNNY_CDN_URL || '',
      storageZoneName: process.env.VITE_BUNNY_STORAGE_ZONE || '',
      region: (process.env.VITE_BUNNY_REGION as any) || 'de'
    };

    // Configuración de Bunny Video
    this.video = {
      libraryId: this.stream.libraryId,
      apiKey: this.stream.apiKey,
      collectionId: process.env.VITE_BUNNY_COLLECTION_ID,
      webhookUrl: process.env.VITE_BUNNY_WEBHOOK_URL,
      allowedOrigins: process.env.VITE_BUNNY_ALLOWED_ORIGINS?.split(',') || ['*'],
      playerKeyColor: process.env.VITE_BUNNY_PLAYER_COLOR || '#007bff',
      enabledResolutions: process.env.VITE_BUNNY_RESOLUTIONS?.split(',') || ['240p', '360p', '480p', '720p', '1080p'],
      watermarkUrl: process.env.VITE_BUNNY_WATERMARK_URL,
      captionsFontSize: parseInt(process.env.VITE_BUNNY_CAPTIONS_FONT_SIZE || '16'),
      captionsBackground: process.env.VITE_BUNNY_CAPTIONS_BACKGROUND === 'true'
    };
  }

  public static getInstance(): BunnyConfig {
    if (!BunnyConfig.instance) {
      BunnyConfig.instance = new BunnyConfig();
    }
    return BunnyConfig.instance;
  }

  // Métodos de validación
  public validateStreamConfig(): boolean {
    return !!(this.stream.libraryId && this.stream.apiKey);
  }

  public validateCDNConfig(): boolean {
    return !!(this.cdn.pullZoneId && this.cdn.apiKey && this.cdn.cdnUrl);
  }

  public validateVideoConfig(): boolean {
    return !!(this.video.libraryId && this.video.apiKey);
  }

  // Métodos para generar URLs
  public getStreamUrl(videoId: string): string {
    return `${this.stream.cdnUrl}/embed/${this.stream.libraryId}/${videoId}`;
  }

  public getThumbnailUrl(videoId: string, width: number = 1280, height: number = 720): string {
    return `${this.stream.cdnUrl}/embed/${this.stream.libraryId}/${videoId}/thumbnail.jpg?width=${width}&height=${height}`;
  }

  public getDirectPlayUrl(videoId: string, resolution?: string): string {
    const baseUrl = `${this.stream.cdnUrl}/play/${this.stream.libraryId}/${videoId}`;
    return resolution ? `${baseUrl}/${resolution}.mp4` : `${baseUrl}/playlist.m3u8`;
  }

  public getCDNUrl(path: string): string {
    return `${this.cdn.cdnUrl}/${path}`;
  }

  // Métodos para configuración de player
  public getPlayerConfig(videoId: string, customOptions?: any): any {
    return {
      library: this.stream.libraryId,
      video: videoId,
      divId: customOptions?.containerId || 'bunny-player',
      aspectRatio: customOptions?.aspectRatio || '16:9',
      autoplay: customOptions?.autoplay || false,
      controls: customOptions?.controls !== false,
      muted: customOptions?.muted || false,
      loop: customOptions?.loop || false,
      preload: customOptions?.preload || 'metadata',
      responsive: customOptions?.responsive !== false,
      keyColor: customOptions?.keyColor || this.video.playerKeyColor,
      watermark: {
        url: customOptions?.watermarkUrl || this.video.watermarkUrl,
        position: customOptions?.watermarkPosition || 'bottom-right',
        opacity: customOptions?.watermarkOpacity || 0.8
      },
      captions: {
        fontSize: customOptions?.captionsFontSize || this.video.captionsFontSize,
        background: customOptions?.captionsBackground ?? this.video.captionsBackground,
        color: customOptions?.captionsColor || '#ffffff'
      },
      analytics: {
        enabled: true,
        trackEvents: ['play', 'pause', 'ended', 'timeupdate', 'volumechange', 'fullscreenchange']
      }
    };
  }

  // Métodos para headers de API
  public getStreamHeaders(): Record<string, string> {
    return {
      'AccessKey': this.stream.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  public getCDNHeaders(): Record<string, string> {
    return {
      'AccessKey': this.cdn.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Métodos para URLs de API
  public getStreamApiUrl(endpoint: string): string {
    return `${this.stream.streamUrl}/library/${this.stream.libraryId}${endpoint}`;
  }

  public getCDNApiUrl(endpoint: string): string {
    return `https://api.bunny.net${endpoint}`;
  }

  // Configuración de regiones
  public getRegionEndpoint(region?: string): string {
    const selectedRegion = region || this.stream.region;
    const endpoints = {
      'de': 'https://video.bunnycdn.com', // Frankfurt
      'ny': 'https://ny.video.bunnycdn.com', // New York
      'la': 'https://la.video.bunnycdn.com', // Los Angeles
      'sg': 'https://sg.video.bunnycdn.com', // Singapore
      'syd': 'https://syd.video.bunnycdn.com' // Sydney
    };
    return endpoints[selectedRegion] || endpoints.de;
  }

  // Configuración de calidad adaptativa
  public getAdaptiveStreamingConfig(): any {
    return {
      enableAdaptiveBitrate: true,
      resolutions: this.video.enabledResolutions,
      bitrateSettings: {
        '240p': { bitrate: 400, width: 426, height: 240 },
        '360p': { bitrate: 800, width: 640, height: 360 },
        '480p': { bitrate: 1200, width: 854, height: 480 },
        '720p': { bitrate: 2500, width: 1280, height: 720 },
        '1080p': { bitrate: 5000, width: 1920, height: 1080 }
      },
      adaptationSettings: {
        maxBitrate: 5000,
        minBitrate: 400,
        startBitrate: 1200,
        bufferLength: 30,
        switchUpThreshold: 0.8,
        switchDownThreshold: 0.4
      }
    };
  }

  // Configuración de DRM básico
  public getDRMConfig(): any {
    return {
      enableTokenAuth: true,
      tokenExpiration: 3600, // 1 hora
      allowedReferrers: this.video.allowedOrigins,
      geoBlocking: {
        enabled: false,
        allowedCountries: [],
        blockedCountries: []
      },
      ipBlocking: {
        enabled: false,
        allowedIPs: [],
        blockedIPs: []
      }
    };
  }
}

// Exportar instancia singleton
export const bunnyConfig = BunnyConfig.getInstance();

// Tipos de utilidad
export type BunnyRegion = 'de' | 'ny' | 'la' | 'sg' | 'syd';
export type BunnyResolution = '240p' | '360p' | '480p' | '720p' | '1080p';
export type BunnyPlayerEvent = 'play' | 'pause' | 'ended' | 'timeupdate' | 'volumechange' | 'fullscreenchange';
import { bunnyConfig } from '../config/bunnyConfig';
import type { BunnyRegion, BunnyResolution } from '../config/bunnyConfig';

// Interfaces para optimización de rendimiento
export interface NetworkConditions {
  bandwidth: number; // Mbps
  latency: number; // ms
  packetLoss: number; // %
  connectionType: 'wifi' | '4g' | '3g' | '2g' | 'ethernet' | 'unknown';
  isStable: boolean;
}

export interface DeviceCapabilities {
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  maxResolution: BunnyResolution;
  hardwareAcceleration: boolean;
  memoryGB: number;
  cpuCores: number;
  isMobile: boolean;
}

export interface CacheStrategy {
  videoSegments: {
    preloadSegments: number;
    maxCacheSize: number; // MB
    evictionPolicy: 'lru' | 'fifo' | 'adaptive';
  };
  thumbnails: {
    cacheSize: number; // MB
    preloadCount: number;
  };
  metadata: {
    ttl: number; // seconds
    maxEntries: number;
  };
}

export interface StreamingQuality {
  resolution: BunnyResolution;
  bitrate: number;
  fps: number;
  codec: 'h264' | 'h265' | 'av1';
  adaptiveEnabled: boolean;
}

export interface PerformanceMetrics {
  bufferHealth: number; // seconds
  rebufferCount: number;
  startupTime: number; // ms
  bitrateChanges: number;
  droppedFrames: number;
  networkUtilization: number; // %
  cacheHitRate: number; // %
  cdnLatency: number; // ms
}

// Clase principal para optimización de rendimiento
export class BunnyPerformanceOptimizer {
  private networkMonitor: NetworkMonitor;
  private cacheManager: IntelligentCacheManager;
  private adaptiveStreaming: AdaptiveStreamingEngine;
  private deviceAnalyzer: DeviceAnalyzer;
  private metricsCollector: PerformanceMetricsCollector;
  
  private currentQuality: StreamingQuality;
  private performanceMetrics: PerformanceMetrics;
  private optimizationEnabled: boolean = true;

  constructor() {
    this.networkMonitor = new NetworkMonitor();
    this.cacheManager = new IntelligentCacheManager();
    this.adaptiveStreaming = new AdaptiveStreamingEngine();
    this.deviceAnalyzer = new DeviceAnalyzer();
    this.metricsCollector = new PerformanceMetricsCollector();
    
    this.currentQuality = this.getDefaultQuality();
    this.performanceMetrics = this.getInitialMetrics();
    
    this.initializeOptimizations();
  }

  // Métodos principales de optimización
  async optimizeForDevice(videoId: string): Promise<StreamingQuality> {
    const deviceCaps = await this.deviceAnalyzer.analyzeDevice();
    const networkConds = await this.networkMonitor.getCurrentConditions();
    
    const optimalQuality = this.calculateOptimalQuality(deviceCaps, networkConds);
    
    // Configurar caché basado en capacidades del dispositivo
    await this.cacheManager.configureForDevice(deviceCaps);
    
    // Configurar streaming adaptativo
    await this.adaptiveStreaming.configure(optimalQuality, networkConds);
    
    this.currentQuality = optimalQuality;
    return optimalQuality;
  }

  async preloadContent(videoIds: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const deviceCaps = await this.deviceAnalyzer.analyzeDevice();
    const networkConds = await this.networkMonitor.getCurrentConditions();
    
    // Determinar estrategia de precarga basada en condiciones
    const preloadStrategy = this.calculatePreloadStrategy(deviceCaps, networkConds, priority);
    
    for (const videoId of videoIds) {
      await this.cacheManager.preloadVideo(videoId, preloadStrategy);
    }
  }

  async optimizePlayback(videoId: string, playerElement: HTMLVideoElement): Promise<void> {
    // Monitorear rendimiento en tiempo real
    this.metricsCollector.startMonitoring(playerElement);
    
    // Configurar streaming adaptativo
    await this.adaptiveStreaming.startAdaptivePlayback(videoId, playerElement);
    
    // Optimizar caché durante reproducción
    this.cacheManager.optimizeDuringPlayback(videoId);
  }

  // Métodos para obtener configuraciones optimizadas
  getOptimizedPlayerConfig(videoId: string): any {
    const baseConfig = bunnyConfig.getPlayerConfig(videoId);
    const deviceCaps = this.deviceAnalyzer.getLastAnalysis();
    const networkConds = this.networkMonitor.getLastConditions();
    
    return {
      ...baseConfig,
      preload: this.getOptimalPreloadStrategy(networkConds),
      bufferLength: this.getOptimalBufferLength(networkConds),
      maxBitrate: this.getMaxBitrate(deviceCaps, networkConds),
      adaptiveBitrate: {
        enabled: true,
        algorithm: 'bunny-optimized',
        switchUpThreshold: networkConds.isStable ? 0.8 : 0.9,
        switchDownThreshold: networkConds.isStable ? 0.4 : 0.6
      },
      performance: {
        hardwareAcceleration: deviceCaps.hardwareAcceleration,
        lowLatencyMode: networkConds.latency < 25,
        powerSaveMode: deviceCaps.isMobile && this.isBatteryLow()
      }
    };
  }

  getBestCDNEndpoint(userLocation?: { lat: number; lng: number }): string {
    // Seleccionar el endpoint de CDN más cercano
    const regions: { region: BunnyRegion; location: { lat: number; lng: number } }[] = [
      { region: 'de', location: { lat: 50.1109, lng: 8.6821 } }, // Frankfurt
      { region: 'ny', location: { lat: 40.7128, lng: -74.0060 } }, // New York
      { region: 'la', location: { lat: 34.0522, lng: -118.2437 } }, // Los Angeles
      { region: 'sg', location: { lat: 1.3521, lng: 103.8198 } }, // Singapore
      { region: 'syd', location: { lat: -33.8688, lng: 151.2093 } } // Sydney
    ];

    if (!userLocation) {
      // Usar región por defecto si no hay ubicación
      return bunnyConfig.getRegionEndpoint();
    }

    // Calcular distancia a cada región
    const distances = regions.map(region => ({
      region: region.region,
      distance: this.calculateDistance(userLocation, region.location)
    }));

    // Seleccionar la región más cercana
    const closest = distances.reduce((min, current) => 
      current.distance < min.distance ? current : min
    );

    return bunnyConfig.getRegionEndpoint(closest.region);
  }

  // Métodos para métricas y monitoreo
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  async generatePerformanceReport(): Promise<{
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
    metrics: PerformanceMetrics;
    optimizations: string[];
  }> {
    const metrics = this.getCurrentMetrics();
    const deviceCaps = await this.deviceAnalyzer.analyzeDevice();
    const networkConds = await this.networkMonitor.getCurrentConditions();
    
    const overall = this.calculateOverallPerformance(metrics);
    const recommendations = this.generateRecommendations(metrics, deviceCaps, networkConds);
    const optimizations = this.getActiveOptimizations();
    
    return {
      overall,
      recommendations,
      metrics,
      optimizations
    };
  }

  // Métodos de configuración
  enableOptimization(enabled: boolean): void {
    this.optimizationEnabled = enabled;
    if (enabled) {
      this.initializeOptimizations();
    } else {
      this.disableOptimizations();
    }
  }

  updateCacheStrategy(strategy: Partial<CacheStrategy>): void {
    this.cacheManager.updateStrategy(strategy);
  }

  // Métodos privados
  private initializeOptimizations(): void {
    this.networkMonitor.startMonitoring();
    this.cacheManager.initialize();
    this.adaptiveStreaming.initialize();
  }

  private disableOptimizations(): void {
    this.networkMonitor.stopMonitoring();
    this.cacheManager.cleanup();
    this.adaptiveStreaming.disable();
  }

  private calculateOptimalQuality(device: DeviceCapabilities, network: NetworkConditions): StreamingQuality {
    // Determinar resolución óptima basada en pantalla y ancho de banda
    let resolution: BunnyResolution = '480p';
    
    if (network.bandwidth >= 5 && device.screenWidth >= 1920) {
      resolution = '1080p';
    } else if (network.bandwidth >= 2.5 && device.screenWidth >= 1280) {
      resolution = '720p';
    } else if (network.bandwidth >= 1.2) {
      resolution = '480p';
    } else if (network.bandwidth >= 0.8) {
      resolution = '360p';
    } else {
      resolution = '240p';
    }

    // Ajustar por condiciones de red
    if (!network.isStable || network.packetLoss > 2) {
      resolution = this.downgradeResolution(resolution);
    }

    const bitrateSettings = bunnyConfig.getAdaptiveStreamingConfig().bitrateSettings;
    const bitrate = bitrateSettings[resolution]?.bitrate || 1200;

    return {
      resolution,
      bitrate,
      fps: device.isMobile ? 30 : 60,
      codec: device.hardwareAcceleration ? 'h265' : 'h264',
      adaptiveEnabled: true
    };
  }

  private calculatePreloadStrategy(device: DeviceCapabilities, network: NetworkConditions, priority: string): any {
    const baseStrategy = {
      segments: priority === 'high' ? 10 : priority === 'medium' ? 5 : 2,
      quality: this.currentQuality.resolution,
      thumbnails: priority === 'high' ? 20 : 10
    };

    // Ajustar por condiciones de red
    if (network.bandwidth < 1) {
      baseStrategy.segments = Math.max(1, Math.floor(baseStrategy.segments / 2));
    }

    // Ajustar por capacidades del dispositivo
    if (device.memoryGB < 2) {
      baseStrategy.segments = Math.min(baseStrategy.segments, 3);
    }

    return baseStrategy;
  }

  private getDefaultQuality(): StreamingQuality {
    return {
      resolution: '720p',
      bitrate: 2500,
      fps: 30,
      codec: 'h264',
      adaptiveEnabled: true
    };
  }

  private getInitialMetrics(): PerformanceMetrics {
    return {
      bufferHealth: 0,
      rebufferCount: 0,
      startupTime: 0,
      bitrateChanges: 0,
      droppedFrames: 0,
      networkUtilization: 0,
      cacheHitRate: 0,
      cdnLatency: 0
    };
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLng = this.deg2rad(point2.lng - point1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private downgradeResolution(resolution: BunnyResolution): BunnyResolution {
    const resolutions: BunnyResolution[] = ['240p', '360p', '480p', '720p', '1080p'];
    const currentIndex = resolutions.indexOf(resolution);
    return currentIndex > 0 ? resolutions[currentIndex - 1] : resolution;
  }

  private getOptimalPreloadStrategy(network: NetworkConditions): 'none' | 'metadata' | 'auto' {
    if (network.bandwidth < 0.5) return 'none';
    if (network.bandwidth < 2) return 'metadata';
    return 'auto';
  }

  private getOptimalBufferLength(network: NetworkConditions): number {
    if (network.isStable && network.bandwidth > 5) return 30;
    if (network.isStable && network.bandwidth > 2) return 20;
    return 10;
  }

  private getMaxBitrate(device: DeviceCapabilities, network: NetworkConditions): number {
    const networkLimit = network.bandwidth * 1000 * 0.8; // 80% del ancho de banda
    const deviceLimit = device.maxResolution === '1080p' ? 5000 : 
                       device.maxResolution === '720p' ? 2500 : 1200;
    return Math.min(networkLimit, deviceLimit);
  }

  private isBatteryLow(): boolean {
    // @ts-ignore - Battery API experimental
    if ('getBattery' in navigator) {
      // Implementar detección de batería baja
      return false;
    }
    return false;
  }

  private calculateOverallPerformance(metrics: PerformanceMetrics): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 100;
    
    if (metrics.startupTime > 3000) score -= 20;
    if (metrics.rebufferCount > 2) score -= 30;
    if (metrics.cacheHitRate < 80) score -= 15;
    if (metrics.droppedFrames > 10) score -= 20;
    
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private generateRecommendations(metrics: PerformanceMetrics, device: DeviceCapabilities, network: NetworkConditions): string[] {
    const recommendations: string[] = [];
    
    if (metrics.startupTime > 3000) {
      recommendations.push('Considerar reducir la calidad inicial para mejorar el tiempo de inicio');
    }
    
    if (metrics.rebufferCount > 2) {
      recommendations.push('Activar precarga más agresiva o reducir calidad de video');
    }
    
    if (network.bandwidth < 2) {
      recommendations.push('Conexión lenta detectada - usar calidad adaptativa conservadora');
    }
    
    if (device.memoryGB < 2) {
      recommendations.push('Memoria limitada - reducir tamaño de caché y precarga');
    }
    
    return recommendations;
  }

  private getActiveOptimizations(): string[] {
    const optimizations: string[] = [];
    
    if (this.optimizationEnabled) {
      optimizations.push('Streaming adaptativo habilitado');
      optimizations.push('Caché inteligente activo');
      optimizations.push('Monitoreo de red en tiempo real');
      optimizations.push('Optimización automática de calidad');
    }
    
    return optimizations;
  }
}

// Clases auxiliares
class NetworkMonitor {
  private conditions: NetworkConditions;
  private monitoring: boolean = false;
  
  constructor() {
    this.conditions = this.getInitialConditions();
  }
  
  startMonitoring(): void {
    this.monitoring = true;
    this.updateConditions();
  }
  
  stopMonitoring(): void {
    this.monitoring = false;
  }
  
  async getCurrentConditions(): Promise<NetworkConditions> {
    if (this.monitoring) {
      await this.updateConditions();
    }
    return { ...this.conditions };
  }
  
  getLastConditions(): NetworkConditions {
    return { ...this.conditions };
  }
  
  private async updateConditions(): Promise<void> {
    // Implementar detección de condiciones de red
    // @ts-ignore - Connection API experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      this.conditions.connectionType = this.mapConnectionType(connection.effectiveType);
      this.conditions.bandwidth = this.estimateBandwidth(connection);
    }
  }
  
  private getInitialConditions(): NetworkConditions {
    return {
      bandwidth: 2.5,
      latency: 100,
      packetLoss: 0,
      connectionType: 'unknown',
      isStable: true
    };
  }
  
  private mapConnectionType(effectiveType: string): NetworkConditions['connectionType'] {
    switch (effectiveType) {
      case 'slow-2g': return '2g';
      case '2g': return '2g';
      case '3g': return '3g';
      case '4g': return '4g';
      default: return 'unknown';
    }
  }
  
  private estimateBandwidth(connection: any): number {
    if (connection.downlink) {
      return connection.downlink;
    }
    
    // Estimaciones basadas en tipo de conexión
    switch (connection.effectiveType) {
      case 'slow-2g': return 0.05;
      case '2g': return 0.25;
      case '3g': return 1.5;
      case '4g': return 10;
      default: return 2.5;
    }
  }
}

class IntelligentCacheManager {
  private strategy: CacheStrategy;
  private cache: Map<string, any> = new Map();
  
  constructor() {
    this.strategy = this.getDefaultStrategy();
  }
  
  initialize(): void {
    // Inicializar sistema de caché
  }
  
  cleanup(): void {
    this.cache.clear();
  }
  
  async configureForDevice(device: DeviceCapabilities): Promise<void> {
    // Ajustar estrategia de caché basada en capacidades del dispositivo
    if (device.memoryGB < 2) {
      this.strategy.videoSegments.maxCacheSize = 50;
      this.strategy.thumbnails.cacheSize = 10;
    } else if (device.memoryGB < 4) {
      this.strategy.videoSegments.maxCacheSize = 100;
      this.strategy.thumbnails.cacheSize = 25;
    }
  }
  
  async preloadVideo(videoId: string, strategy: any): Promise<void> {
    // Implementar precarga de video
  }
  
  optimizeDuringPlayback(videoId: string): void {
    // Optimizar caché durante reproducción
  }
  
  updateStrategy(newStrategy: Partial<CacheStrategy>): void {
    this.strategy = { ...this.strategy, ...newStrategy };
  }
  
  private getDefaultStrategy(): CacheStrategy {
    return {
      videoSegments: {
        preloadSegments: 5,
        maxCacheSize: 200,
        evictionPolicy: 'adaptive'
      },
      thumbnails: {
        cacheSize: 50,
        preloadCount: 10
      },
      metadata: {
        ttl: 3600,
        maxEntries: 1000
      }
    };
  }
}

class AdaptiveStreamingEngine {
  private enabled: boolean = false;
  
  initialize(): void {
    this.enabled = true;
  }
  
  disable(): void {
    this.enabled = false;
  }
  
  async configure(quality: StreamingQuality, network: NetworkConditions): Promise<void> {
    // Configurar motor de streaming adaptativo
  }
  
  async startAdaptivePlayback(videoId: string, playerElement: HTMLVideoElement): Promise<void> {
    // Iniciar reproducción adaptativa
  }
}

class DeviceAnalyzer {
  private lastAnalysis: DeviceCapabilities | null = null;
  
  async analyzeDevice(): Promise<DeviceCapabilities> {
    const analysis: DeviceCapabilities = {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      maxResolution: this.determineMaxResolution(),
      hardwareAcceleration: this.detectHardwareAcceleration(),
      memoryGB: this.estimateMemory(),
      cpuCores: navigator.hardwareConcurrency || 4,
      isMobile: this.isMobileDevice()
    };
    
    this.lastAnalysis = analysis;
    return analysis;
  }
  
  getLastAnalysis(): DeviceCapabilities {
    return this.lastAnalysis || this.getDefaultCapabilities();
  }
  
  private determineMaxResolution(): BunnyResolution {
    const width = window.screen.width;
    if (width >= 1920) return '1080p';
    if (width >= 1280) return '720p';
    if (width >= 854) return '480p';
    if (width >= 640) return '360p';
    return '240p';
  }
  
  private detectHardwareAcceleration(): boolean {
    // Detectar aceleración por hardware (simplificado)
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  }
  
  private estimateMemory(): number {
    // @ts-ignore - Memory API experimental
    if ('memory' in performance) {
      // @ts-ignore
      return performance.memory.jsHeapSizeLimit / (1024 * 1024 * 1024);
    }
    return 4; // Estimación por defecto
  }
  
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  private getDefaultCapabilities(): DeviceCapabilities {
    return {
      screenWidth: 1920,
      screenHeight: 1080,
      devicePixelRatio: 1,
      maxResolution: '1080p',
      hardwareAcceleration: true,
      memoryGB: 4,
      cpuCores: 4,
      isMobile: false
    };
  }
}

class PerformanceMetricsCollector {
  private metrics: PerformanceMetrics;
  private monitoring: boolean = false;
  
  constructor() {
    this.metrics = this.getInitialMetrics();
  }
  
  startMonitoring(playerElement: HTMLVideoElement): void {
    this.monitoring = true;
    this.attachEventListeners(playerElement);
  }
  
  stopMonitoring(): void {
    this.monitoring = false;
  }
  
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  private attachEventListeners(player: HTMLVideoElement): void {
    // Implementar listeners para recopilar métricas
  }
  
  private getInitialMetrics(): PerformanceMetrics {
    return {
      bufferHealth: 0,
      rebufferCount: 0,
      startupTime: 0,
      bitrateChanges: 0,
      droppedFrames: 0,
      networkUtilization: 0,
      cacheHitRate: 0,
      cdnLatency: 0
    };
  }
}

// Hook personalizado para usar el optimizador de rendimiento
export const useBunnyPerformanceOptimizer = () => {
  const optimizer = new BunnyPerformanceOptimizer();
  
  return {
    optimizeForDevice: optimizer.optimizeForDevice.bind(optimizer),
    preloadContent: optimizer.preloadContent.bind(optimizer),
    optimizePlayback: optimizer.optimizePlayback.bind(optimizer),
    getOptimizedConfig: optimizer.getOptimizedPlayerConfig.bind(optimizer),
    getBestCDN: optimizer.getBestCDNEndpoint.bind(optimizer),
    getMetrics: optimizer.getCurrentMetrics.bind(optimizer),
    generateReport: optimizer.generatePerformanceReport.bind(optimizer),
    enableOptimization: optimizer.enableOptimization.bind(optimizer)
  };
};
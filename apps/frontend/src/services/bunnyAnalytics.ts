import { BunnyStreamConfig } from '../config/bunnyConfig';

// Interfaces para el sistema de analytics
export interface VideoMetrics {
  videoId: string;
  views: number;
  uniqueViews: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
  engagementScore: number;
  bounceRate: number;
  clickThroughRate: number;
  conversionRate: number;
  revenue: number;
  timestamp: Date;
}

export interface ViewerEngagement {
  sessionId: string;
  userId?: string;
  videoId: string;
  watchTime: number;
  pauseCount: number;
  seekCount: number;
  volumeChanges: number;
  fullscreenToggle: number;
  qualityChanges: number;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'tv';
  browser: string;
  location: {
    country: string;
    region: string;
    city: string;
  };
  referrer: string;
  timestamp: Date;
}

export interface ConversionEvent {
  eventId: string;
  videoId: string;
  userId?: string;
  eventType: 'signup' | 'purchase' | 'subscription' | 'download' | 'share' | 'like';
  eventValue: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface AnalyticsDashboardData {
  overview: {
    totalViews: number;
    totalRevenue: number;
    averageEngagement: number;
    topPerformingVideos: VideoMetrics[];
  };
  realTimeMetrics: {
    currentViewers: number;
    viewsLastHour: number;
    revenueLastHour: number;
    topCountries: Array<{ country: string; views: number }>;
  };
  trends: {
    viewsTrend: Array<{ date: string; views: number }>;
    engagementTrend: Array<{ date: string; engagement: number }>;
    revenueTrend: Array<{ date: string; revenue: number }>;
  };
}

// Clase principal para el sistema de analytics
export class BunnyAnalyticsSystem {
  private config: BunnyStreamConfig;
  private apiKey: string;
  private baseUrl: string;
  private metricsCache: Map<string, VideoMetrics> = new Map();
  private engagementBuffer: ViewerEngagement[] = [];
  private conversionBuffer: ConversionEvent[] = [];

  constructor(config: BunnyStreamConfig) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://video.bunnycdn.com/library';
    
    // Inicializar buffers y cache
    this.startPeriodicSync();
  }

  // Métodos para tracking de métricas en tiempo real
  async trackVideoView(videoId: string, viewerData: Partial<ViewerEngagement>): Promise<void> {
    const engagement: ViewerEngagement = {
      sessionId: this.generateSessionId(),
      videoId,
      watchTime: 0,
      pauseCount: 0,
      seekCount: 0,
      volumeChanges: 0,
      fullscreenToggle: 0,
      qualityChanges: 0,
      deviceType: this.detectDeviceType(),
      browser: this.detectBrowser(),
      location: await this.getViewerLocation(),
      referrer: document.referrer,
      timestamp: new Date(),
      ...viewerData
    };

    this.engagementBuffer.push(engagement);
    
    // Enviar a Bunny Stream Analytics API
    await this.sendEngagementData(engagement);
  }

  async trackConversion(videoId: string, conversionData: Partial<ConversionEvent>): Promise<void> {
    const conversion: ConversionEvent = {
      eventId: this.generateEventId(),
      videoId,
      eventType: 'signup',
      eventValue: 0,
      timestamp: new Date(),
      metadata: {},
      ...conversionData
    };

    this.conversionBuffer.push(conversion);
    await this.sendConversionData(conversion);
  }

  // Métodos para obtener métricas desde Bunny Stream API
  async getVideoMetrics(videoId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<VideoMetrics> {
    const cacheKey = `${videoId}_${timeRange}`;
    
    if (this.metricsCache.has(cacheKey)) {
      const cached = this.metricsCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp.getTime() < 300000) { // 5 minutos de cache
        return cached;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.config.libraryId}/videos/${videoId}/statistics`, {
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error fetching metrics: ${response.statusText}`);
      }

      const data = await response.json();
      const metrics = this.transformBunnyMetrics(data, videoId);
      
      this.metricsCache.set(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching video metrics:', error);
      throw error;
    }
  }

  async getDashboardData(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<AnalyticsDashboardData> {
    try {
      // Obtener métricas generales de la biblioteca
      const libraryStats = await this.getLibraryStatistics(timeRange);
      
      // Obtener métricas en tiempo real
      const realTimeData = await this.getRealTimeMetrics();
      
      // Obtener tendencias
      const trends = await this.getTrendData(timeRange);

      return {
        overview: {
          totalViews: libraryStats.totalViews,
          totalRevenue: libraryStats.totalRevenue,
          averageEngagement: libraryStats.averageEngagement,
          topPerformingVideos: libraryStats.topVideos
        },
        realTimeMetrics: realTimeData,
        trends
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Métodos para análisis avanzado
  async getEngagementAnalysis(videoId: string): Promise<{
    heatmap: Array<{ time: number; engagement: number }>;
    dropOffPoints: Array<{ time: number; dropOffRate: number }>;
    peakEngagement: { time: number; engagement: number };
  }> {
    const engagementData = this.engagementBuffer.filter(e => e.videoId === videoId);
    
    // Generar mapa de calor de engagement
    const heatmap = this.generateEngagementHeatmap(engagementData);
    
    // Identificar puntos de abandono
    const dropOffPoints = this.identifyDropOffPoints(engagementData);
    
    // Encontrar pico de engagement
    const peakEngagement = this.findPeakEngagement(heatmap);

    return { heatmap, dropOffPoints, peakEngagement };
  }

  async getConversionFunnel(videoIds: string[]): Promise<{
    stages: Array<{ stage: string; count: number; rate: number }>;
    totalConversions: number;
    conversionRate: number;
  }> {
    const conversions = this.conversionBuffer.filter(c => videoIds.includes(c.videoId));
    
    const stages = [
      { stage: 'Views', count: 0, rate: 100 },
      { stage: 'Engagement', count: 0, rate: 0 },
      { stage: 'Conversions', count: conversions.length, rate: 0 }
    ];

    // Calcular métricas del funnel
    const totalViews = await this.getTotalViews(videoIds);
    const engagedViewers = this.getEngagedViewers(videoIds);
    
    stages[0].count = totalViews;
    stages[1].count = engagedViewers;
    stages[1].rate = (engagedViewers / totalViews) * 100;
    stages[2].rate = (conversions.length / totalViews) * 100;

    return {
      stages,
      totalConversions: conversions.length,
      conversionRate: stages[2].rate
    };
  }

  // Métodos de utilidad privados
  private async sendEngagementData(engagement: ViewerEngagement): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${this.config.libraryId}/analytics/engagement`, {
        method: 'POST',
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(engagement)
      });
    } catch (error) {
      console.error('Error sending engagement data:', error);
    }
  }

  private async sendConversionData(conversion: ConversionEvent): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${this.config.libraryId}/analytics/conversions`, {
        method: 'POST',
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(conversion)
      });
    } catch (error) {
      console.error('Error sending conversion data:', error);
    }
  }

  private transformBunnyMetrics(bunnyData: any, videoId: string): VideoMetrics {
    return {
      videoId,
      views: bunnyData.viewsChart?.reduce((sum: number, item: any) => sum + item.views, 0) || 0,
      uniqueViews: bunnyData.uniqueViews || 0,
      totalWatchTime: bunnyData.watchTimeChart?.reduce((sum: number, item: any) => sum + item.watchTime, 0) || 0,
      averageWatchTime: bunnyData.averageWatchTime || 0,
      completionRate: bunnyData.completionRate || 0,
      engagementScore: this.calculateEngagementScore(bunnyData),
      bounceRate: bunnyData.bounceRate || 0,
      clickThroughRate: bunnyData.clickThroughRate || 0,
      conversionRate: this.calculateConversionRate(videoId),
      revenue: this.calculateRevenue(videoId),
      timestamp: new Date()
    };
  }

  private calculateEngagementScore(data: any): number {
    const watchTimeScore = Math.min((data.averageWatchTime / data.duration) * 100, 100);
    const completionScore = data.completionRate || 0;
    const interactionScore = (data.pauseCount + data.seekCount) / data.views * 10;
    
    return (watchTimeScore * 0.5 + completionScore * 0.3 + interactionScore * 0.2);
  }

  private calculateConversionRate(videoId: string): number {
    const conversions = this.conversionBuffer.filter(c => c.videoId === videoId).length;
    const views = this.metricsCache.get(videoId)?.views || 1;
    return (conversions / views) * 100;
  }

  private calculateRevenue(videoId: string): number {
    return this.conversionBuffer
      .filter(c => c.videoId === videoId)
      .reduce((sum, c) => sum + c.eventValue, 0);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' | 'tv' {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private async getViewerLocation(): Promise<{ country: string; region: string; city: string }> {
    try {
      // En producción, esto se obtendría del servidor o de una API de geolocalización
      return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
    } catch {
      return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
    }
  }

  private async getLibraryStatistics(timeRange: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${this.config.libraryId}/statistics?timeRange=${timeRange}`, {
      headers: {
        'AccessKey': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  private async getRealTimeMetrics(): Promise<any> {
    // Implementar métricas en tiempo real
    return {
      currentViewers: this.engagementBuffer.filter(e => 
        Date.now() - e.timestamp.getTime() < 300000 // Últimos 5 minutos
      ).length,
      viewsLastHour: this.engagementBuffer.filter(e => 
        Date.now() - e.timestamp.getTime() < 3600000 // Última hora
      ).length,
      revenueLastHour: this.conversionBuffer
        .filter(c => Date.now() - c.timestamp.getTime() < 3600000)
        .reduce((sum, c) => sum + c.eventValue, 0),
      topCountries: this.getTopCountries()
    };
  }

  private async getTrendData(timeRange: string): Promise<any> {
    // Implementar datos de tendencias
    return {
      viewsTrend: [],
      engagementTrend: [],
      revenueTrend: []
    };
  }

  private generateEngagementHeatmap(engagementData: ViewerEngagement[]): Array<{ time: number; engagement: number }> {
    // Generar mapa de calor basado en datos de engagement
    return [];
  }

  private identifyDropOffPoints(engagementData: ViewerEngagement[]): Array<{ time: number; dropOffRate: number }> {
    // Identificar puntos donde los usuarios abandonan el video
    return [];
  }

  private findPeakEngagement(heatmap: Array<{ time: number; engagement: number }>): { time: number; engagement: number } {
    return heatmap.reduce((peak, current) => 
      current.engagement > peak.engagement ? current : peak, 
      { time: 0, engagement: 0 }
    );
  }

  private async getTotalViews(videoIds: string[]): Promise<number> {
    let totalViews = 0;
    for (const videoId of videoIds) {
      const metrics = await this.getVideoMetrics(videoId);
      totalViews += metrics.views;
    }
    return totalViews;
  }

  private getEngagedViewers(videoIds: string[]): number {
    return this.engagementBuffer
      .filter(e => videoIds.includes(e.videoId) && e.watchTime > 30) // Más de 30 segundos
      .length;
  }

  private getTopCountries(): Array<{ country: string; views: number }> {
    const countryMap = new Map<string, number>();
    
    this.engagementBuffer.forEach(e => {
      const country = e.location.country;
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    return Array.from(countryMap.entries())
      .map(([country, views]) => ({ country, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  private startPeriodicSync(): void {
    // Sincronizar datos cada 5 minutos
    setInterval(() => {
      this.syncBufferedData();
    }, 300000);
  }

  private async syncBufferedData(): Promise<void> {
    // Enviar datos en buffer a Bunny Stream Analytics
    if (this.engagementBuffer.length > 0) {
      const batch = this.engagementBuffer.splice(0, 100); // Procesar en lotes
      for (const engagement of batch) {
        await this.sendEngagementData(engagement);
      }
    }

    if (this.conversionBuffer.length > 0) {
      const batch = this.conversionBuffer.splice(0, 100);
      for (const conversion of batch) {
        await this.sendConversionData(conversion);
      }
    }
  }
}

// Hook personalizado para usar el sistema de analytics
export const useBunnyAnalytics = () => {
  const config = {
    libraryId: process.env.VITE_BUNNY_LIBRARY_ID || '',
    apiKey: process.env.VITE_BUNNY_API_KEY || ''
  };

  const analytics = new BunnyAnalyticsSystem(config);

  return {
    trackView: analytics.trackVideoView.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    getMetrics: analytics.getVideoMetrics.bind(analytics),
    getDashboard: analytics.getDashboardData.bind(analytics),
    getEngagementAnalysis: analytics.getEngagementAnalysis.bind(analytics),
    getConversionFunnel: analytics.getConversionFunnel.bind(analytics)
  };
};
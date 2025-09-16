// API simulada para métricas de rendimiento
// En un entorno real, esto sería un endpoint del servidor

export interface PerformanceMetricsPayload {
  sessionId: string;
  timestamp: number;
  url: string;
  userAgent: string;
  metrics: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    domContentLoaded?: number;
    loadComplete?: number;
    resourceLoadTimes?: Array<{
      name: string;
      duration: number;
      size?: number;
      type: string;
    }>;
    customMetrics?: Record<string, number>;
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connectionType?: string;
    effectiveType?: string;
  };
  userContext?: {
    userId?: string;
    sessionDuration?: number;
    pageViews?: number;
    deviceType?: string;
    browserName?: string;
    browserVersion?: string;
    osName?: string;
    osVersion?: string;
    screenResolution?: string;
    viewportSize?: string;
    colorDepth?: number;
    pixelRatio?: number;
    timezone?: string;
    language?: string;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

// Simulación de almacenamiento local para métricas
class PerformanceMetricsStore {
  private metrics: PerformanceMetricsPayload[] = [];
  private alerts: PerformanceAlert[] = [];

  async saveMetrics(payload: PerformanceMetricsPayload): Promise<void> {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    this.metrics.push(payload);
    
    // Generar alertas si es necesario
    this.generateAlerts(payload);
    
    // Mantener solo las últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
  
  }

  async getMetrics(filters?: {
    startTime?: number;
    endTime?: number;
    url?: string;
    sessionId?: string;
  }): Promise<PerformanceMetricsPayload[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    let filteredMetrics = [...this.metrics];
    
    if (filters) {
      if (filters.startTime) {
        filteredMetrics = filteredMetrics.filter(m => m.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        filteredMetrics = filteredMetrics.filter(m => m.timestamp <= filters.endTime!);
      }
      if (filters.url) {
        filteredMetrics = filteredMetrics.filter(m => m.url.includes(filters.url!));
      }
      if (filters.sessionId) {
        filteredMetrics = filteredMetrics.filter(m => m.sessionId === filters.sessionId);
      }
    }
    
    return filteredMetrics;
  }

  async getAlerts(filters?: {
    type?: 'warning' | 'error' | 'info';
    startTime?: number;
    endTime?: number;
  }): Promise<PerformanceAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 30));
    
    let filteredAlerts = [...this.alerts];
    
    if (filters) {
      if (filters.type) {
        filteredAlerts = filteredAlerts.filter(a => a.type === filters.type);
      }
      if (filters.startTime) {
        filteredAlerts = filteredAlerts.filter(a => a.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        filteredAlerts = filteredAlerts.filter(a => a.timestamp <= filters.endTime!);
      }
    }
    
    return filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getAggregatedMetrics(timeRange: '1h' | '24h' | '7d' | '30d'): Promise<{
    avgLcp: number;
    avgFid: number;
    avgCls: number;
    avgFcp: number;
    avgTtfb: number;
    p75Lcp: number;
    p75Fid: number;
    p75Cls: number;
    totalSessions: number;
    totalPageViews: number;
    bounceRate: number;
    errorRate: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const now = Date.now();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange];
    
    const recentMetrics = this.metrics.filter(m => 
      m.timestamp >= now - timeRangeMs
    );
    
    if (recentMetrics.length === 0) {
      return {
        avgLcp: 0,
        avgFid: 0,
        avgCls: 0,
        avgFcp: 0,
        avgTtfb: 0,
        p75Lcp: 0,
        p75Fid: 0,
        p75Cls: 0,
        totalSessions: 0,
        totalPageViews: 0,
        bounceRate: 0,
        errorRate: 0,
      };
    }
    
    // Calcular promedios
    const lcpValues = recentMetrics.map(m => m.metrics.lcp).filter(Boolean) as number[];
    const fidValues = recentMetrics.map(m => m.metrics.fid).filter(Boolean) as number[];
    const clsValues = recentMetrics.map(m => m.metrics.cls).filter(Boolean) as number[];
    const fcpValues = recentMetrics.map(m => m.metrics.fcp).filter(Boolean) as number[];
    const ttfbValues = recentMetrics.map(m => m.metrics.ttfb).filter(Boolean) as number[];
    
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const p75 = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil(sorted.length * 0.75) - 1;
      return sorted[index] || 0;
    };
    
    const uniqueSessions = new Set(recentMetrics.map(m => m.sessionId)).size;
    
    return {
      avgLcp: avg(lcpValues),
      avgFid: avg(fidValues),
      avgCls: avg(clsValues),
      avgFcp: avg(fcpValues),
      avgTtfb: avg(ttfbValues),
      p75Lcp: p75(lcpValues),
      p75Fid: p75(fidValues),
      p75Cls: p75(clsValues),
      totalSessions: uniqueSessions,
      totalPageViews: recentMetrics.length,
      bounceRate: Math.random() * 0.3 + 0.2, // Simulado
      errorRate: Math.random() * 0.05, // Simulado
    };
  }

  private generateAlerts(payload: PerformanceMetricsPayload): void {
    const { metrics } = payload;
    const alerts: PerformanceAlert[] = [];
    
    // Alertas para LCP
    if (metrics.lcp && metrics.lcp > 4000) {
      alerts.push({
        id: `lcp-${Date.now()}-${Math.random()}`,
        type: 'error',
        metric: 'LCP',
        value: metrics.lcp,
        threshold: 4000,
        message: `LCP muy lento: ${metrics.lcp.toFixed(0)}ms (umbral: 4000ms)`,
        timestamp: payload.timestamp,
        url: payload.url,
        userAgent: payload.userAgent,
      });
    } else if (metrics.lcp && metrics.lcp > 2500) {
      alerts.push({
        id: `lcp-${Date.now()}-${Math.random()}`,
        type: 'warning',
        metric: 'LCP',
        value: metrics.lcp,
        threshold: 2500,
        message: `LCP necesita mejora: ${metrics.lcp.toFixed(0)}ms (umbral: 2500ms)`,
        timestamp: payload.timestamp,
        url: payload.url,
        userAgent: payload.userAgent,
      });
    }
    
    // Alertas para FID
    if (metrics.fid && metrics.fid > 300) {
      alerts.push({
        id: `fid-${Date.now()}-${Math.random()}`,
        type: 'error',
        metric: 'FID',
        value: metrics.fid,
        threshold: 300,
        message: `FID muy lento: ${metrics.fid.toFixed(0)}ms (umbral: 300ms)`,
        timestamp: payload.timestamp,
        url: payload.url,
        userAgent: payload.userAgent,
      });
    } else if (metrics.fid && metrics.fid > 100) {
      alerts.push({
        id: `fid-${Date.now()}-${Math.random()}`,
        type: 'warning',
        metric: 'FID',
        value: metrics.fid,
        threshold: 100,
        message: `FID necesita mejora: ${metrics.fid.toFixed(0)}ms (umbral: 100ms)`,
        timestamp: payload.timestamp,
        url: payload.url,
        userAgent: payload.userAgent,
      });
    }
    
    // Alertas para CLS
    if (metrics.cls && metrics.cls > 0.25) {
      alerts.push({
        id: `cls-${Date.now()}-${Math.random()}`,
        type: 'error',
        metric: 'CLS',
        value: metrics.cls,
        threshold: 0.25,
        message: `CLS muy alto: ${metrics.cls.toFixed(3)} (umbral: 0.25)`,
        timestamp: payload.timestamp,
        url: payload.url,
        userAgent: payload.userAgent,
      });
    } else if (metrics.cls && metrics.cls > 0.1) {
      alerts.push({
        id: `cls-${Date.now()}-${Math.random()}`,
        type: 'warning',
        metric: 'CLS',
        value: metrics.cls,
        threshold: 0.1,
        message: `CLS necesita mejora: ${metrics.cls.toFixed(3)} (umbral: 0.1)`,
        timestamp: payload.timestamp,
        url: payload.url,
        userAgent: payload.userAgent,
      });
    }
    
    this.alerts.push(...alerts);
    
    // Mantener solo las últimas 500 alertas
    if (this.alerts.length > 500) {
      this.alerts = this.alerts.slice(-500);
    }
  }

  clearData(): void {
    this.metrics = [];
    this.alerts = [];
  }
}

// Instancia global del store
const metricsStore = new PerformanceMetricsStore();

// API endpoints simulados
export const performanceAPI = {
  // Enviar métricas de rendimiento
  async sendMetrics(payload: PerformanceMetricsPayload): Promise<{ success: boolean; id: string }> {
    try {
      await metricsStore.saveMetrics(payload);
      return {
        success: true,
        id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('Error saving performance metrics:', error);
      throw new Error('Failed to save performance metrics');
    }
  },

  // Obtener métricas históricas
  async getMetrics(filters?: {
    startTime?: number;
    endTime?: number;
    url?: string;
    sessionId?: string;
  }): Promise<PerformanceMetricsPayload[]> {
    return metricsStore.getMetrics(filters);
  },

  // Obtener alertas de rendimiento
  async getAlerts(filters?: {
    type?: 'warning' | 'error' | 'info';
    startTime?: number;
    endTime?: number;
  }): Promise<PerformanceAlert[]> {
    return metricsStore.getAlerts(filters);
  },

  // Obtener métricas agregadas
  async getAggregatedMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    return metricsStore.getAggregatedMetrics(timeRange);
  },

  // Limpiar datos (útil para testing)
  clearData(): void {
    metricsStore.clearData();
  },

  // Obtener estadísticas del sistema
  async getSystemStats(): Promise<{
    totalMetrics: number;
    totalAlerts: number;
    activeAlerts: number;
    lastMetricTime: number | null;
  }> {
    const metrics = await metricsStore.getMetrics();
    const alerts = await metricsStore.getAlerts();
    const recentAlerts = alerts.filter(a => a.timestamp > Date.now() - 24 * 60 * 60 * 1000);
    
    return {
      totalMetrics: metrics.length,
      totalAlerts: alerts.length,
      activeAlerts: recentAlerts.length,
      lastMetricTime: metrics.length > 0 ? Math.max(...metrics.map(m => m.timestamp)) : null,
    };
  }
};

// Interceptor para simular el endpoint /api/performance-metrics
if (typeof window !== 'undefined') {
  // Interceptar fetch para el endpoint de métricas
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    if (url.includes('/api/performance-metrics')) {
      if (init?.method === 'POST') {
        try {
          const payload = JSON.parse(init.body as string) as PerformanceMetricsPayload;
          const result = await performanceAPI.sendMetrics(payload);
          
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to process metrics' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    return originalFetch(input, init);
  };
}

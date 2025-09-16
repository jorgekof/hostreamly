import { useEffect, useState } from 'react';

// Interfaces adicionales para tipos específicos
interface PerformanceResourceTiming extends PerformanceEntry {
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Navigation Timing
  navigationStart?: number;
  domContentLoaded?: number;
  loadComplete?: number;

  // Resource Timing
  resourceLoadTimes?: ResourceTiming[];

  // Custom Metrics
  customMetrics?: Record<string, number>;

  // User Context
  userAgent?: string;
  connection?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;

  // Page Context
  url?: string;
  referrer?: string;
  timestamp?: number;
  sessionId?: string;
  userId?: string;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size?: number;
  type: 'script' | 'stylesheet' | 'image' | 'fetch' | 'other';
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  url: string;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private sessionId: string;
  private isInitialized = false;
  private alertThresholds = {
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    fcp: 1800, // 1.8s
    ttfb: 800, // 800ms
  };

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Inicializa el servicio de monitoreo de rendimiento
   */
  public initialize(config?: {
    enableCoreWebVitals?: boolean;
    enableResourceTiming?: boolean;
    enableNavigationTiming?: boolean;
    enableCustomMetrics?: boolean;
    enableUserContext?: boolean;
    sampleRate?: number;
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
  }): void {
    if (this.isInitialized) {
      console.warn('Performance monitoring is already initialized');
      return;
    }

    this.isInitialized = true;
    this.initializeMonitoring();
    
    console.log('Performance monitoring initialized with config:', config);
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicializa todos los observadores de rendimiento
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.setupCoreWebVitals();
    this.setupNavigationTiming();
    this.setupResourceTiming();
    this.setupUserContext();
    this.setupCustomMetrics();
  }

  /**
   * Configura el monitoreo de Core Web Vitals
   */
  private setupCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry;
          if (lastEntry) {
            this.metrics.lcp = lastEntry.startTime;
            this.checkAlert('lcp', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP observer failed:', error);
      }
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: PerformanceEntry) => {
            if (entry.name === 'first-input') {
              this.metrics.fid = entry.processingStart - entry.startTime;
              this.checkAlert('fid', this.metrics.fid);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID observer failed:', error);
      }
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: PerformanceEntry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.checkAlert('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('CLS observer failed:', error);
      }
    }

    // First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: PerformanceEntry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.checkAlert('fcp', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('fcp', fcpObserver);
      } catch (error) {
        console.warn('FCP observer failed:', error);
      }
    }
  }

  /**
   * Configura el monitoreo de Navigation Timing
   */
  private setupNavigationTiming(): void {
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      this.metrics.navigationStart = timing.navigationStart;
      this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      this.metrics.loadComplete = timing.loadEventEnd - timing.navigationStart;
      this.metrics.ttfb = timing.responseStart - timing.navigationStart;
      
      if (this.metrics.ttfb) {
        this.checkAlert('ttfb', this.metrics.ttfb);
      }
    }
  }

  /**
   * Configura el monitoreo de Resource Timing
   */
  private setupResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const resourceTimes: ResourceTiming[] = entries.map((entry: PerformanceResourceTiming) => ({
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            type: this.getResourceType(entry.name)
          }));
          
          this.metrics.resourceLoadTimes = [
            ...(this.metrics.resourceLoadTimes || []),
            ...resourceTimes
          ];
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Resource timing observer failed:', error);
      }
    }
  }

  /**
   * Configura el contexto del usuario
   */
  private setupUserContext(): void {
    this.metrics.userAgent = navigator.userAgent;
    this.metrics.url = window.location.href;
    this.metrics.referrer = document.referrer;
    this.metrics.timestamp = Date.now();
    this.metrics.sessionId = this.sessionId;

    // Connection info
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
      this.metrics.connection = connection?.effectiveType || 'unknown';
    }

    // Device memory
    if ('deviceMemory' in navigator) {
      this.metrics.deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    }

    // Hardware concurrency
    if ('hardwareConcurrency' in navigator) {
      this.metrics.hardwareConcurrency = navigator.hardwareConcurrency;
    }
  }

  /**
   * Configura métricas personalizadas
   */
  private setupCustomMetrics(): void {
    this.metrics.customMetrics = {};
    
    // Track React render times
    this.trackReactRenderTime();
    
    // Track chunk load times
    this.trackChunkLoadTime();
  }

  /**
   * Rastrea el tiempo de renderizado de React
   */
  private trackReactRenderTime(): void {
    if ('performance' in window && 'mark' in performance) {
      // Hook into React DevTools if available
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        hook.onCommitFiberRoot = (id: number, root: unknown, priorityLevel: number) => {
          const renderTime = performance.now();
          this.addCustomMetric('react_render_time', renderTime);
        };
      }
    }
  }

  /**
   * Rastrea el tiempo de carga de chunks
   */
  private trackChunkLoadTime(): void {
    // Monitor dynamic imports
    const originalImport = window.import || (() => {});
    if (originalImport) {
      window.import = async (specifier: string) => {
        const startTime = performance.now();
        try {
          const result = await originalImport(specifier);
          const loadTime = performance.now() - startTime;
          this.addCustomMetric(`chunk_load_${specifier}`, loadTime);
          return result;
        } catch (error) {
          const loadTime = performance.now() - startTime;
          this.addCustomMetric(`chunk_load_error_${specifier}`, loadTime);
          throw error;
        }
      };
    }
  }

  private getResourceType(url: string): ResourceTiming['type'] {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.includes('/api/') || url.includes('fetch')) return 'fetch';
    return 'other';
  }

  private checkAlert(metric: keyof typeof this.alertThresholds, value: number): void {
    const threshold = this.alertThresholds[metric];
    if (value > threshold) {
      const alert: PerformanceAlert = {
        id: `${metric}-${Date.now()}`,
        type: value > threshold * 1.5 ? 'critical' : 'warning',
        metric,
        value,
        threshold,
        message: `${metric.toUpperCase()} exceeded threshold: ${value}ms > ${threshold}ms`,
        timestamp: Date.now(),
        url: window.location.href
      };
      
      this.sendAlert(alert);
    }
  }

  private async sendAlert(alert: PerformanceAlert): Promise<void> {
    try {
      // Store alert in local storage or send to analytics service
      // For now, just log the alert to avoid network errors
      console.warn('Performance Alert:', alert);
      
      // Optional: Store in localStorage for debugging
      const alerts = JSON.parse(localStorage.getItem('performance-alerts') || '[]');
      alerts.push({ ...alert, timestamp: new Date().toISOString() });
      localStorage.setItem('performance-alerts', JSON.stringify(alerts.slice(-50))); // Keep last 50 alerts
    } catch (error) {
      console.warn('Failed to process performance alert:', error);
    }
  }

  /**
   * Obtiene las métricas actuales
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Añade una métrica personalizada
   */
  public addCustomMetric(name: string, value: number): void {
    if (!this.metrics.customMetrics) {
      this.metrics.customMetrics = {};
    }
    this.metrics.customMetrics[name] = value;
  }

  /**
   * Mide el tiempo de una operación
   */
  public measureOperation<T>(name: string, operation: () => T | Promise<T>): T | Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = operation();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - startTime;
          this.addCustomMetric(name, duration);
        });
      } else {
        const duration = performance.now() - startTime;
        this.addCustomMetric(name, duration);
        return result;
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.addCustomMetric(`${name}_error`, duration);
      throw error;
    }
  }

  /**
   * Envía las métricas al servidor
   */
  public async sendMetrics(): Promise<void> {
    try {
      // Store metrics in local storage for debugging
      // In a real implementation, this would send to your analytics service
      console.log('Performance Metrics:', this.metrics);
      
      const metricsHistory = JSON.parse(localStorage.getItem('performance-metrics') || '[]');
      metricsHistory.push({ ...this.metrics, timestamp: new Date().toISOString() });
      localStorage.setItem('performance-metrics', JSON.stringify(metricsHistory.slice(-20))); // Keep last 20 metrics
    } catch (error) {
      console.warn('Failed to process performance metrics:', error);
    }
  }

  /**
   * Genera un reporte de rendimiento
   */
  public generateReport(): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    recommendations: string[];
    metrics: PerformanceMetrics;
  } {
    const recommendations: string[] = [];
    let score = 100;

    // Evaluar LCP
    if (this.metrics.lcp) {
      if (this.metrics.lcp > 4000) {
        score -= 30;
        recommendations.push('Optimize Largest Contentful Paint (LCP) - consider image optimization and server response times');
      } else if (this.metrics.lcp > 2500) {
        score -= 15;
        recommendations.push('Improve Largest Contentful Paint (LCP) - optimize critical resources');
      }
    }

    // Evaluar FID
    if (this.metrics.fid) {
      if (this.metrics.fid > 300) {
        score -= 25;
        recommendations.push('Reduce First Input Delay (FID) - minimize JavaScript execution time');
      } else if (this.metrics.fid > 100) {
        score -= 10;
        recommendations.push('Optimize First Input Delay (FID) - consider code splitting');
      }
    }

    // Evaluar CLS
    if (this.metrics.cls) {
      if (this.metrics.cls > 0.25) {
        score -= 20;
        recommendations.push('Fix Cumulative Layout Shift (CLS) - ensure proper image and ad dimensions');
      } else if (this.metrics.cls > 0.1) {
        score -= 10;
        recommendations.push('Improve Cumulative Layout Shift (CLS) - optimize layout stability');
      }
    }

    // Evaluar FCP
    if (this.metrics.fcp) {
      if (this.metrics.fcp > 3000) {
        score -= 15;
        recommendations.push('Optimize First Contentful Paint (FCP) - improve server response and critical CSS');
      }
    }

    // Determinar grado
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      score: Math.max(0, score),
      grade,
      recommendations,
      metrics: this.getMetrics()
    };
  }

  /**
   * Limpia todos los observadores
   */
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.isInitialized = false;
  }
}

// Instancia global del servicio
export const performanceMonitoring = new PerformanceMonitoringService();

// Hook de React para usar el servicio de monitoreo
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitoring.getMetrics());
      setIsLoading(false);
    };

    // Actualizar métricas cada segundo
    const interval = setInterval(updateMetrics, 1000);
    
    // Actualización inicial
    updateMetrics();

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    metrics,
    isLoading,
    addCustomMetric: (name: string, value: number) => performanceMonitoring.addCustomMetric(name, value),
    measureOperation: <T>(name: string, operation: () => T | Promise<T>) => 
      performanceMonitoring.measureOperation(name, operation),
    generateReport: () => performanceMonitoring.generateReport(),
    sendMetrics: () => performanceMonitoring.sendMetrics()
  };
};

// Utilidades de rendimiento
export const performanceUtils = {
  /**
   * Marca un punto en el tiempo
   */
  mark(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  },

  /**
   * Mide el tiempo entre dos marcas
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        return entries.length > 0 ? entries[entries.length - 1].duration : null;
      } catch (error) {
        console.warn('Performance measure failed:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Obtiene información de memoria (si está disponible)
   */
  getMemoryInfo(): MemoryInfo | null {
    if ('performance' in window && 'memory' in performance) {
      return (performance as Performance & { memory?: MemoryInfo }).memory || null;
    }
    return null;
  },
};

// Declaración de tipos globales
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: { onCommitFiberRoot?: (id: number, root: unknown, priorityLevel: number) => void };
    import?: (specifier: string) => Promise<unknown>;
  }
}

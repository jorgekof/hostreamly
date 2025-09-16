// Performance utilities for Hostreamly

/**
 * Debounce function to limit the rate of function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Lazy loading utility for images
 */
export function lazyLoadImage(img: HTMLImageElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement;
            image.src = src;
            image.onload = () => {
              image.classList.add('loaded');
              observer.unobserve(image);
              resolve();
            };
            image.onerror = () => {
              observer.unobserve(image);
              reject(new Error('Failed to load image'));
            };
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
    
    observer.observe(img);
  });
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Measure and log performance metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startMeasure(name: string): void {
    this.metrics.set(name, performance.now());
  }
  
  endMeasure(name: string): number {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(`No start time found for metric: ${name}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.metrics.delete(name);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    return fn().finally(() => {
      this.endMeasure(name);
    });
  }
}

/**
 * Optimize images for better performance
 */
export function optimizeImageUrl(url: string, width?: number, quality?: number): string {
  if (!url) return '';
  
  // If it's already optimized or external, return as is
  if (url.includes('?') || url.startsWith('http')) {
    return url;
  }
  
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (quality) params.set('q', quality.toString());
  
  return params.toString() ? `${url}?${params.toString()}` : url;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get connection speed information
 */
export function getConnectionSpeed(): string {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'unknown';
  
  return connection.effectiveType || 'unknown';
}

/**
 * Adaptive loading based on connection speed
 */
export function shouldLoadHighQuality(): boolean {
  const speed = getConnectionSpeed();
  return ['4g', 'unknown'].includes(speed);
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): { used: number; total: number } | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576) // MB
    };
  }
  return null;
}

/**
 * Cleanup function for component unmounting
 */
export function createCleanup(): {
  add: (fn: () => void) => void;
  cleanup: () => void;
} {
  const cleanupFunctions: (() => void)[] = [];
  
  return {
    add: (fn: () => void) => cleanupFunctions.push(fn),
    cleanup: () => {
      cleanupFunctions.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });
      cleanupFunctions.length = 0;
    }
  };
}
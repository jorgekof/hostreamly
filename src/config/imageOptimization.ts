// Configuración centralizada para optimización de imágenes

export interface ImageOptimizationConfig {
  // Formatos soportados por prioridad
  supportedFormats: string[];
  // Calidades por tipo de imagen
  qualitySettings: {
    thumbnail: number;
    preview: number;
    fullsize: number;
  };
  // Tamaños de breakpoints para responsive images
  breakpoints: number[];
  // Configuración de lazy loading
  lazyLoading: {
    rootMargin: string;
    threshold: number;
  };
  // Configuración de placeholders
  placeholders: {
    blur: {
      width: number;
      height: number;
      quality: number;
    };
    color: string;
  };
  // CDN settings
  cdn: {
    baseUrl?: string;
    transformParams: {
      webp: string;
      avif: string;
      quality: string;
      resize: string;
    };
  };
}

export const defaultImageConfig: ImageOptimizationConfig = {
  supportedFormats: ['avif', 'webp', 'jpg', 'png'],
  qualitySettings: {
    thumbnail: 75,
    preview: 85,
    fullsize: 90,
  },
  breakpoints: [320, 640, 768, 1024, 1280, 1536],
  lazyLoading: {
    rootMargin: '50px',
    threshold: 0.1,
  },
  placeholders: {
    blur: {
      width: 10,
      height: 10,
      quality: 10,
    },
    color: '#f3f4f6',
  },
  cdn: {
    transformParams: {
      webp: 'f_webp',
      avif: 'f_avif',
      quality: 'q_auto',
      resize: 'c_fill',
    },
  },
};

// Utilidades para generar URLs optimizadas
export class ImageOptimizer {
  private config: ImageOptimizationConfig;

  constructor(config: ImageOptimizationConfig = defaultImageConfig) {
    this.config = config;
  }

  /**
   * Genera una URL optimizada para una imagen
   */
  generateOptimizedUrl(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'auto';
    } = {}
  ): string {
    if (!this.config.cdn.baseUrl) {
      return src;
    }

    const { width, height, quality, format = 'auto' } = options;
    const params = new URLSearchParams();

    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (quality) params.append('q', quality.toString());
    if (format !== 'auto') {
      params.append('f', format);
    }

    const queryString = params.toString();
    const separator = src.includes('?') ? '&' : '?';
    
    return queryString ? `${src}${separator}${queryString}` : src;
  }

  /**
   * Genera un srcSet para imágenes responsive
   */
  generateSrcSet(
    src: string,
    options: {
      sizes?: number[];
      quality?: number;
      format?: 'webp' | 'avif' | 'auto';
    } = {}
  ): string {
    const { sizes = this.config.breakpoints, quality, format } = options;
    
    return sizes
      .map(size => {
        const optimizedUrl = this.generateOptimizedUrl(src, {
          width: size,
          quality,
          format,
        });
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  }

  /**
   * Genera un placeholder blur data URL
   */
  generateBlurPlaceholder(
    src: string,
    options: {
      width?: number;
      height?: number;
    } = {}
  ): string {
    const { width = 10, height = 10 } = options;
    
    // Generar un SVG blur placeholder simple
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur">
            <feGaussianBlur stdDeviation="2"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="${this.config.placeholders.color}" filter="url(#blur)"/>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Detecta el soporte de formatos modernos
   */
  async detectFormatSupport(): Promise<{
    webp: boolean;
    avif: boolean;
  }> {
    const webpSupport = await this.checkFormatSupport('webp');
    const avifSupport = await this.checkFormatSupport('avif');
    
    return { webp: webpSupport, avif: avifSupport };
  }

  private checkFormatSupport(format: 'webp' | 'avif'): Promise<boolean> {
    return new Promise((resolve) => {
      const testImages = {
        webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      };

      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = testImages[format];
    });
  }

  /**
   * Optimiza automáticamente una imagen basándose en las capacidades del navegador
   */
  async autoOptimize(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      sizes?: string;
    } = {}
  ): Promise<{
    src: string;
    srcSet?: string;
    format: string;
  }> {
    const formatSupport = await this.detectFormatSupport();
    
    let format: 'avif' | 'webp' | 'auto' = 'auto';
    if (formatSupport.avif) {
      format = 'avif';
    } else if (formatSupport.webp) {
      format = 'webp';
    }

    const optimizedSrc = this.generateOptimizedUrl(src, {
      ...options,
      format,
    });

    const srcSet = this.generateSrcSet(src, { format });

    return {
      src: optimizedSrc,
      srcSet,
      format,
    };
  }
}

// Instancia global del optimizador
export const imageOptimizer = new ImageOptimizer();

// Utilidades adicionales
export const imageUtils = {
  /**
   * Calcula el tamaño óptimo basándose en el viewport
   */
  calculateOptimalSize(containerWidth: number, devicePixelRatio = 1): number {
    return Math.ceil(containerWidth * devicePixelRatio);
  },

  /**
   * Genera sizes attribute para responsive images
   */
  generateSizesAttribute(breakpoints: { [key: string]: string }): string {
    return Object.entries(breakpoints)
      .map(([breakpoint, size]) => {
        if (breakpoint === 'default') {
          return size;
        }
        return `(max-width: ${breakpoint}) ${size}`;
      })
      .join(', ');
  },

  /**
   * Preload de imágenes críticas
   */
  preloadImage(src: string, options: { as?: string; crossorigin?: string } = {}): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = options.as || 'image';
    link.href = src;
    if (options.crossorigin) {
      link.crossOrigin = options.crossorigin;
    }
    document.head.appendChild(link);
  },

  /**
   * Lazy load de imágenes no críticas
   */
  lazyLoadImage(img: HTMLImageElement, src: string): void {
    if ('loading' in HTMLImageElement.prototype) {
      // Soporte nativo de lazy loading
      img.loading = 'lazy';
      img.src = src;
    } else {
      // Fallback con Intersection Observer
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              img.src = src;
              observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: defaultImageConfig.lazyLoading.rootMargin,
          threshold: defaultImageConfig.lazyLoading.threshold,
        }
      );
      observer.observe(img);
    }
  },
};

// Tipos para TypeScript
export type ImageFormat = 'webp' | 'avif' | 'jpg' | 'jpeg' | 'png';
export type ImageQuality = 'low' | 'medium' | 'high' | number;
export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'xlarge';

// Constantes útiles
export const IMAGE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'],
  DEFAULT_QUALITY: 85,
  THUMBNAIL_SIZE: 150,
  PREVIEW_SIZE: 400,
  FULL_SIZE: 1200,
} as const;

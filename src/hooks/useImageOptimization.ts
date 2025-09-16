import { useState, useEffect, useCallback, useRef } from 'react';

// Tipos para la configuración de optimización
interface ImageOptimizationConfig {
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: number[];
  lazyLoading?: boolean;
  preloadCritical?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
}

// Tipos para el estado de carga de imágenes
interface ImageLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  progress?: number;
}

// Cache para imágenes ya cargadas
const imageCache = new Map<string, boolean>();

// Detectar capacidades del navegador
const getBrowserCapabilities = () => {
  if (typeof window === 'undefined') {
    return {
      supportsWebP: false,
      supportsAVIF: false,
      supportsLazyLoading: false,
      connectionSpeed: 'unknown'
    };
  }

  // Detectar soporte WebP
  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();

  // Detectar soporte AVIF
  const supportsAVIF = (() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    } catch {
      return false;
    }
  })();

  // Detectar soporte nativo de lazy loading
  const supportsLazyLoading = 'loading' in HTMLImageElement.prototype;

  // Detectar velocidad de conexión
  interface NetworkConnection {
    effectiveType?: string;
  }
  
  const nav = navigator as Navigator & {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  };
  
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const connectionSpeed = connection ? connection.effectiveType : 'unknown';

  return {
    supportsWebP,
    supportsAVIF,
    supportsLazyLoading,
    connectionSpeed
  };
};

// Hook principal para optimización de imágenes
export const useImageOptimization = (config: ImageOptimizationConfig = {}) => {
  const {
    quality = 75,
    format = 'auto',
    sizes = [640, 750, 828, 1080, 1200, 1920],
    lazyLoading = true,
    preloadCritical = false,
    placeholder = 'skeleton'
  } = config;

  const [capabilities] = useState(() => getBrowserCapabilities());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Generar URL optimizada
  const generateOptimizedUrl = useCallback((src: string, width?: number, customQuality?: number) => {
    if (!src || src.startsWith('data:')) return src;

    // Para URLs externas, retornar tal como están
    if (src.startsWith('http') && !src.includes(window.location.hostname)) {
      return src;
    }

    const params = new URLSearchParams();
    
    // Ajustar calidad según la velocidad de conexión
    let finalQuality = customQuality || quality;
    if (capabilities.connectionSpeed === 'slow-2g' || capabilities.connectionSpeed === '2g') {
      finalQuality = Math.min(finalQuality, 50);
    }

    if (width) params.set('w', width.toString());
    params.set('q', finalQuality.toString());

    // Determinar formato óptimo
    let optimalFormat = format;
    if (format === 'auto') {
      if (capabilities.supportsAVIF) {
        optimalFormat = 'avif';
      } else if (capabilities.supportsWebP) {
        optimalFormat = 'webp';
      }
    }

    if (optimalFormat !== 'auto') {
      params.set('f', optimalFormat);
    }

    return `${src}?${params.toString()}`;
  }, [quality, format, capabilities]);

  // Generar srcSet para imágenes responsivas
  const generateSrcSet = useCallback((src: string, customQuality?: number) => {
    return sizes
      .map(size => `${generateOptimizedUrl(src, size, customQuality)} ${size}w`)
      .join(', ');
  }, [sizes, generateOptimizedUrl]);

  // Precargar imagen
  const preloadImage = useCallback((src: string, priority: 'high' | 'low' = 'low') => {
    return new Promise<void>((resolve, reject) => {
      if (imageCache.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      
      // Configurar prioridad de carga
      if (priority === 'high') {
        img.fetchPriority = 'high';
      }

      img.onload = () => {
        imageCache.set(src, true);
        setLoadedImages(prev => new Set([...prev, src]));
        resolve();
      };

      img.onerror = () => {
        console.warn(`Error precargando imagen: ${src}`);
        reject(new Error(`Failed to preload image: ${src}`));
      };

      img.src = generateOptimizedUrl(src);
    });
  }, [generateOptimizedUrl]);

  // Precargar múltiples imágenes
  const preloadImages = useCallback(async (sources: string[], batchSize = 3) => {
    const results: Array<{ src: string; success: boolean }> = [];

    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (src) => {
        try {
          await preloadImage(src, i === 0 ? 'high' : 'low');
          return { src, success: true };
        } catch {
          return { src, success: false };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });

      // Pequeña pausa entre lotes para no sobrecargar
      if (i + batchSize < sources.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }, [preloadImage]);

  return {
    capabilities,
    loadedImages,
    generateOptimizedUrl,
    generateSrcSet,
    preloadImage,
    preloadImages,
    isImageLoaded: (src: string) => loadedImages.has(src) || imageCache.has(src)
  };
};

// Hook para lazy loading con Intersection Observer
export const useLazyLoading = (options: IntersectionObserverInit = {}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);
        
        if (inView && !hasBeenInView) {
          setHasBeenInView(true);
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasBeenInView, options]);

  return {
    elementRef,
    isInView,
    hasBeenInView
  };
};

// Hook para manejar el estado de carga de imágenes
export const useImageLoadState = (src?: string) => {
  const [state, setState] = useState<ImageLoadState>({
    isLoading: false,
    isLoaded: false,
    hasError: false
  });

  const handleLoadStart = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, hasError: false }));
  }, []);

  const handleLoadComplete = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false, isLoaded: true }));
  }, []);

  const handleLoadError = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false, hasError: true }));
  }, []);

  const handleProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  // Reset state when src changes
  useEffect(() => {
    if (src) {
      setState({
        isLoading: false,
        isLoaded: false,
        hasError: false,
        progress: 0
      });
    }
  }, [src]);

  return {
    ...state,
    handleLoadStart,
    handleLoadComplete,
    handleLoadError,
    handleProgress
  };
};

// Hook para optimización automática basada en el dispositivo
export const useDeviceOptimization = () => {
  const [deviceInfo, setDeviceInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        pixelRatio: 1,
        viewportWidth: 1920
      };
    }

    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    return {
      isMobile,
      isTablet,
      isDesktop,
      pixelRatio: window.devicePixelRatio || 1,
      viewportWidth: window.innerWidth
    };
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(prev => ({
        ...prev,
        viewportWidth: window.innerWidth
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generar configuración optimizada para el dispositivo
  const getOptimizedConfig = useCallback((): ImageOptimizationConfig => {
    const baseQuality = deviceInfo.isMobile ? 70 : 80;
    
    return {
      quality: baseQuality,
      format: 'auto',
      sizes: deviceInfo.isMobile 
        ? [320, 640, 750, 828, 1080]
        : [640, 750, 828, 1080, 1200, 1920, 2048],
      lazyLoading: true,
      preloadCritical: !deviceInfo.isMobile,
      placeholder: deviceInfo.isMobile ? 'skeleton' : 'blur'
    };
  }, [deviceInfo]);

  return {
    deviceInfo,
    getOptimizedConfig
  };
};

// Utilidad para generar placeholder blur
export const generateBlurPlaceholder = (width: number, height: number, color = '#f3f4f6') => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

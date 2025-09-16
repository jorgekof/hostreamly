import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

// Función para generar URLs de imágenes optimizadas
const generateOptimizedSrc = (src: string, width?: number, quality = 75) => {
  // Si es una URL externa, retornar tal como está
  if (src.startsWith('http') || src.startsWith('//'))
    return src;
  
  // Para imágenes locales, agregar parámetros de optimización
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  params.set('q', quality.toString());
  
  return `${src}?${params.toString()}`;
};

// Función para generar srcSet con diferentes tamaños
const generateSrcSet = (src: string, quality = 75) => {
  const sizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
  
  return sizes
    .map(size => `${generateOptimizedSrc(src, size, quality)} ${size}w`)
    .join(', ');
};

// Función para detectar soporte de formatos modernos
const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

const supportsAVIF = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  } catch {
    return false;
  }
};

// Hook para lazy loading
const useIntersectionObserver = (ref: React.RefObject<Element>, options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    );
    
    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return isIntersecting;
};

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes = '100vw',
  quality = 75,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [modernFormat, setModernFormat] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Solo usar lazy loading si no es prioritaria
  const isInView = useIntersectionObserver(containerRef, {
    skip: priority
  });
  
  const shouldLoad = priority || isInView;
  
  // Detectar soporte de formatos modernos
  useEffect(() => {
    if (supportsAVIF()) {
      setModernFormat('avif');
    } else if (supportsWebP()) {
      setModernFormat('webp');
    }
  }, []);
  
  // Generar URL optimizada
  const getOptimizedSrc = (format?: string) => {
    let optimizedSrc = src;
    
    // Convertir a formato moderno si es soportado
    if (format && !src.startsWith('http')) {
      const extension = src.split('.').pop();
      optimizedSrc = src.replace(`.${extension}`, `.${format}`);
    }
    
    return generateOptimizedSrc(optimizedSrc, width, quality);
  };
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  
  // Placeholder mientras carga
  const renderPlaceholder = () => {
    if (placeholder === 'blur' && blurDataURL) {
      return (
        <img
          src={blurDataURL}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-0' : 'opacity-100'
          )}
          aria-hidden="true"
        />
      );
    }
    
    return (
      <div
        className={cn(
          'absolute inset-0 bg-muted animate-pulse transition-opacity duration-300',
          isLoaded ? 'opacity-0' : 'opacity-100'
        )}
        aria-hidden="true"
      />
    );
  };
  
  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && renderPlaceholder()}
      
      {/* Imagen principal */}
      {shouldLoad && (
        <picture>
          {/* Formato AVIF */}
          {modernFormat === 'avif' && (
            <source
              srcSet={generateSrcSet(getOptimizedSrc('avif'), quality)}
              sizes={sizes}
              type="image/avif"
            />
          )}
          
          {/* Formato WebP */}
          {(modernFormat === 'webp' || modernFormat === 'avif') && (
            <source
              srcSet={generateSrcSet(getOptimizedSrc('webp'), quality)}
              sizes={sizes}
              type="image/webp"
            />
          )}
          
          {/* Formato original como fallback */}
          <img
            ref={imgRef}
            src={getOptimizedSrc()}
            srcSet={generateSrcSet(src, quality)}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Error al cargar imagen</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
export { OptimizedImage };

// Hook personalizado para precargar imágenes
export const useImagePreloader = (sources: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, src]));
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    };
    
    // Precargar imágenes en lotes pequeños para no sobrecargar
    const preloadBatch = async (batch: string[]) => {
      try {
        await Promise.all(batch.map(preloadImage));
      } catch (error) {
        console.warn('Error precargando imágenes:', error);
      }
    };
    
    // Procesar en lotes de 3 imágenes
    const batchSize = 3;
    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      setTimeout(() => preloadBatch(batch), i * 100); // Delay entre lotes
    }
  }, [sources]);
  
  return loadedImages;
};

// Componente para avatar optimizado
export const OptimizedAvatar: React.FC<{
  src?: string;
  alt: string;
  size?: number;
  fallback?: string;
  className?: string;
}> = ({ src, alt, size = 40, fallback, className }) => {
  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-full text-muted-foreground font-medium',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    );
  }
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      quality={90}
      sizes={`${size}px`}
    />
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useBunnyPerformanceOptimizer } from '../../services/bunnyPerformanceOptimizer';
import type { 
  PerformanceMetrics, 
  StreamingQuality, 
  NetworkConditions,
  DeviceCapabilities 
} from '../../services/bunnyPerformanceOptimizer';

interface PerformanceOptimizerProps {
  videoId: string;
  playerRef: React.RefObject<HTMLVideoElement>;
  onQualityChange?: (quality: StreamingQuality) => void;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  autoOptimize?: boolean;
}

interface PerformanceReport {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
  metrics: PerformanceMetrics;
  optimizations: string[];
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  videoId,
  playerRef,
  onQualityChange,
  onMetricsUpdate,
  autoOptimize = true
}) => {
  const optimizer = useBunnyPerformanceOptimizer();
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<StreamingQuality | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [optimizationEnabled, setOptimizationEnabled] = useState(autoOptimize);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Optimizar automáticamente cuando se monta el componente
  useEffect(() => {
    if (autoOptimize && videoId) {
      handleOptimizeForDevice();
    }
  }, [videoId, autoOptimize]);

  // Actualizar métricas periódicamente
  useEffect(() => {
    if (!optimizationEnabled) return;

    const interval = setInterval(async () => {
      const currentMetrics = optimizer.getMetrics();
      setMetrics(currentMetrics);
      onMetricsUpdate?.(currentMetrics);

      // Generar reporte cada 30 segundos
      if (Date.now() % 30000 < 5000) {
        const newReport = await optimizer.generateReport();
        setReport(newReport);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [optimizationEnabled, optimizer, onMetricsUpdate]);

  // Optimizar para el dispositivo actual
  const handleOptimizeForDevice = useCallback(async () => {
    if (!videoId) return;

    setIsOptimizing(true);
    try {
      const quality = await optimizer.optimizeForDevice(videoId);
      setCurrentQuality(quality);
      onQualityChange?.(quality);

      // Si hay un player disponible, optimizar la reproducción
      if (playerRef.current) {
        await optimizer.optimizePlayback(videoId, playerRef.current);
      }
    } catch (error) {
      console.error('Error optimizing for device:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [videoId, optimizer, playerRef, onQualityChange]);

  // Precargar contenido relacionado
  const handlePreloadContent = useCallback(async (relatedVideoIds: string[]) => {
    if (!relatedVideoIds.length) return;

    try {
      await optimizer.preloadContent(relatedVideoIds, 'medium');
    } catch (error) {
      console.error('Error preloading content:', error);
    }
  }, [optimizer]);

  // Alternar optimización
  const toggleOptimization = useCallback(() => {
    const newState = !optimizationEnabled;
    setOptimizationEnabled(newState);
    optimizer.enableOptimization(newState);
  }, [optimizationEnabled, optimizer]);

  // Obtener configuración optimizada del player
  const getOptimizedPlayerConfig = useCallback(() => {
    if (!videoId) return null;
    return optimizer.getOptimizedConfig(videoId);
  }, [videoId, optimizer]);

  // Obtener el mejor endpoint de CDN
  const getBestCDNEndpoint = useCallback((userLocation?: { lat: number; lng: number }) => {
    return optimizer.getBestCDN(userLocation);
  }, [optimizer]);

  // Renderizar indicador de calidad
  const renderQualityIndicator = () => {
    if (!currentQuality) return null;

    const getQualityColor = (resolution: string) => {
      switch (resolution) {
        case '1080p': return 'text-green-600';
        case '720p': return 'text-blue-600';
        case '480p': return 'text-yellow-600';
        case '360p': return 'text-orange-600';
        case '240p': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${currentQuality.adaptiveEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className={getQualityColor(currentQuality.resolution)}>
            {currentQuality.resolution}
          </span>
        </div>
        <span className="text-gray-500">•</span>
        <span className="text-gray-600">
          {Math.round(currentQuality.bitrate / 1000)}k
        </span>
        <span className="text-gray-500">•</span>
        <span className="text-gray-600">
          {currentQuality.fps}fps
        </span>
      </div>
    );
  };

  // Renderizar métricas de rendimiento
  const renderMetrics = () => {
    if (!metrics || !showAdvanced) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Métricas de Rendimiento</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Buffer Health</div>
            <div className="font-medium">{metrics.bufferHealth.toFixed(1)}s</div>
          </div>
          <div>
            <div className="text-gray-500">Rebuffers</div>
            <div className="font-medium">{metrics.rebufferCount}</div>
          </div>
          <div>
            <div className="text-gray-500">Startup Time</div>
            <div className="font-medium">{metrics.startupTime}ms</div>
          </div>
          <div>
            <div className="text-gray-500">Cache Hit Rate</div>
            <div className="font-medium">{metrics.cacheHitRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">Dropped Frames</div>
            <div className="font-medium">{metrics.droppedFrames}</div>
          </div>
          <div>
            <div className="text-gray-500">Bitrate Changes</div>
            <div className="font-medium">{metrics.bitrateChanges}</div>
          </div>
          <div>
            <div className="text-gray-500">Network Usage</div>
            <div className="font-medium">{metrics.networkUtilization.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">CDN Latency</div>
            <div className="font-medium">{metrics.cdnLatency}ms</div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar reporte de rendimiento
  const renderPerformanceReport = () => {
    if (!report || !showAdvanced) return null;

    const getOverallColor = (overall: string) => {
      switch (overall) {
        case 'excellent': return 'text-green-600 bg-green-100';
        case 'good': return 'text-blue-600 bg-blue-100';
        case 'fair': return 'text-yellow-600 bg-yellow-100';
        case 'poor': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div className="mt-4 p-4 bg-white border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Reporte de Rendimiento</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOverallColor(report.overall)}`}>
            {report.overall.toUpperCase()}
          </span>
        </div>

        {report.recommendations.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Recomendaciones</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.optimizations.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Optimizaciones Activas</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              {report.optimizations.map((opt, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{opt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="performance-optimizer">
      {/* Control principal */}
      <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleOptimization}
              className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                optimizationEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                optimizationEnabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Optimización {optimizationEnabled ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          {renderQualityIndicator()}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOptimizeForDevice}
            disabled={isOptimizing || !optimizationEnabled}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOptimizing ? 'Optimizando...' : 'Optimizar'}
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {showAdvanced ? 'Ocultar' : 'Avanzado'}
          </button>
        </div>
      </div>

      {/* Métricas avanzadas */}
      {renderMetrics()}

      {/* Reporte de rendimiento */}
      {renderPerformanceReport()}

      {/* Controles adicionales */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Controles Avanzados</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePreloadContent(['related-video-1', 'related-video-2'])}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Precargar Contenido
            </button>
            
            <button
              onClick={() => {
                const config = getOptimizedPlayerConfig();
            
              }}
              className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Ver Configuración
            </button>
            
            <button
              onClick={() => {
                const endpoint = getBestCDNEndpoint();
            
              }}
              className="px-3 py-1 text-sm bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Mejor CDN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizer;

// Hook personalizado para usar el optimizador en otros componentes
export const usePerformanceOptimizer = (videoId: string) => {
  const optimizer = useBunnyPerformanceOptimizer();
  const [isOptimized, setIsOptimized] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<StreamingQuality | null>(null);

  const optimizeForCurrentDevice = useCallback(async () => {
    if (!videoId) return;

    try {
      const quality = await optimizer.optimizeForDevice(videoId);
      setCurrentQuality(quality);
      setIsOptimized(true);
      return quality;
    } catch (error) {
      console.error('Error optimizing for device:', error);
      setIsOptimized(false);
      return null;
    }
  }, [videoId, optimizer]);

  const getOptimizedConfig = useCallback(() => {
    if (!videoId) return null;
    return optimizer.getOptimizedConfig(videoId);
  }, [videoId, optimizer]);

  const preloadRelatedContent = useCallback(async (relatedIds: string[]) => {
    try {
      await optimizer.preloadContent(relatedIds, 'medium');
    } catch (error) {
      console.error('Error preloading content:', error);
    }
  }, [optimizer]);

  return {
    isOptimized,
    currentQuality,
    optimizeForCurrentDevice,
    getOptimizedConfig,
    preloadRelatedContent,
    getMetrics: optimizer.getMetrics,
    getBestCDN: optimizer.getBestCDN
  };
};
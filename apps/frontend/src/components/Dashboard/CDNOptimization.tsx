import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { apiClient as api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Activity,
  BarChart3,
  Globe,
  Zap,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Gauge,
  Server,
  Shield,
  Wifi
} from 'lucide-react';

interface CDNOptimization {
  id: string;
  type: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  enabled: boolean;
}

interface CDNRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImprovement: string;
}

interface CDNConfig {
  caching: {
    ttl: number;
    browserCacheTtl: number;
    cacheControlHeaders: string;
    varyHeaders: string[];
  };
  compression: {
    enabled: boolean;
    level: number;
    types: string[];
  };
  optimization: {
    imageOptimization: boolean;
    minification: boolean;
    bundling: boolean;
    preloading: string[];
  };
  edgeRules: {
    geoBlocking?: {
      allowedCountries: string[];
      blockedCountries: string[];
    };
    rateLimit?: {
      requestsPerSecond: number;
      burstLimit: number;
    };
    customHeaders: Record<string, string>;
  };
}

interface PerformanceMetrics {
  averageLoadTime: number;
  averageCacheHitRate: number;
  totalRequests: number;
  bandwidth: {
    total: number;
    averageDaily: number;
    peak: number;
  };
  costs: {
    total: number;
    monthly: string;
    yearly: string;
  };
}

interface OptimizationResult {
  success: boolean;
  optimizations: CDNOptimization[];
  recommendations: CDNRecommendation[];
  performanceImprovement: {
    loadTime: string;
    cacheHitRate: string;
    bandwidthSavings: string;
  };
  estimatedSavings: {
    monthly: string;
    yearly: string;
    percentage: string;
  };
}

const CDNOptimization: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<CDNConfig>({
    caching: {
      ttl: 86400,
      browserCacheTtl: 3600,
      cacheControlHeaders: 'public, max-age=86400',
      varyHeaders: ['Accept-Encoding', 'User-Agent']
    },
    compression: {
      enabled: true,
      level: 6,
      types: ['text/html', 'text/css', 'text/javascript', 'application/json']
    },
    optimization: {
      imageOptimization: true,
      minification: true,
      bundling: false,
      preloading: []
    },
    edgeRules: {
      customHeaders: {}
    }
  });
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [videos, setVideos] = useState<Array<{id: string; title: string; cdn_url: string}>>([]);

  useEffect(() => {
    if (user) {
      loadCDNConfig();
      loadVideos();
      loadPerformanceMetrics();
    }
  }, [user]);

  const loadCDNConfig = async () => {
    try {
      const response = await api.get('/cdn/config');
      const data = response.data;
      const error = null;

      if (data && !error) {
        setConfig({
          caching: data.caching || config.caching,
          compression: data.compression || config.compression,
          optimization: data.optimization || config.optimization,
          edgeRules: data.edge_rules || config.edgeRules
        });
      }
    } catch (error: unknown) {
      console.error('Error loading CDN config:', error);
    }
  };

  const loadVideos = async () => {
    try {
      const response = await api.get('/videos?has_cdn=true');
      const data = response.data;

      if (data) {
        setVideos(data);
        if (data.length > 0 && !selectedVideo) {
          setSelectedVideo(data[0].id);
        }
      }
    } catch (error: unknown) {
      console.error('Error loading videos:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const response = await api.get('/cdn/analytics', {
        params: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          metrics: ['load_time', 'cache_hit_rate', 'bandwidth', 'costs']
        }
      });
      const data = response.data;

      if (data) {
        setMetrics({
          averageLoadTime: data.performance?.averageLoadTime || 0,
          averageCacheHitRate: data.performance?.averageCacheHitRate || 0,
          totalRequests: data.performance?.totalRequests || 0,
          bandwidth: data.bandwidth || { total: 0, averageDaily: 0, peak: 0 },
          costs: data.costs || { total: 0, monthly: '$0', yearly: '$0' }
        });
      }
    } catch (error: unknown) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const optimizeDelivery = async () => {
    if (!selectedVideo) {
      toast({
        title: "Error",
        description: "Por favor selecciona un video para optimizar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cdn/optimize', {
        videoId: selectedVideo,
        config
      });
      const data = response.data;

      setOptimizationResult(data);
      toast({
        title: "Optimización completada",
        description: "La entrega de contenido ha sido optimizada exitosamente"
      });

      // Recargar métricas después de la optimización
      await loadPerformanceMetrics();
    } catch (error: unknown) {
      toast({
        title: "Error en optimización",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const purgeCache = async () => {
    setLoading(true);
    try {
      const response = await api.post('/cdn/purge-cache', {
        videoId: selectedVideo
      });
      const data = response.data;

      toast({
        title: "Caché purgado",
        description: "El caché ha sido limpiado exitosamente"
      });
    } catch (error: unknown) {
      toast({
        title: "Error al purgar caché",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      const response = await api.put('/cdn/config', config);
      const data = response.data;

      toast({
        title: "Configuración guardada",
        description: "La configuración de CDN ha sido actualizada"
      });
    } catch (error: unknown) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const configureEdgeRules = async () => {
    setLoading(true);
    try {
      const response = await api.post('/cdn/edge-rules', {
        edgeRules: config.edgeRules
      });
      const data = response.data;

      toast({
        title: "Reglas de edge configuradas",
        description: "Las reglas de edge computing han sido aplicadas"
      });
    } catch (error: unknown) {
      toast({
        title: "Error en configuración",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Optimización CDN</h2>
          <p className="text-muted-foreground">
            Optimiza la entrega de contenido con edge computing y caché inteligente
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={purgeCache} variant="outline" disabled={loading}>
            <Zap className="h-4 w-4 mr-2" />
            Purgar Caché
          </Button>
          <Button onClick={optimizeDelivery} disabled={loading || !selectedVideo}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {loading ? 'Optimizando...' : 'Optimizar Entrega'}
          </Button>
        </div>
      </div>

      {/* Métricas de rendimiento */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo de Carga</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageLoadTime.toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">
                Promedio últimos 7 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(metrics.averageCacheHitRate * 100).toFixed(1)}%</div>
              <Progress value={metrics.averageCacheHitRate * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ancho de Banda</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.bandwidth.total / 1024 / 1024 / 1024).toFixed(2)}GB
              </div>
              <p className="text-xs text-muted-foreground">
                Total últimos 7 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo Mensual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.costs.monthly}</div>
              <p className="text-xs text-muted-foreground">
                Estimado mes actual
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultado de optimización */}
      {optimizationResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Optimización completada exitosamente</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Tiempo de carga:</span>
                  <span className="text-green-600 ml-1">
                    {optimizationResult.performanceImprovement.loadTime}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Cache hit rate:</span>
                  <span className="text-green-600 ml-1">
                    {optimizationResult.performanceImprovement.cacheHitRate}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Ahorro estimado:</span>
                  <span className="text-green-600 ml-1">
                    {optimizationResult.estimatedSavings.monthly}/mes
                  </span>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Configuración</TabsTrigger>
          <TabsTrigger value="edge-rules">Reglas Edge</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Optimización</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Configuración de Caché */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Configuración de Caché
                </CardTitle>
                <CardDescription>
                  Configura el comportamiento del caché para optimizar la entrega
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cache-ttl">TTL de Caché (segundos)</Label>
                  <Input
                    id="cache-ttl"
                    type="number"
                    value={config.caching.ttl}
                    onChange={(e) => setConfig({
                      ...config,
                      caching: { ...config.caching, ttl: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="browser-cache-ttl">TTL Caché Navegador (segundos)</Label>
                  <Input
                    id="browser-cache-ttl"
                    type="number"
                    value={config.caching.browserCacheTtl}
                    onChange={(e) => setConfig({
                      ...config,
                      caching: { ...config.caching, browserCacheTtl: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cache-headers">Headers de Control de Caché</Label>
                  <Input
                    id="cache-headers"
                    value={config.caching.cacheControlHeaders}
                    onChange={(e) => setConfig({
                      ...config,
                      caching: { ...config.caching, cacheControlHeaders: e.target.value }
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Compresión */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Compresión
                </CardTitle>
                <CardDescription>
                  Configura la compresión para reducir el tamaño de los archivos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="compression-enabled"
                    checked={config.compression.enabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      compression: { ...config.compression, enabled: checked }
                    })}
                  />
                  <Label htmlFor="compression-enabled">Habilitar Compresión</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compression-level">Nivel de Compresión (1-9)</Label>
                  <Input
                    id="compression-level"
                    type="number"
                    min="1"
                    max="9"
                    value={config.compression.level}
                    onChange={(e) => setConfig({
                      ...config,
                      compression: { ...config.compression, level: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Optimizaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Optimizaciones
                </CardTitle>
                <CardDescription>
                  Habilita optimizaciones automáticas para mejor rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="image-optimization"
                    checked={config.optimization.imageOptimization}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      optimization: { ...config.optimization, imageOptimization: checked }
                    })}
                  />
                  <Label htmlFor="image-optimization">Optimización de Imágenes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="minification"
                    checked={config.optimization.minification}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      optimization: { ...config.optimization, minification: checked }
                    })}
                  />
                  <Label htmlFor="minification">Minificación</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bundling"
                    checked={config.optimization.bundling}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      optimization: { ...config.optimization, bundling: checked }
                    })}
                  />
                  <Label htmlFor="bundling">Bundling Automático</Label>
                </div>
              </CardContent>
            </Card>

            {/* Selección de Video */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Video a Optimizar
                </CardTitle>
                <CardDescription>
                  Selecciona el video para aplicar optimizaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="video-select">Video</Label>
                  <select
                    id="video-select"
                    className="w-full p-2 border rounded-md"
                    value={selectedVideo}
                    onChange={(e) => setSelectedVideo(e.target.value)}
                  >
                    <option value="">Seleccionar video...</option>
                    {videos.map((video) => (
                      <option key={video.id} value={video.id}>
                        {video.title}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveConfiguration} disabled={loading}>
              <Settings className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="edge-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Reglas de Edge Computing
              </CardTitle>
              <CardDescription>
                Configura reglas avanzadas para el edge computing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rate Limiting */}
              <div className="space-y-4">
                <h4 className="font-medium">Rate Limiting</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="requests-per-second">Requests por Segundo</Label>
                    <Input
                      id="requests-per-second"
                      type="number"
                      value={config.edgeRules.rateLimit?.requestsPerSecond || 10}
                      onChange={(e) => setConfig({
                        ...config,
                        edgeRules: {
                          ...config.edgeRules,
                          rateLimit: {
                            ...config.edgeRules.rateLimit,
                            requestsPerSecond: parseInt(e.target.value),
                            burstLimit: config.edgeRules.rateLimit?.burstLimit || 20
                          }
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="burst-limit">Límite de Ráfaga</Label>
                    <Input
                      id="burst-limit"
                      type="number"
                      value={config.edgeRules.rateLimit?.burstLimit || 20}
                      onChange={(e) => setConfig({
                        ...config,
                        edgeRules: {
                          ...config.edgeRules,
                          rateLimit: {
                            ...config.edgeRules.rateLimit,
                            requestsPerSecond: config.edgeRules.rateLimit?.requestsPerSecond || 10,
                            burstLimit: parseInt(e.target.value)
                          }
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Geo-blocking */}
              <div className="space-y-4">
                <h4 className="font-medium">Geo-blocking</h4>
                <div className="space-y-2">
                  <Label htmlFor="blocked-countries">Países Bloqueados (códigos ISO, separados por coma)</Label>
                  <Input
                    id="blocked-countries"
                    placeholder="CN,RU,IR"
                    value={config.edgeRules.geoBlocking?.blockedCountries?.join(',') || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      edgeRules: {
                        ...config.edgeRules,
                        geoBlocking: {
                          ...config.edgeRules.geoBlocking,
                          blockedCountries: e.target.value.split(',').filter(c => c.trim()),
                          allowedCountries: config.edgeRules.geoBlocking?.allowedCountries || []
                        }
                      }
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={configureEdgeRules} disabled={loading}>
                  <Shield className="h-4 w-4 mr-2" />
                  Aplicar Reglas Edge
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics de CDN
              </CardTitle>
              <CardDescription>
                Análisis detallado del rendimiento de tu CDN
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {metrics.totalRequests.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Requests</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {(metrics.bandwidth.averageDaily / 1024 / 1024).toFixed(1)}MB
                      </div>
                      <div className="text-sm text-muted-foreground">Promedio Diario</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {(metrics.bandwidth.peak / 1024 / 1024).toFixed(1)}MB
                      </div>
                      <div className="text-sm text-muted-foreground">Pico de Tráfico</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cache Hit Rate</span>
                      <span>{(metrics.averageCacheHitRate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.averageCacheHitRate * 100} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando analytics...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recomendaciones de Optimización
              </CardTitle>
              <CardDescription>
                Sugerencias automáticas para mejorar el rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationResult?.recommendations ? (
                <div className="space-y-4">
                  {optimizationResult.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rec.description}</h4>
                        <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mejora esperada: {rec.estimatedImprovement}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Ejecuta una optimización para ver recomendaciones
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CDNOptimization;

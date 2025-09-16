import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Zap, 
  Server, 
  MapPin, 
  Clock, 
  TrendingUp,
  Activity,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  Gauge,
  Network,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
interface EdgeLocation {
  id: string;
  name: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive' | 'maintenance';
  latency: number;
  bandwidth: number;
  hitRatio: number;
  requests: number;
  dataTransferred: number;
}

interface CDNConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  settings: {
    caching: {
      ttl: number;
      browserCache: number;
      edgeCache: number;
      originShield: boolean;
    };
    compression: {
      enabled: boolean;
      gzip: boolean;
      brotli: boolean;
      webp: boolean;
      avif: boolean;
    };
    security: {
      hotlinkProtection: boolean;
      tokenAuth: boolean;
      geoBlocking: string[];
      rateLimiting: boolean;
    };
    optimization: {
      minify: boolean;
      imageOptimization: boolean;
      videoOptimization: boolean;
      preloading: boolean;
    };
  };
}

interface CDNMetrics {
  totalRequests: number;
  cacheHitRatio: number;
  avgLatency: number;
  bandwidth: number;
  dataTransferred: number;
  errorRate: number;
  topCountries: { [country: string]: number };
  topFiles: { [file: string]: number };
  performanceScore: number;
}

const CDNOptimization: React.FC = () => {
  const { user } = useAuth();
  const [edgeLocations, setEdgeLocations] = useState<EdgeLocation[]>([]);
  const [cdnConfigs, setCdnConfigs] = useState<CDNConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [cdnMetrics, setCdnMetrics] = useState<CDNMetrics>({
    totalRequests: 0,
    cacheHitRatio: 0,
    avgLatency: 0,
    bandwidth: 0,
    dataTransferred: 0,
    errorRate: 0,
    topCountries: {},
    topFiles: {},
    performanceScore: 0
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newConfig, setNewConfig] = useState<Partial<CDNConfig>>({
    name: '',
    description: '',
    enabled: true,
    settings: {
      caching: {
        ttl: 86400,
        browserCache: 3600,
        edgeCache: 86400,
        originShield: true
      },
      compression: {
        enabled: true,
        gzip: true,
        brotli: true,
        webp: true,
        avif: false
      },
      security: {
        hotlinkProtection: true,
        tokenAuth: false,
        geoBlocking: [],
        rateLimiting: true
      },
      optimization: {
        minify: true,
        imageOptimization: true,
        videoOptimization: true,
        preloading: false
      }
    }
  });

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const defaultConfigs: CDNConfig[] = [
    {
      id: 'global-standard',
      name: 'Global Standard',
      description: 'Configuración estándar para distribución global',
      enabled: true,
      settings: {
        caching: {
          ttl: 86400,
          browserCache: 3600,
          edgeCache: 86400,
          originShield: true
        },
        compression: {
          enabled: true,
          gzip: true,
          brotli: true,
          webp: true,
          avif: false
        },
        security: {
          hotlinkProtection: true,
          tokenAuth: false,
          geoBlocking: [],
          rateLimiting: true
        },
        optimization: {
          minify: true,
          imageOptimization: true,
          videoOptimization: true,
          preloading: false
        }
      }
    },
    {
      id: 'high-performance',
      name: 'High Performance',
      description: 'Máximo rendimiento para contenido crítico',
      enabled: false,
      settings: {
        caching: {
          ttl: 604800,
          browserCache: 86400,
          edgeCache: 604800,
          originShield: true
        },
        compression: {
          enabled: true,
          gzip: true,
          brotli: true,
          webp: true,
          avif: true
        },
        security: {
          hotlinkProtection: true,
          tokenAuth: true,
          geoBlocking: [],
          rateLimiting: true
        },
        optimization: {
          minify: true,
          imageOptimization: true,
          videoOptimization: true,
          preloading: true
        }
      }
    },
    {
      id: 'security-focused',
      name: 'Security Focused',
      description: 'Enfoque en seguridad y protección de contenido',
      enabled: false,
      settings: {
        caching: {
          ttl: 3600,
          browserCache: 1800,
          edgeCache: 3600,
          originShield: true
        },
        compression: {
          enabled: true,
          gzip: true,
          brotli: false,
          webp: false,
          avif: false
        },
        security: {
          hotlinkProtection: true,
          tokenAuth: true,
          geoBlocking: ['CN', 'RU'],
          rateLimiting: true
        },
        optimization: {
          minify: false,
          imageOptimization: false,
          videoOptimization: false,
          preloading: false
        }
      }
    }
  ];

  const loadEdgeLocations = useCallback(async () => {
    try {
      if (!user) return;

      // TODO: Replace with API call
      console.log('Loading edge locations for user:', user.id);
      
      // Mock data until API is implemented
      setEdgeLocations([]);
    } catch (error) {
      console.error('Error loading edge locations:', error);
    }
  }, [user]);

  const loadCDNConfigs = useCallback(async () => {
    try {
      if (!user) return;

      // TODO: Replace with API call
      console.log('Loading CDN configs for user:', user.id);
      
      const allConfigs = [...defaultConfigs];
      setCdnConfigs(allConfigs);
      
      if (!selectedConfig && allConfigs.length > 0) {
        setSelectedConfig(allConfigs[0].id);
      }
    } catch (error) {
      console.error('Error loading CDN configs:', error);
      setCdnConfigs(defaultConfigs);
    }
  }, [selectedConfig, defaultConfigs, user]);

  const loadCDNMetrics = useCallback(async () => {
    try {
      if (!user) return;

      // TODO: Replace with API call
      console.log('Loading CDN metrics for user:', user.id);
      
      // Use existing metrics as fallback
      setCdnMetrics(cdnMetrics);
    } catch (error) {
      console.error('Error loading CDN metrics:', error);
    }
  }, [user, cdnMetrics]);

  const createCDNConfig = async () => {
    if (!newConfig.name) {
      toast.error('Nombre de configuración es requerido');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      // TODO: Replace with API call
      console.log('Optimizing CDN for user:', user.id);

      const newConfigWithId: CDNConfig = {
        ...newConfig as CDNConfig,
        id: Date.now().toString()
      };

      setCdnConfigs(prev => [...prev, newConfigWithId]);
      setNewConfig({
        name: '',
        description: '',
        enabled: true,
        settings: {
          caching: {
            ttl: 86400,
            browserCache: 3600,
            edgeCache: 86400,
            originShield: true
          },
          compression: {
            enabled: true,
            gzip: true,
            brotli: true,
            webp: true,
            avif: false
          },
          security: {
            hotlinkProtection: true,
            tokenAuth: false,
            geoBlocking: [],
            rateLimiting: true
          },
          optimization: {
            minify: true,
            imageOptimization: true,
            videoOptimization: true,
            preloading: false
          }
        }
      });
      toast.success('Configuración CDN creada exitosamente');
    } catch (error) {
      console.error('Error creating CDN config:', error);
      toast.error('Error al crear configuración CDN');
    } finally {
      setLoading(false);
    }
  };

  const applyCDNConfig = async () => {
    if (!selectedConfig) {
      toast.error('Selecciona una configuración');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const config = cdnConfigs.find(c => c.id === selectedConfig);
      if (!config) throw new Error('Configuración no encontrada');

      // TODO: Replace with API call
      console.log('Applying CDN config:', config);

      toast.success('Configuración CDN aplicada exitosamente');
      loadCDNMetrics();
    } catch (error) {
      console.error('Error applying CDN config:', error);
      toast.error('Error al aplicar configuración CDN');
    } finally {
      setLoading(false);
    }
  };

  const optimizeCDN = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      // TODO: Replace with API call
      console.log('Optimizing CDN for user:', user.id);

      toast.success('Optimización CDN completada');
      loadCDNMetrics();
      loadEdgeLocations();
    } catch (error) {
      console.error('Error optimizing CDN:', error);
      toast.error('Error al optimizar CDN');
    } finally {
      setLoading(false);
    }
  };

  const getLocationStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  useEffect(() => {
    loadEdgeLocations();
    loadCDNConfigs();
    loadCDNMetrics();
  }, [loadEdgeLocations, loadCDNConfigs, loadCDNMetrics]);

  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        loadCDNMetrics();
        loadEdgeLocations();
      }, 30000);
    } else if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh, loadCDNMetrics, loadEdgeLocations]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Optimización CDN</h2>
          <p className="text-muted-foreground">
            Optimiza la distribución de contenido con edge locations de Bunny CDN
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          <Button onClick={optimizeCDN} disabled={loading}>
            <Zap className="h-4 w-4 mr-2" />
            Optimizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Edge Locations</span>
            </div>
            <p className="text-2xl font-bold mt-2">{edgeLocations.length}</p>
            <p className="text-xs text-muted-foreground">
              {edgeLocations.filter(l => l.status === 'active').length} activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Cache Hit Ratio</span>
            </div>
            <p className="text-2xl font-bold mt-2">{cdnMetrics.cacheHitRatio.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">promedio global</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Latencia Promedio</span>
            </div>
            <p className="text-2xl font-bold mt-2">{cdnMetrics.avgLatency}</p>
            <p className="text-xs text-muted-foreground">ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Gauge className={`h-4 w-4 ${getPerformanceColor(cdnMetrics.performanceScore)}`} />
              <span className="text-sm font-medium">Performance Score</span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${getPerformanceColor(cdnMetrics.performanceScore)}`}>
              {cdnMetrics.performanceScore}
            </p>
            <p className="text-xs text-muted-foreground">de 100</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="locations">Edge Locations</TabsTrigger>
          <TabsTrigger value="configs">Configuraciones</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configuración Activa</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="config-select">Configuración CDN</Label>
                  <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar configuración" />
                    </SelectTrigger>
                    <SelectContent>
                      {cdnConfigs.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedConfig && (
                  <div className="space-y-2">
                    {(() => {
                      const config = cdnConfigs.find(c => c.id === selectedConfig);
                      return config ? (
                        <>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={config.enabled ? 'default' : 'secondary'}>
                              {config.enabled ? 'Activa' : 'Inactiva'}
                            </Badge>
                            {config.settings.compression.enabled && (
                              <Badge variant="outline">Compresión</Badge>
                            )}
                            {config.settings.security.hotlinkProtection && (
                              <Badge variant="outline">Protección</Badge>
                            )}
                            {config.settings.optimization.imageOptimization && (
                              <Badge variant="outline">Optimización</Badge>
                            )}
                          </div>
                        </>
                      ) : null;
                    })()
                    }
                  </div>
                )}

                <Button onClick={applyCDNConfig} disabled={loading || !selectedConfig} className="w-full">
                  {loading ? 'Aplicando...' : 'Aplicar Configuración'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Estado del Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Hit Ratio</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={cdnMetrics.cacheHitRatio} className="w-20 h-2" />
                      <span className="text-sm font-medium">{cdnMetrics.cacheHitRatio.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Performance Score</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={cdnMetrics.performanceScore} className="w-20 h-2" />
                      <span className={`text-sm font-medium ${getPerformanceColor(cdnMetrics.performanceScore)}`}>
                        {cdnMetrics.performanceScore}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={cdnMetrics.errorRate} className="w-20 h-2" />
                      <span className="text-sm font-medium">{cdnMetrics.errorRate.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    CDN funcionando correctamente. {edgeLocations.filter(l => l.status === 'active').length} edge locations activas.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Tráfico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Requests Totales</h4>
                  <p className="text-2xl font-bold">{cdnMetrics.totalRequests.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">últimas 24 horas</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Ancho de Banda</h4>
                  <p className="text-2xl font-bold">{(cdnMetrics.bandwidth / 1024 / 1024).toFixed(1)} GB</p>
                  <p className="text-xs text-muted-foreground">transferidos</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Latencia Promedio</h4>
                  <p className="text-2xl font-bold">{cdnMetrics.avgLatency}ms</p>
                  <p className="text-xs text-muted-foreground">global</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edge Locations Globales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {edgeLocations.map((location) => (
                  <div key={location.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{location.name}</h4>
                      <Badge className={getLocationStatusColor(location.status)}>
                        {location.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{location.city}, {location.country}</p>
                      <p>Región: {location.region}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Latencia:</span>
                        <p>{location.latency}ms</p>
                      </div>
                      <div>
                        <span className="font-medium">Hit Ratio:</span>
                        <p>{location.hitRatio.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="font-medium">Requests:</span>
                        <p>{location.requests.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Datos:</span>
                        <p>{(location.dataTransferred / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuraciones Existentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cdnConfigs.map((config) => (
                  <div key={config.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{config.name}</h4>
                      <Badge variant={config.enabled ? 'default' : 'secondary'}>
                        {config.enabled ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        TTL: {config.settings.caching.ttl}s
                      </Badge>
                      {config.settings.compression.enabled && (
                        <Badge variant="outline" className="text-xs">Compresión</Badge>
                      )}
                      {config.settings.security.hotlinkProtection && (
                        <Badge variant="outline" className="text-xs">Protección</Badge>
                      )}
                      {config.settings.optimization.imageOptimization && (
                        <Badge variant="outline" className="text-xs">Optimización</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="config-name">Nombre</Label>
                  <Input
                    id="config-name"
                    value={newConfig.name || ''}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: High Performance"
                  />
                </div>

                <div>
                  <Label htmlFor="config-description">Descripción</Label>
                  <Textarea
                    id="config-description"
                    value={newConfig.description || ''}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe el propósito de esta configuración..."
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Configuraciones</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compression">Compresión</Label>
                      <Switch
                        id="compression"
                        checked={newConfig.settings?.compression?.enabled || false}
                        onCheckedChange={(checked) => 
                          setNewConfig(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings!,
                              compression: {
                                ...prev.settings!.compression,
                                enabled: checked
                              }
                            }
                          }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hotlink">Protección Hotlink</Label>
                      <Switch
                        id="hotlink"
                        checked={newConfig.settings?.security?.hotlinkProtection || false}
                        onCheckedChange={(checked) => 
                          setNewConfig(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings!,
                              security: {
                                ...prev.settings!.security,
                                hotlinkProtection: checked
                              }
                            }
                          }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="optimization">Optimización de Imágenes</Label>
                      <Switch
                        id="optimization"
                        checked={newConfig.settings?.optimization?.imageOptimization || false}
                        onCheckedChange={(checked) => 
                          setNewConfig(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings!,
                              optimization: {
                                ...prev.settings!.optimization,
                                imageOptimization: checked
                              }
                            }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={createCDNConfig} disabled={loading} className="w-full">
                  {loading ? 'Creando...' : 'Crear Configuración'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Países</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(cdnMetrics.topCountries)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([country, requests]) => (
                      <div key={country} className="flex justify-between items-center">
                        <span className="text-sm">{country}</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={(requests / Math.max(...Object.values(cdnMetrics.topCountries))) * 100} 
                            className="w-20 h-2" 
                          />
                          <span className="text-sm font-medium">{requests.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Archivos Más Solicitados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(cdnMetrics.topFiles)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([file, requests]) => (
                      <div key={file} className="flex justify-between items-center">
                        <span className="text-sm truncate">{file}</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={(requests / Math.max(...Object.values(cdnMetrics.topFiles))) * 100} 
                            className="w-20 h-2" 
                          />
                          <span className="text-sm font-medium">{requests.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rendimiento Global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{cdnMetrics.totalRequests.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{cdnMetrics.cacheHitRatio.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Cache Hit Ratio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{cdnMetrics.avgLatency}ms</div>
                  <div className="text-sm text-muted-foreground">Avg Latency</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getPerformanceColor(cdnMetrics.performanceScore)}`}>
                    {cdnMetrics.performanceScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Performance Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CDNOptimization;

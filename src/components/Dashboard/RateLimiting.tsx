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
import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BarChart3,
  Settings,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Ban,
  Eye,
  Filter,
  Globe,
  Server,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';

interface RateLimitConfig {
  globalLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  endpointLimits: Record<string, {
    requestsPerMinute: number;
    requestsPerHour: number;
    concurrent: number;
  }>;
  userTierLimits: Record<string, {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    concurrentStreams: number;
  }>;
  ipLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    maxConcurrent: number;
    blockThreshold: number;
    blockDuration: number;
  };
  adaptiveSettings: {
    enabled: boolean;
    loadThreshold: number;
    scaleFactor: number;
    recoveryTime: number;
  };
  whitelistedIPs: string[];
  blacklistedIPs: string[];
  botDetection: {
    enabled: boolean;
    patterns: string[];
    strictMode: boolean;
  };
}

interface RateLimitStats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  blockingRate: number;
  topBlockedEndpoints: Array<{ endpoint: string; count: number }>;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  riskDistribution: Record<string, number>;
  timeRange: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
  riskScore: number;
  adaptiveMultiplier: number;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  block_count: number;
  risk_score: number;
  blocked_until: string;
  created_at: string;
}

interface SuspiciousPattern {
  id: string;
  ip_address: string;
  pattern_type: string;
  pattern_data: Record<string, unknown>;
  severity: string;
  confidence_score: number;
  detection_count: number;
  first_detected: string;
  last_detected: string;
  is_resolved: boolean;
}

const RateLimiting: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<RateLimitConfig>({
    globalLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 20
    },
    endpointLimits: {},
    userTierLimits: {
      'free': { requestsPerMinute: 10, requestsPerHour: 100, requestsPerDay: 1000, concurrentStreams: 1 },
      'pro': { requestsPerMinute: 50, requestsPerHour: 500, requestsPerDay: 5000, concurrentStreams: 3 },
      'enterprise': { requestsPerMinute: 200, requestsPerHour: 2000, requestsPerDay: 20000, concurrentStreams: 10 }
    },
    ipLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 600,
      maxConcurrent: 10,
      blockThreshold: 1000,
      blockDuration: 3600
    },
    adaptiveSettings: {
      enabled: true,
      loadThreshold: 80,
      scaleFactor: 0.5,
      recoveryTime: 300
    },
    whitelistedIPs: [],
    blacklistedIPs: [],
    botDetection: {
      enabled: true,
      patterns: ['bot', 'crawler', 'spider', 'scraper'],
      strictMode: false
    }
  });
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [suspiciousPatterns, setSuspiciousPatterns] = useState<SuspiciousPattern[]>([]);
  const [testIP, setTestIP] = useState('');
  const [testEndpoint, setTestEndpoint] = useState('/api/videos/stream');
  const [testResult, setTestResult] = useState<RateLimitResult | null>(null);
  const [newWhitelistIP, setNewWhitelistIP] = useState('');
  const [newBlacklistIP, setNewBlacklistIP] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newBotPattern, setNewBotPattern] = useState('');

  useEffect(() => {
    if (user) {
      loadRateLimitConfig();
      loadStats();
      loadBlockedIPs();
      loadSuspiciousPatterns();
    }
  }, [user]);

  const loadRateLimitConfig = async () => {
    try {
  
        const data = null, error = null;

      if (data && !error) {
        setConfig({ ...config, ...data.config });
      }
    } catch (error) {
      console.error('Error loading rate limit config:', error);
    }
  };

  const loadStats = async () => {
    try {

      // const response = await api.get('/rate-limit/stats');
      // setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadBlockedIPs = async () => {
    try {
      
      // const response = await api.get('/rate-limit/blocked-ips');
      // setBlockedIPs(response.data.blockedIPs || []);
    } catch (error) {
      console.error('Error loading blocked IPs:', error);
    }
  };

  const loadSuspiciousPatterns = async () => {
    try {
      
        const data = null, error = null;

      if (data && !error) {
        setSuspiciousPatterns(data);
      }
    } catch (error) {
      console.error('Error loading suspicious patterns:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      
      const data = null, error = null;

      if (error) throw error;

      toast({
        title: "Configuración actualizada",
        description: "Las configuraciones de rate limiting han sido guardadas exitosamente"
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

  const testRateLimit = async () => {
    if (!testIP) {
      toast({
        title: "Error",
        description: "Por favor ingresa una dirección IP para probar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      
      const data = null, error = null;

      if (error) throw error;

      setTestResult(data);
    } catch (error: unknown) {
      toast({
        title: "Error en prueba",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetLimits = async (type: string, target?: string) => {
    setLoading(true);
    try {
      
      const data = null, error = null;

      if (error) throw error;

      toast({
        title: "Límites reseteados",
        description: data?.message || 'Límites reseteados exitosamente'
      });

      // Recargar datos
      loadStats();
      loadBlockedIPs();
    } catch (error: unknown) {
      toast({
        title: "Error al resetear",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addWhitelistIP = () => {
    if (newWhitelistIP && !config.whitelistedIPs.includes(newWhitelistIP)) {
      setConfig({
        ...config,
        whitelistedIPs: [...config.whitelistedIPs, newWhitelistIP]
      });
      setNewWhitelistIP('');
    }
  };

  const removeWhitelistIP = (ip: string) => {
    setConfig({
      ...config,
      whitelistedIPs: config.whitelistedIPs.filter(i => i !== ip)
    });
  };

  const addBlacklistIP = () => {
    if (newBlacklistIP && !config.blacklistedIPs.includes(newBlacklistIP)) {
      setConfig({
        ...config,
        blacklistedIPs: [...config.blacklistedIPs, newBlacklistIP]
      });
      setNewBlacklistIP('');
    }
  };

  const removeBlacklistIP = (ip: string) => {
    setConfig({
      ...config,
      blacklistedIPs: config.blacklistedIPs.filter(i => i !== ip)
    });
  };

  const addEndpointLimit = () => {
    if (newEndpoint && !config.endpointLimits[newEndpoint]) {
      setConfig({
        ...config,
        endpointLimits: {
          ...config.endpointLimits,
          [newEndpoint]: {
            requestsPerMinute: 10,
            requestsPerHour: 100,
            concurrent: 5
          }
        }
      });
      setNewEndpoint('');
    }
  };

  const removeEndpointLimit = (endpoint: string) => {
    const newLimits = { ...config.endpointLimits };
    delete newLimits[endpoint];
    setConfig({
      ...config,
      endpointLimits: newLimits
    });
  };

  const addBotPattern = () => {
    if (newBotPattern && !config.botDetection.patterns.includes(newBotPattern.toLowerCase())) {
      setConfig({
        ...config,
        botDetection: {
          ...config.botDetection,
          patterns: [...config.botDetection.patterns, newBotPattern.toLowerCase()]
        }
      });
      setNewBotPattern('');
    }
  };

  const removeBotPattern = (pattern: string) => {
    setConfig({
      ...config,
      botDetection: {
        ...config.botDetection,
        patterns: config.botDetection.patterns.filter(p => p !== pattern)
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rate Limiting</h2>
          <p className="text-muted-foreground">
            Controla y monitorea los límites de velocidad de tu API
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStats} variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={saveConfig} disabled={loading}>
            <Settings className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Config'}
          </Button>
        </div>
      </div>

      {/* Métricas generales */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.timeRange}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests Permitidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.allowedRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.allowedRequests / stats.totalRequests) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests Bloqueados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.blockedRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.blockingRate.toFixed(1)}% de bloqueo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IPs Bloqueadas</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blockedIPs.length}</div>
              <Progress value={Math.min((blockedIPs.length / 100) * 100, 100)} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="blocked-ips">IPs Bloqueadas</TabsTrigger>
          <TabsTrigger value="patterns">Patrones Sospechosos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="test">Pruebas</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Límites Globales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Límites Globales
                </CardTitle>
                <CardDescription>
                  Configuración general de rate limiting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Requests/Minuto</Label>
                    <Input
                      type="number"
                      value={config.globalLimits.requestsPerMinute}
                      onChange={(e) => setConfig({
                        ...config,
                        globalLimits: {
                          ...config.globalLimits,
                          requestsPerMinute: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Requests/Hora</Label>
                    <Input
                      type="number"
                      value={config.globalLimits.requestsPerHour}
                      onChange={(e) => setConfig({
                        ...config,
                        globalLimits: {
                          ...config.globalLimits,
                          requestsPerHour: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Requests/Día</Label>
                    <Input
                      type="number"
                      value={config.globalLimits.requestsPerDay}
                      onChange={(e) => setConfig({
                        ...config,
                        globalLimits: {
                          ...config.globalLimits,
                          requestsPerDay: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Límite de Ráfaga</Label>
                    <Input
                      type="number"
                      value={config.globalLimits.burstLimit}
                      onChange={(e) => setConfig({
                        ...config,
                        globalLimits: {
                          ...config.globalLimits,
                          burstLimit: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Límites por IP */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Límites por IP
                </CardTitle>
                <CardDescription>
                  Configuración de límites por dirección IP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Requests/Minuto</Label>
                    <Input
                      type="number"
                      value={config.ipLimits.requestsPerMinute}
                      onChange={(e) => setConfig({
                        ...config,
                        ipLimits: {
                          ...config.ipLimits,
                          requestsPerMinute: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Requests/Hora</Label>
                    <Input
                      type="number"
                      value={config.ipLimits.requestsPerHour}
                      onChange={(e) => setConfig({
                        ...config,
                        ipLimits: {
                          ...config.ipLimits,
                          requestsPerHour: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Umbral de Bloqueo</Label>
                    <Input
                      type="number"
                      value={config.ipLimits.blockThreshold}
                      onChange={(e) => setConfig({
                        ...config,
                        ipLimits: {
                          ...config.ipLimits,
                          blockThreshold: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duración Bloqueo (seg)</Label>
                    <Input
                      type="number"
                      value={config.ipLimits.blockDuration}
                      onChange={(e) => setConfig({
                        ...config,
                        ipLimits: {
                          ...config.ipLimits,
                          blockDuration: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración Adaptativa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Rate Limiting Adaptativo
                </CardTitle>
                <CardDescription>
                  Ajuste automático basado en carga del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="adaptive-enabled"
                    checked={config.adaptiveSettings.enabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      adaptiveSettings: {
                        ...config.adaptiveSettings,
                        enabled: checked
                      }
                    })}
                  />
                  <Label htmlFor="adaptive-enabled">Habilitar Rate Limiting Adaptativo</Label>
                </div>
                {config.adaptiveSettings.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Umbral de Carga (%)</Label>
                      <Input
                        type="number"
                        value={config.adaptiveSettings.loadThreshold}
                        onChange={(e) => setConfig({
                          ...config,
                          adaptiveSettings: {
                            ...config.adaptiveSettings,
                            loadThreshold: parseInt(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Factor de Escala</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={config.adaptiveSettings.scaleFactor}
                        onChange={(e) => setConfig({
                          ...config,
                          adaptiveSettings: {
                            ...config.adaptiveSettings,
                            scaleFactor: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detección de Bots */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Detección de Bots
                </CardTitle>
                <CardDescription>
                  Configuración para detectar y bloquear bots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bot-detection-enabled"
                    checked={config.botDetection.enabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      botDetection: {
                        ...config.botDetection,
                        enabled: checked
                      }
                    })}
                  />
                  <Label htmlFor="bot-detection-enabled">Habilitar Detección de Bots</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bot-strict-mode"
                    checked={config.botDetection.strictMode}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      botDetection: {
                        ...config.botDetection,
                        strictMode: checked
                      }
                    })}
                  />
                  <Label htmlFor="bot-strict-mode">Modo Estricto</Label>
                </div>
                <div className="space-y-2">
                  <Label>Patrones de Bot</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar patrón (ej: crawler)"
                      value={newBotPattern}
                      onChange={(e) => setNewBotPattern(e.target.value)}
                    />
                    <Button onClick={addBotPattern} size="sm">
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.botDetection.patterns.map((pattern) => (
                      <Badge key={pattern} variant="outline" className="cursor-pointer"
                             onClick={() => removeBotPattern(pattern)}>
                        {pattern} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listas de IPs */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Lista Blanca de IPs
                </CardTitle>
                <CardDescription>
                  IPs que siempre tendrán acceso sin límites
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="192.168.1.1"
                    value={newWhitelistIP}
                    onChange={(e) => setNewWhitelistIP(e.target.value)}
                  />
                  <Button onClick={addWhitelistIP} size="sm">
                    Agregar
                  </Button>
                </div>
                <div className="space-y-2">
                  {config.whitelistedIPs.map((ip) => (
                    <div key={ip} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono">{ip}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWhitelistIP(ip)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {config.whitelistedIPs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay IPs en la lista blanca
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Lista Negra de IPs
                </CardTitle>
                <CardDescription>
                  IPs que siempre serán bloqueadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="192.168.1.100"
                    value={newBlacklistIP}
                    onChange={(e) => setNewBlacklistIP(e.target.value)}
                  />
                  <Button onClick={addBlacklistIP} size="sm">
                    Agregar
                  </Button>
                </div>
                <div className="space-y-2">
                  {config.blacklistedIPs.map((ip) => (
                    <div key={ip} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono">{ip}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlacklistIP(ip)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {config.blacklistedIPs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay IPs en la lista negra
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blocked-ips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                IPs Bloqueadas Temporalmente
              </CardTitle>
              <CardDescription>
                IPs que están actualmente bloqueadas por exceder límites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedIPs.length > 0 ? (
                <div className="space-y-4">
                  {blockedIPs.map((blockedIP) => (
                    <div key={blockedIP.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{blockedIP.ip_address}</span>
                          <Badge variant="destructive">
                            Riesgo: {blockedIP.risk_score}/100
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetLimits('ip', blockedIP.ip_address)}
                          >
                            Desbloquear
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Razón:</span>
                          <span className="ml-1">{blockedIP.reason}</span>
                        </div>
                        <div>
                          <span className="font-medium">Bloqueos:</span>
                          <span className="ml-1">{blockedIP.block_count}</span>
                        </div>
                        <div>
                          <span className="font-medium">Bloqueado hasta:</span>
                          <span className="ml-1">
                            {new Date(blockedIP.blocked_until).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Creado:</span>
                          <span className="ml-1">
                            {new Date(blockedIP.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay IPs bloqueadas actualmente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Patrones de Tráfico Sospechoso
              </CardTitle>
              <CardDescription>
                Patrones automáticamente detectados que pueden indicar abuso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousPatterns.length > 0 ? (
                <div className="space-y-4">
                  {suspiciousPatterns.map((pattern) => (
                    <div key={pattern.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pattern.pattern_type}</span>
                          <Badge variant={getSeverityBadge(pattern.severity)}>
                            {pattern.severity}
                          </Badge>
                          <Badge variant="outline">
                            Confianza: {(pattern.confidence_score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Detectado {pattern.detection_count} veces
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">IP:</span>
                          <span className="ml-1 font-mono">{pattern.ip_address}</span>
                        </div>
                        <div>
                          <span className="font-medium">Primera detección:</span>
                          <span className="ml-1">
                            {new Date(pattern.first_detected).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Última detección:</span>
                          <span className="ml-1">
                            {new Date(pattern.last_detected).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Estado:</span>
                          <span className="ml-1">
                            {pattern.is_resolved ? 'Resuelto' : 'Activo'}
                          </span>
                        </div>
                      </div>
                      {pattern.pattern_data && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <pre>{JSON.stringify(pattern.pattern_data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No se han detectado patrones sospechosos
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Endpoints Más Bloqueados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.topBlockedEndpoints ? (
                  <div className="space-y-2">
                    {stats.topBlockedEndpoints.slice(0, 5).map((endpoint, index) => (
                      <div key={endpoint.endpoint} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <span className="font-mono text-sm">{endpoint.endpoint}</span>
                        </span>
                        <Badge variant="destructive">{endpoint.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  IPs Más Bloqueadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.topBlockedIPs ? (
                  <div className="space-y-2">
                    {stats.topBlockedIPs.slice(0, 5).map((ip, index) => (
                      <div key={ip.ip} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <span className="font-mono text-sm">{ip.ip}</span>
                        </span>
                        <Badge variant="destructive">{ip.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Probar Rate Limiting
                </CardTitle>
                <CardDescription>
                  Simula una request para verificar los límites
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-ip">Dirección IP</Label>
                  <Input
                    id="test-ip"
                    placeholder="192.168.1.1"
                    value={testIP}
                    onChange={(e) => setTestIP(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-endpoint">Endpoint</Label>
                  <Input
                    id="test-endpoint"
                    placeholder="/api/videos/stream"
                    value={testEndpoint}
                    onChange={(e) => setTestEndpoint(e.target.value)}
                  />
                </div>
                <Button onClick={testRateLimit} disabled={loading || !testIP} className="w-full">
                  {loading ? 'Probando...' : 'Probar Rate Limiting'}
                </Button>
              </CardContent>
            </Card>

            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {testResult.allowed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Resultado de la Prueba
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">
                          Request: {testResult.allowed ? 'Permitida' : 'Bloqueada'}
                        </p>
                        {testResult.reason && (
                          <p className="text-sm">Razón: {testResult.reason}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Remaining:</span>
                            <span className="ml-1">{testResult.remaining}</span>
                          </div>
                          <div>
                            <span className="font-medium">Reset Time:</span>
                            <span className="ml-1">
                              {new Date(testResult.resetTime).toLocaleTimeString()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Risk Score:</span>
                            <span className="ml-1">{testResult.riskScore}/100</span>
                          </div>
                          <div>
                            <span className="font-medium">Adaptive:</span>
                            <span className="ml-1">{testResult.adaptiveMultiplier}x</span>
                          </div>
                        </div>
                        {testResult.retryAfter && (
                          <p className="text-sm text-red-600">
                            Reintentar en: {testResult.retryAfter} segundos
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Acciones de Reset */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Resetear Límites
              </CardTitle>
              <CardDescription>
                Resetea contadores y límites para pruebas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => resetLimits('all')}
                  disabled={loading}
                >
                  Resetear Todo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => resetLimits('user', user?.id)}
                  disabled={loading}
                >
                  Resetear Usuario
                </Button>
                <Button
                  variant="outline"
                  onClick={() => resetLimits('endpoint', testEndpoint)}
                  disabled={loading}
                >
                  Resetear Endpoint
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RateLimiting;

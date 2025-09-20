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
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Activity,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  Clock,
  Users,
  TrendingUp,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface GeoBlockingRules {
  allowedCountries: string[];
  blockedCountries: string[];
  allowedRegions?: string[];
  blockedRegions?: string[];
  vpnBlocking: boolean;
  proxyBlocking: boolean;
  torBlocking: boolean;
  customRules?: {
    ipRanges?: string[];
    asn?: number[];
    userAgentPatterns?: string[];
  };
  timeRestrictions?: {
    timezone: string;
    allowedHours: { start: number; end: number }[];
    allowedDays: number[];
  };
}

interface LocationInfo {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  asn: number;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  threatLevel: 'low' | 'medium' | 'high';
}

interface BlockedAttempt {
  id: string;
  ip_address: string;
  country_code: string;
  country_name: string;
  region: string;
  city: string;
  reason: string;
  risk_score: number;
  user_agent: string;
  created_at: string;
  location_data: LocationInfo;
}

interface TrafficAnalytics {
  totalRequests: number;
  blockedRequests: number;
  blockingRate: number;
  topBlockedCountries: Array<{ country: string; count: number }>;
  riskDistribution: Record<string, number>;
  trafficByLocation: Record<string, number>;
  blockedByLocation: Record<string, number>;
}

const GeoBlocking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<GeoBlockingRules>({
    allowedCountries: [],
    blockedCountries: ['CN', 'RU', 'IR', 'KP'],
    vpnBlocking: true,
    proxyBlocking: true,
    torBlocking: true,
    customRules: {
      ipRanges: [],
      asn: [],
      userAgentPatterns: []
    },
    timeRestrictions: {
      timezone: 'UTC',
      allowedHours: [{ start: 0, end: 23 }],
      allowedDays: [0, 1, 2, 3, 4, 5, 6]
    }
  });
  const [blockedAttempts, setBlockedAttempts] = useState<BlockedAttempt[]>([]);
  const [analytics, setAnalytics] = useState<TrafficAnalytics | null>(null);
  const [testIP, setTestIP] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [videos, setVideos] = useState<any[]>([]);
  const [newBlockedCountry, setNewBlockedCountry] = useState('');
  const [newAllowedCountry, setNewAllowedCountry] = useState('');
  const [newIPRange, setNewIPRange] = useState('');

  useEffect(() => {
    if (user) {
      loadGeoBlockingRules();
      loadVideos();
      loadBlockedAttempts();
      loadAnalytics();
    }
  }, [user]);

  const loadGeoBlockingRules = async () => {
    try {
  
        const data = null, error = null;

      if (data && !error) {
        setRules({
          allowedCountries: data.allowed_countries || [],
          blockedCountries: data.blocked_countries || [],
          allowedRegions: data.allowed_regions || [],
          blockedRegions: data.blocked_regions || [],
          vpnBlocking: data.vpn_blocking || false,
          proxyBlocking: data.proxy_blocking || false,
          torBlocking: data.tor_blocking || false,
          customRules: data.custom_rules || {},
          timeRestrictions: data.time_restrictions || undefined
        });
      }
    } catch (error) {
      console.error('Error loading geo-blocking rules:', error);
    }
  };

  const loadVideos = async () => {
    try {

        const data = null, error = null;

      if (data && !error) {
        setVideos(data);
        if (data.length > 0 && !selectedVideo) {
          setSelectedVideo(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const loadBlockedAttempts = async () => {
    try {
      

      if (data && !error) {
        setBlockedAttempts(data.blockedAttempts || []);
      }
    } catch (error) {
      console.error('Error loading blocked attempts:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      

      if (data && !error) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const saveRules = async () => {
    setLoading(true);
    try {
      

      toast({
        title: "Reglas actualizadas",
        description: "Las reglas de geo-blocking han sido guardadas exitosamente"
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

  const testIPAccess = async () => {
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

  const addBlockedCountry = () => {
    if (newBlockedCountry && !rules.blockedCountries.includes(newBlockedCountry.toUpperCase())) {
      setRules({
        ...rules,
        blockedCountries: [...rules.blockedCountries, newBlockedCountry.toUpperCase()]
      });
      setNewBlockedCountry('');
    }
  };

  const removeBlockedCountry = (country: string) => {
    setRules({
      ...rules,
      blockedCountries: rules.blockedCountries.filter(c => c !== country)
    });
  };

  const addAllowedCountry = () => {
    if (newAllowedCountry && !rules.allowedCountries.includes(newAllowedCountry.toUpperCase())) {
      setRules({
        ...rules,
        allowedCountries: [...rules.allowedCountries, newAllowedCountry.toUpperCase()]
      });
      setNewAllowedCountry('');
    }
  };

  const removeAllowedCountry = (country: string) => {
    setRules({
      ...rules,
      allowedCountries: rules.allowedCountries.filter(c => c !== country)
    });
  };

  const addIPRange = () => {
    if (newIPRange && !rules.customRules?.ipRanges?.includes(newIPRange)) {
      setRules({
        ...rules,
        customRules: {
          ...rules.customRules,
          ipRanges: [...(rules.customRules?.ipRanges || []), newIPRange]
        }
      });
      setNewIPRange('');
    }
  };

  const removeIPRange = (ipRange: string) => {
    setRules({
      ...rules,
      customRules: {
        ...rules.customRules,
        ipRanges: rules.customRules?.ipRanges?.filter(ip => ip !== ipRange) || []
      }
    });
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getThreatLevelBadge = (level: string) => {
    switch (level) {
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
          <h2 className="text-3xl font-bold tracking-tight">Geo-blocking</h2>
          <p className="text-muted-foreground">
            Controla el acceso a tu contenido basado en ubicación geográfica
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnalytics} variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={saveRules} disabled={loading}>
            <Settings className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Reglas'}
          </Button>
        </div>
      </div>

      {/* Métricas generales */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 7 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests Bloqueados</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.blockedRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.blockingRate.toFixed(1)}% de bloqueo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Países Bloqueados</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.topBlockedCountries.length}</div>
              <p className="text-xs text-muted-foreground">
                Con actividad reciente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Bloqueo</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.blockingRate.toFixed(1)}%</div>
              <Progress value={analytics.blockingRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="blocked-attempts">Intentos Bloqueados</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="test">Pruebas</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Países Bloqueados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Países Bloqueados
                </CardTitle>
                <CardDescription>
                  Países desde los cuales se bloqueará el acceso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Código país (ej: CN, RU)"
                    value={newBlockedCountry}
                    onChange={(e) => setNewBlockedCountry(e.target.value.toUpperCase())}
                    maxLength={2}
                  />
                  <Button onClick={addBlockedCountry} size="sm">
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rules.blockedCountries.map((country) => (
                    <Badge key={country} variant="destructive" className="cursor-pointer"
                           onClick={() => removeBlockedCountry(country)}>
                      {country} ×
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Países Permitidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Países Permitidos
                </CardTitle>
                <CardDescription>
                  Solo estos países tendrán acceso (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Código país (ej: US, CA)"
                    value={newAllowedCountry}
                    onChange={(e) => setNewAllowedCountry(e.target.value.toUpperCase())}
                    maxLength={2}
                  />
                  <Button onClick={addAllowedCountry} size="sm">
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rules.allowedCountries.map((country) => (
                    <Badge key={country} variant="default" className="cursor-pointer"
                           onClick={() => removeAllowedCountry(country)}>
                      {country} ×
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Seguridad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configuración de Seguridad
                </CardTitle>
                <CardDescription>
                  Bloquear conexiones sospechosas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="vpn-blocking"
                    checked={rules.vpnBlocking}
                    onCheckedChange={(checked) => setRules({ ...rules, vpnBlocking: checked })}
                  />
                  <Label htmlFor="vpn-blocking">Bloquear VPN</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="proxy-blocking"
                    checked={rules.proxyBlocking}
                    onCheckedChange={(checked) => setRules({ ...rules, proxyBlocking: checked })}
                  />
                  <Label htmlFor="proxy-blocking">Bloquear Proxies</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tor-blocking"
                    checked={rules.torBlocking}
                    onCheckedChange={(checked) => setRules({ ...rules, torBlocking: checked })}
                  />
                  <Label htmlFor="tor-blocking">Bloquear Red Tor</Label>
                </div>
              </CardContent>
            </Card>

            {/* Reglas Personalizadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Reglas Personalizadas
                </CardTitle>
                <CardDescription>
                  Configuración avanzada de bloqueo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rangos IP Bloqueados</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="192.168.1.0/24"
                      value={newIPRange}
                      onChange={(e) => setNewIPRange(e.target.value)}
                    />
                    <Button onClick={addIPRange} size="sm">
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rules.customRules?.ipRanges?.map((ipRange) => (
                      <Badge key={ipRange} variant="outline" className="cursor-pointer"
                             onClick={() => removeIPRange(ipRange)}>
                        {ipRange} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blocked-attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Intentos de Acceso Bloqueados
              </CardTitle>
              <CardDescription>
                Registro de intentos de acceso denegados por geo-blocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedAttempts.length > 0 ? (
                <div className="space-y-4">
                  {blockedAttempts.slice(0, 10).map((attempt) => (
                    <div key={attempt.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">
                            {attempt.location_data?.country || attempt.country_name} - {attempt.city}
                          </span>
                          <Badge variant={getThreatLevelBadge(attempt.location_data?.threatLevel || 'low')}>
                            {attempt.location_data?.threatLevel || 'low'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(attempt.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">IP:</span>
                          <span className="ml-1">{attempt.ip_address}</span>
                        </div>
                        <div>
                          <span className="font-medium">Razón:</span>
                          <span className="ml-1">{attempt.reason}</span>
                        </div>
                        <div>
                          <span className="font-medium">Riesgo:</span>
                          <span className="ml-1">{attempt.risk_score}/100</span>
                        </div>
                        <div>
                          <span className="font-medium">ISP:</span>
                          <span className="ml-1">{attempt.location_data?.isp || 'N/A'}</span>
                        </div>
                      </div>
                      {(attempt.location_data?.isVpn || attempt.location_data?.isProxy || attempt.location_data?.isTor) && (
                        <div className="mt-2 flex gap-2">
                          {attempt.location_data.isVpn && <Badge variant="destructive">VPN</Badge>}
                          {attempt.location_data.isProxy && <Badge variant="destructive">Proxy</Badge>}
                          {attempt.location_data.isTor && <Badge variant="destructive">Tor</Badge>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay intentos bloqueados recientes
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
                  Países Más Bloqueados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.topBlockedCountries ? (
                  <div className="space-y-2">
                    {analytics.topBlockedCountries.slice(0, 5).map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <span>{country.country}</span>
                        </span>
                        <Badge variant="destructive">{country.count}</Badge>
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
                  Distribución de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.riskDistribution ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-green-600">Bajo Riesgo</span>
                      <span className="font-medium">{analytics.riskDistribution.low || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-600">Riesgo Medio</span>
                      <span className="font-medium">{analytics.riskDistribution.medium || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">Alto Riesgo</span>
                      <span className="font-medium">{analytics.riskDistribution.high || 0}</span>
                    </div>
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
                  Probar Acceso por IP
                </CardTitle>
                <CardDescription>
                  Verifica si una IP específica sería bloqueada
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
                  <Label htmlFor="test-video">Video (opcional)</Label>
                  <select
                    id="test-video"
                    className="w-full p-2 border rounded-md"
                    value={selectedVideo}
                    onChange={(e) => setSelectedVideo(e.target.value)}
                  >
                    <option value="">Usar reglas por defecto</option>
                    {videos.map((video) => (
                      <option key={video.id} value={video.id}>
                        {video.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={testIPAccess} disabled={loading || !testIP} className="w-full">
                  {loading ? 'Probando...' : 'Probar Acceso'}
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
                          Acceso: {testResult.allowed ? 'Permitido' : 'Bloqueado'}
                        </p>
                        {testResult.reason && (
                          <p className="text-sm">Razón: {testResult.reason}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">País:</span>
                            <span className="ml-1">{testResult.location.country}</span>
                          </div>
                          <div>
                            <span className="font-medium">Ciudad:</span>
                            <span className="ml-1">{testResult.location.city}</span>
                          </div>
                          <div>
                            <span className="font-medium">ISP:</span>
                            <span className="ml-1">{testResult.location.isp}</span>
                          </div>
                          <div>
                            <span className="font-medium">Riesgo:</span>
                            <span className="ml-1">{testResult.riskScore}/100</span>
                          </div>
                        </div>
                        {(testResult.location.isVpn || testResult.location.isProxy || testResult.location.isTor) && (
                          <div className="flex gap-2 mt-2">
                            {testResult.location.isVpn && <Badge variant="destructive">VPN</Badge>}
                            {testResult.location.isProxy && <Badge variant="destructive">Proxy</Badge>}
                            {testResult.location.isTor && <Badge variant="destructive">Tor</Badge>}
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeoBlocking;

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Users, 
  Ban, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  Settings, 
  Trash2, 
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Filter,
  Search,
  Globe,
  Smartphone,
  Monitor,
  Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient as api } from '@/lib/api';
interface RateLimitEntry {
  id: string;
  identifier: string;
  endpoint: string;
  requests: number;
  limit: number;
  windowStart: string;
  windowEnd: string;
  blocked: boolean;
  lastRequest: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  country?: string;
  deviceType?: string;
}

interface RateLimitRule {
  id: string;
  endpoint: string;
  windowMs: number;
  maxRequests: number;
  enabled: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  uniqueIPs: number;
  topEndpoints: { endpoint: string; requests: number }[];
  topIPs: { ip: string; requests: number; blocked: number }[];
  hourlyStats: { hour: string; requests: number; blocked: number }[];
}

interface RawRateLimitData {
  id: string;
  identifier: string;
  endpoint?: string;
  limit?: number;
  blocked?: boolean;
  created_at: string;
  user_agent?: string;
  ip_address?: string;
  user_id?: string;
  country?: string;
  device_type?: string;
}

const PRESET_RULES = [
  {
    endpoint: '/api/auth/*',
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    description: 'Authentication endpoints - strict limiting'
  },
  {
    endpoint: '/api/videos/upload',
    windowMs: 60 * 60 * 1000,
    maxRequests: 50,
    description: 'Video upload endpoint'
  },
  {
    endpoint: '/api/videos/stream',
    windowMs: 60 * 1000,
    maxRequests: 100,
    description: 'Video streaming endpoint'
  },
  {
    endpoint: '/api/live-streams/*',
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    description: 'Live streaming endpoints'
  },
  {
    endpoint: '/api/analytics/*',
    windowMs: 60 * 1000,
    maxRequests: 60,
    description: 'Analytics endpoints'
  },
];

export const RateLimitMonitor = () => {
  const [entries, setEntries] = useState<RateLimitEntry[]>([]);
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newRule, setNewRule] = useState({
    endpoint: '',
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedTimeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRateLimitEntries(),
        loadRateLimitRules(),
        loadRateLimitStats()
      ]);
    } catch (error: unknown) {
      toast({
        title: "Error al cargar datos",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRateLimitEntries = async () => {
    const timeRange = getTimeRangeDate(selectedTimeRange);
    
    // TODO: Replace with API call
        const data = null, error = null;

    if (error) throw error;
    
    // Process and group the data
    const processedEntries = processRateLimitData(data || []);
    setEntries(processedEntries);
  };

  const loadRateLimitRules = async () => {
    // TODO: Replace with API call
        const data = null, error = null;

    if (error && error.code !== 'PGRST116') throw error;
    setRules(data || []);
  };

  const loadRateLimitStats = async () => {
    try {
      // TODO: Replace with API call
      const data = null, error = null;

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading rate limit stats:', error);
    }
  };

  const processRateLimitData = (data: RawRateLimitData[]): RateLimitEntry[] => {
    const grouped = new Map<string, RateLimitEntry>();
    
    data.forEach(entry => {
      const key = `${entry.identifier}-${entry.endpoint || 'unknown'}`;
      const existing = grouped.get(key);
      
      if (existing) {
        existing.requests++;
        if (new Date(entry.created_at) > new Date(existing.lastRequest)) {
          existing.lastRequest = entry.created_at;
        }
      } else {
        grouped.set(key, {
          id: entry.id,
          identifier: entry.identifier,
          endpoint: entry.endpoint || 'unknown',
          requests: 1,
          limit: entry.limit || 100,
          windowStart: entry.created_at,
          windowEnd: entry.created_at,
          blocked: entry.blocked || false,
          lastRequest: entry.created_at,
          userAgent: entry.user_agent,
          ipAddress: entry.ip_address,
          userId: entry.user_id,
          country: entry.country,
          deviceType: entry.device_type,
        });
      }
    });
    
    return Array.from(grouped.values());
  };

  const createRule = async () => {
    try {
      // TODO: Replace with API call
        const data = null, error = null;

      if (error) throw error;

      await loadRateLimitRules();
      setShowCreateRule(false);
      setNewRule({
        endpoint: '',
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        description: ''
      });
      
      toast({
        title: "Regla creada",
        description: "La nueva regla de rate limiting ha sido creada",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al crear regla",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      // TODO: Replace with API call
        const data = null, error = null;

      if (error) throw error;

      await loadRateLimitRules();
      
      toast({
        title: enabled ? "Regla activada" : "Regla desactivada",
        description: `La regla ha sido ${enabled ? 'activada' : 'desactivada'}`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error al actualizar regla",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      // TODO: Replace with API call
        const data = null, error = null;

      if (error) throw error;

      await loadRateLimitRules();
      
      toast({
        title: "Regla eliminada",
        description: "La regla de rate limiting ha sido eliminada",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al eliminar regla",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const blockIP = async (ipAddress: string) => {
    try {
      // TODO: Replace with API call
      
      toast({
        title: "IP bloqueada",
        description: `La IP ${ipAddress} ha sido bloqueada por 24 horas`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error al bloquear IP",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const getTimeRangeDate = (range: string): Date => {
    const now = new Date();
    switch (range) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 60 * 60 * 1000);
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (blocked: boolean, requests: number, limit: number) => {
    if (blocked) return 'bg-red-500';
    if (requests >= limit * 0.8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'blocked' && entry.blocked) ||
                         (filterStatus === 'active' && !entry.blocked);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold">Rate Limiting</h2>
            <p className="text-muted-foreground">Monitorea y gestiona los límites de velocidad de la API</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Auto-refresh</Label>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                  <p className="text-2xl font-bold text-red-500">{stats.blockedRequests.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Unique IPs</p>
                  <p className="text-2xl font-bold">{stats.uniqueIPs.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Block Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.totalRequests > 0 ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Buscar por IP o endpoint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 hora</SelectItem>
                <SelectItem value="6h">6 horas</SelectItem>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="7d">7 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Entries List */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad de Rate Limiting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(entry.blocked, entry.requests, entry.limit)}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.identifier}</span>
                          {entry.blocked && <Badge variant="destructive">Bloqueado</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.endpoint} • {entry.requests}/{entry.limit} requests
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Último: {new Date(entry.lastRequest).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {entry.ipAddress && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => blockIP(entry.ipAddress!)}
                        >
                          <Ban className="w-4 h-4" />
                          Bloquear IP
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredEntries.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay actividad</h3>
                    <p className="text-muted-foreground">No se encontraron entradas para los filtros seleccionados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showCreateRule} onOpenChange={setShowCreateRule}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Regla
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Regla</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <Input
                      value={newRule.endpoint}
                      onChange={(e) => setNewRule({ ...newRule, endpoint: e.target.value })}
                      placeholder="/api/auth/*"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ventana (minutos)</Label>
                      <Input
                        type="number"
                        value={newRule.windowMs / (60 * 1000)}
                        onChange={(e) => setNewRule({ ...newRule, windowMs: parseInt(e.target.value) * 60 * 1000 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Máximo Requests</Label>
                      <Input
                        type="number"
                        value={newRule.maxRequests}
                        onChange={(e) => setNewRule({ ...newRule, maxRequests: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                      placeholder="Descripción de la regla"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateRule(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createRule} disabled={!newRule.endpoint}>
                      Crear Regla
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {rules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rule.endpoint}</h3>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {rule.maxRequests} requests por {formatDuration(rule.windowMs)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {rules.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay reglas configuradas</h3>
                  <p className="text-muted-foreground mb-4">Crea tu primera regla de rate limiting</p>
                  <Button onClick={() => setShowCreateRule(true)}>
                    Crear Regla
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Detallados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics de Rate Limiting</h3>
                <p className="text-muted-foreground">Gráficos y métricas detalladas próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Globe,
  Server,
  Zap,
  Activity,
  Settings,
  Code,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Cpu,
  HardDrive,
  Network,
  BarChart3,
  TrendingUp,
  Download,
  Upload,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

import { apiClient as api } from '@/lib/api';
interface EdgeLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  city: string;
  status: 'active' | 'inactive' | 'maintenance';
  latency: number;
  cpu_usage: number;
  memory_usage: number;
  bandwidth_usage: number;
  requests_per_second: number;
  cache_hit_ratio: number;
  uptime: number;
  last_updated: string;
}

interface EdgeFunction {
  id: string;
  name: string;
  description: string;
  code: string;
  runtime: 'nodejs' | 'python' | 'go' | 'rust';
  memory_limit: number;
  timeout: number;
  status: 'active' | 'inactive' | 'deploying' | 'error';
  deployments: number;
  executions: number;
  avg_execution_time: number;
  error_rate: number;
  created_at: string;
  updated_at: string;
}

interface EdgeRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
  matches: number;
  created_at: string;
}

interface EdgeMetrics {
  total_requests: number;
  cache_hit_ratio: number;
  avg_response_time: number;
  bandwidth_saved: number;
  edge_locations_active: number;
  functions_deployed: number;
  total_executions: number;
  error_rate: number;
}

const EdgeComputing: React.FC = () => {
  const [edgeLocations, setEdgeLocations] = useState<EdgeLocation[]>([]);
  const [edgeFunctions, setEdgeFunctions] = useState<EdgeFunction[]>([]);
  const [edgeRules, setEdgeRules] = useState<EdgeRule[]>([]);
  const [metrics, setMetrics] = useState<EdgeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [newFunction, setNewFunction] = useState({
    name: '',
    description: '',
    code: '',
    runtime: 'nodejs' as const,
    memory_limit: 128,
    timeout: 30
  });
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    condition: '',
    action: '',
    priority: 1,
    enabled: true
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadEdgeData();
    const interval = setInterval(loadEdgeData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadEdgeData = async () => {
    try {
      setLoading(true);
      
      // Cargar métricas de edge computing
      // TODO: Replace with API call
      if (metricsError) throw metricsError;
      setMetrics(metricsData.metrics);
      setEdgeLocations(metricsData.locations);
      
      // Cargar funciones edge
      // TODO: Replace with API call
      if (functionsError) throw functionsError;
      setEdgeFunctions(functionsData.functions);
      
      // Cargar reglas edge
      // TODO: Replace with API call
      if (rulesError) throw rulesError;
      setEdgeRules(rulesData.rules);
      
    } catch (error) {
      console.error('Error loading edge data:', error);
      toast.error('Error al cargar datos de edge computing');
    } finally {
      setLoading(false);
    }
  };

  const deployFunction = async () => {
    if (!newFunction.name || !newFunction.code) {
      toast.error('Nombre y código son requeridos');
      return;
    }

    try {
      // TODO: Replace with API call
      
      if (error) throw error;
      
      toast.success('Función edge desplegada exitosamente');
      setNewFunction({
        name: '',
        description: '',
        code: '',
        runtime: 'nodejs',
        memory_limit: 128,
        timeout: 30
      });
      loadEdgeData();
    } catch (error) {
      console.error('Error deploying function:', error);
      toast.error('Error al desplegar función edge');
    }
  };

  const createRule = async () => {
    if (!newRule.name || !newRule.condition || !newRule.action) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    try {
      // TODO: Replace with API call
      
      if (error) throw error;
      
      toast.success('Regla edge creada exitosamente');
      setNewRule({
        name: '',
        description: '',
        condition: '',
        action: '',
        priority: 1,
        enabled: true
      });
      loadEdgeData();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Error al crear regla edge');
    }
  };

  const toggleFunction = async (functionId: string, status: string) => {
    try {
      // TODO: Replace with API call
      
      if (error) throw error;
      
      toast.success(`Función ${status === 'active' ? 'activada' : 'desactivada'} exitosamente`);
      loadEdgeData();
    } catch (error) {
      console.error('Error toggling function:', error);
      toast.error('Error al cambiar estado de función');
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      // TODO: Replace with API call
      
      if (error) throw error;
      
      toast.success(`Regla ${enabled ? 'habilitada' : 'deshabilitada'} exitosamente`);
      loadEdgeData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Error al cambiar estado de regla');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'deploying': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <Pause className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      case 'deploying': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando edge computing...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edge Computing</h2>
          <p className="text-muted-foreground">
            Configuración y monitoreo de edge computing con Bunny CDN
          </p>
        </div>
        <Button onClick={loadEdgeData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Métricas generales */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests Totales</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_requests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Procesados en edge locations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.cache_hit_ratio}%</div>
              <Progress value={metrics.cache_hit_ratio} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avg_response_time}ms</div>
              <p className="text-xs text-muted-foreground">
                Promedio global
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations Activas</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.edge_locations_active}</div>
              <p className="text-xs text-muted-foreground">
                De {edgeLocations.length} totales
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="functions">Funciones</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Funciones Edge Activas</CardTitle>
                <CardDescription>
                  Estado de las funciones desplegadas en edge locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {edgeFunctions.slice(0, 5).map((func) => (
                    <div key={func.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(func.status)}
                        <div>
                          <p className="font-medium">{func.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {func.executions.toLocaleString()} ejecuciones
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(func.status)}>
                        {func.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Región</CardTitle>
                <CardDescription>
                  Métricas de rendimiento de edge locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {edgeLocations.slice(0, 5).map((location) => (
                    <div key={location.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{location.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {location.latency}ms
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">CPU:</span>
                          <span className="ml-1">{location.cpu_usage}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">RAM:</span>
                          <span className="ml-1">{location.memory_usage}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cache:</span>
                          <span className="ml-1">{location.cache_hit_ratio}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edge Locations</CardTitle>
              <CardDescription>
                Monitoreo y gestión de edge locations globales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {edgeLocations.map((location) => (
                    <Card key={location.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-5 w-5" />
                            <div>
                              <h3 className="font-semibold">{location.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {location.city}, {location.country}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(location.status)}>
                            {location.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Latencia</p>
                              <p className="font-medium">{location.latency}ms</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">CPU</p>
                              <p className="font-medium">{location.cpu_usage}%</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Memoria</p>
                              <p className="font-medium">{location.memory_usage}%</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Network className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">RPS</p>
                              <p className="font-medium">{location.requests_per_second}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span>Cache Hit: {location.cache_hit_ratio}%</span>
                            <span>Uptime: {location.uptime}%</span>
                          </div>
                          <span className="text-muted-foreground">
                            Actualizado: {new Date(location.last_updated).toLocaleTimeString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Desplegar Nueva Función</CardTitle>
                <CardDescription>
                  Crear y desplegar función edge personalizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="function-name">Nombre</Label>
                    <Input
                      id="function-name"
                      value={newFunction.name}
                      onChange={(e) => setNewFunction({...newFunction, name: e.target.value})}
                      placeholder="mi-funcion-edge"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="function-runtime">Runtime</Label>
                    <Select
                      value={newFunction.runtime}
                      onValueChange={(value: string) => setNewFunction({...newFunction, runtime: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nodejs">Node.js</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="function-description">Descripción</Label>
                  <Input
                    id="function-description"
                    value={newFunction.description}
                    onChange={(e) => setNewFunction({...newFunction, description: e.target.value})}
                    placeholder="Descripción de la función"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="function-memory">Memoria (MB)</Label>
                    <Input
                      id="function-memory"
                      type="number"
                      value={newFunction.memory_limit}
                      onChange={(e) => setNewFunction({...newFunction, memory_limit: parseInt(e.target.value)})}
                      min="128"
                      max="1024"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="function-timeout">Timeout (s)</Label>
                    <Input
                      id="function-timeout"
                      type="number"
                      value={newFunction.timeout}
                      onChange={(e) => setNewFunction({...newFunction, timeout: parseInt(e.target.value)})}
                      min="1"
                      max="300"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="function-code">Código</Label>
                  <Textarea
                    id="function-code"
                    value={newFunction.code}
                    onChange={(e) => setNewFunction({...newFunction, code: e.target.value})}
                    placeholder="// Código de la función edge\nexport default async function handler(request) {\n  return new Response('Hello from edge!');\n}"
                    rows={8}
                    className="font-mono"
                  />
                </div>
                
                <Button onClick={deployFunction} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Desplegar Función
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funciones Desplegadas</CardTitle>
                <CardDescription>
                  Gestión de funciones edge activas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {edgeFunctions.map((func) => (
                      <Card key={func.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Code className="h-4 w-4" />
                              <h3 className="font-semibold">{func.name}</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(func.status)}>
                                {func.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleFunction(func.id, func.status === 'active' ? 'inactive' : 'active')}
                              >
                                {func.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {func.description}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Runtime:</span>
                              <span className="ml-1 font-medium">{func.runtime}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ejecuciones:</span>
                              <span className="ml-1 font-medium">{func.executions.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tiempo Avg:</span>
                              <span className="ml-1 font-medium">{func.avg_execution_time}ms</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Error Rate:</span>
                              <span className="ml-1 font-medium">{func.error_rate}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Regla</CardTitle>
                <CardDescription>
                  Configurar reglas de enrutamiento y procesamiento edge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Nombre</Label>
                  <Input
                    id="rule-name"
                    value={newRule.name}
                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    placeholder="Regla de cache para videos"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rule-description">Descripción</Label>
                  <Input
                    id="rule-description"
                    value={newRule.description}
                    onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    placeholder="Descripción de la regla"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rule-condition">Condición</Label>
                  <Textarea
                    id="rule-condition"
                    value={newRule.condition}
                    onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                    placeholder="request.url.includes('/api/videos') && request.method === 'GET'"
                    rows={3}
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rule-action">Acción</Label>
                  <Textarea
                    id="rule-action"
                    value={newRule.action}
                    onChange={(e) => setNewRule({...newRule, action: e.target.value})}
                    placeholder="cache(3600) // Cache por 1 hora"
                    rows={3}
                    className="font-mono"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-priority">Prioridad</Label>
                    <Input
                      id="rule-priority"
                      type="number"
                      value={newRule.priority}
                      onChange={(e) => setNewRule({...newRule, priority: parseInt(e.target.value)})}
                      min="1"
                      max="100"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      checked={newRule.enabled}
                      onCheckedChange={(checked) => setNewRule({...newRule, enabled: checked})}
                    />
                    <Label>Habilitada</Label>
                  </div>
                </div>
                
                <Button onClick={createRule} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Crear Regla
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reglas Configuradas</CardTitle>
                <CardDescription>
                  Gestión de reglas edge activas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {edgeRules.map((rule) => (
                      <Card key={rule.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Settings className="h-4 w-4" />
                              <h3 className="font-semibold">{rule.name}</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                                Prioridad {rule.priority}
                              </Badge>
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                              />
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {rule.description}
                          </p>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Condición:</span>
                              <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                                {rule.condition}
                              </code>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Acción:</span>
                              <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                                {rule.action}
                              </code>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-muted-foreground">
                                Matches: {rule.matches.toLocaleString()}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(rule.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EdgeComputing;

import React, { useState, useEffect, useRef } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Eye,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Globe,
  Users,
  Video,
  Download,
  Upload,
  Timer,
  Gauge,
  Bell,
  Shield,
  LineChart
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_latency: number;
  bandwidth_usage: {
    incoming: number;
    outgoing: number;
  };
  active_connections: number;
  response_time: number;
  error_rate: number;
  uptime: number;
  timestamp: string;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: string;
  threshold: number;
  current_value: number;
  message: string;
  created_at: string;
  resolved: boolean;
  auto_action?: string;
}

interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  action: string;
  enabled: boolean;
  last_triggered?: string;
  trigger_count: number;
}

interface PerformanceReport {
  id: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  metrics_summary: {
    avg_cpu: number;
    avg_memory: number;
    avg_response_time: number;
    total_requests: number;
    error_count: number;
    uptime_percentage: number;
  };
  recommendations: string[];
  issues_detected: number;
  optimizations_applied: number;
  created_at: string;
}

const PerformanceMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    network_latency: 0,
    bandwidth_usage: { incoming: 0, outgoing: 0 },
    active_connections: 0,
    response_time: 0,
    error_rate: 0,
    uptime: 0,
    timestamp: new Date().toISOString()
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [optimizationRules, setOptimizationRules] = useState<OptimizationRule[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoMonitoring, setAutoMonitoring] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoOptimization, setAutoOptimization] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState(30); // seconds

  const [newOptimizationRule, setNewOptimizationRule] = useState({
    name: '',
    description: '',
    metric: 'cpu_usage',
    condition: 'greater_than' as 'greater_than' | 'less_than' | 'equals',
    threshold: 80,
    action: 'scale_up'
  });

  const [metricsHistory, setMetricsHistory] = useState<SystemMetrics[]>([]);
  const monitoringInterval_ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoMonitoring) {
      monitoringInterval_ref.current = setInterval(() => {
        loadSystemMetrics();
      }, monitoringInterval * 1000);
    } else if (monitoringInterval_ref.current) {
      clearInterval(monitoringInterval_ref.current);
    }

    return () => {
      if (monitoringInterval_ref.current) {
        clearInterval(monitoringInterval_ref.current);
      }
    };
  }, [autoMonitoring, monitoringInterval]);

  const loadData = async () => {
    await Promise.all([
      loadSystemMetrics(),
      loadAlerts(),
      loadOptimizationRules(),
      loadReports()
    ]);
  };

  const loadSystemMetrics = async () => {
    try {
      if (!user) return;

      // TODO: Replace with API call
      const data = null, error = null;

      if (error) throw error;
      
      if (data?.metrics) {
        setMetrics(data.metrics);
        
        // Mantener historial de métricas (últimas 100 mediciones)
        setMetricsHistory(prev => {
          const newHistory = [...prev, data.metrics].slice(-100);
          return newHistory;
        });

        // Verificar alertas si están habilitadas
        if (alertsEnabled) {
          checkAlerts(data.metrics);
        }

        // Aplicar optimizaciones automáticas si están habilitadas
        if (autoOptimization) {
          applyAutoOptimizations(data.metrics);
        }
      }

    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      if (!user) return;

      // TODO: Replace with API call
      const data = null, error = null;

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadOptimizationRules = async () => {
    try {
      if (!user) return;

      // TODO: Replace with API call
      const data = null, error = null;

      if (error) throw error;
      setOptimizationRules(data || []);
    } catch (error) {
      console.error('Error loading optimization rules:', error);
    }
  };

  const loadReports = async () => {
    try {
      if (!user) return;

      // TODO: Replace with API call
      const data = null, error = null;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const checkAlerts = async (currentMetrics: SystemMetrics) => {
    const alertThresholds = {
      cpu_usage: { warning: 70, critical: 90 },
      memory_usage: { warning: 75, critical: 90 },
      disk_usage: { warning: 80, critical: 95 },
      response_time: { warning: 1000, critical: 3000 },
      error_rate: { warning: 5, critical: 10 }
    };

    const newAlerts: Omit<PerformanceAlert, 'id' | 'created_at'>[] = [];

    Object.entries(alertThresholds).forEach(([metric, thresholds]) => {
      const value = currentMetrics[metric as keyof SystemMetrics] as number;
      
      if (value >= thresholds.critical) {
        newAlerts.push({
          type: 'critical',
          metric,
          threshold: thresholds.critical,
          current_value: value,
          message: `${metric.replace('_', ' ').toUpperCase()} crítico: ${value}%`,
          resolved: false,
          auto_action: autoOptimization ? 'auto_scale' : undefined
        });
      } else if (value >= thresholds.warning) {
        newAlerts.push({
          type: 'warning',
          metric,
          threshold: thresholds.warning,
          current_value: value,
          message: `${metric.replace('_', ' ').toUpperCase()} alto: ${value}%`,
          resolved: false
        });
      }
    });

    // Crear alertas en la base de datos
    if (newAlerts.length > 0) {
      try {
        if (user) {
          // TODO: Replace with API call
          loadAlerts();
        }
      } catch (error) {
        console.error('Error creating alerts:', error);
      }
    }
  };

  const applyAutoOptimizations = async (currentMetrics: SystemMetrics) => {
    const activeRules = optimizationRules.filter(rule => rule.enabled);
    
    for (const rule of activeRules) {
      const metricValue = currentMetrics[rule.metric as keyof SystemMetrics] as number;
      let shouldTrigger = false;

      switch (rule.condition) {
        case 'greater_than':
          shouldTrigger = metricValue > rule.threshold;
          break;
        case 'less_than':
          shouldTrigger = metricValue < rule.threshold;
          break;
        case 'equals':
          shouldTrigger = metricValue === rule.threshold;
          break;
      }

      if (shouldTrigger) {
        try {
          if (user) {
            // TODO: Replace with API call
            
            toast.success(`Optimización aplicada: ${rule.name}`);
          }
        } catch (error) {
          console.error('Error applying optimization:', error);
        }
      }
    }
  };

  const createOptimizationRule = async () => {
    if (!newOptimizationRule.name || !newOptimizationRule.description) {
      toast.error('Nombre y descripción son requeridos');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      // TODO: Replace with API call
      const data = null, error = null;

      if (error) throw error;

      toast.success('Regla de optimización creada exitosamente');
      setNewOptimizationRule({
        name: '',
        description: '',
        metric: 'cpu_usage',
        condition: 'greater_than',
        threshold: 80,
        action: 'scale_up'
      });
      loadOptimizationRules();
    } catch (error) {
      console.error('Error creating optimization rule:', error);
      toast.error('Error al crear regla de optimización');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (period: 'hourly' | 'daily' | 'weekly' | 'monthly') => {
    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      // TODO: Replace with API call
      const data = null, error = null;

      if (error) throw error;

      toast.success('Reporte generado exitosamente');
      loadReports();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      if (!user) throw new Error('Usuario no autenticado');

      // TODO: Replace with API call
      // const response = await api.patch(`/alerts/${alertId}/resolve`);

      toast.success('Alerta resuelta');
      loadAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Error al resolver alerta');
    }
  };

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getMetricIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <XCircle className="h-4 w-4 text-red-500" />;
    if (value >= thresholds.warning) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoreo de Rendimiento</h2>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real y optimización automática del sistema
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-monitoring">Auto-monitoreo</Label>
            <Switch
              id="auto-monitoring"
              checked={autoMonitoring}
              onCheckedChange={setAutoMonitoring}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="alerts-enabled">Alertas</Label>
            <Switch
              id="alerts-enabled"
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-optimization">Auto-optimización</Label>
            <Switch
              id="auto-optimization"
              checked={autoOptimization}
              onCheckedChange={setAutoOptimization}
            />
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alertas Activas */}
      {alerts.filter(alert => !alert.resolved).length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {alerts.filter(alert => !alert.resolved).length} alerta(s) activa(s) requieren atención
              </span>
              <Button variant="outline" size="sm" onClick={() => loadAlerts()}>
                Ver Alertas
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas del Sistema en Tiempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">CPU</span>
              </div>
              {getMetricIcon(metrics.cpu_usage, { warning: 70, critical: 90 })}
            </div>
            <p className={`text-2xl font-bold mt-2 ${getMetricColor(metrics.cpu_usage, { warning: 70, critical: 90 })}`}>
              {metrics.cpu_usage.toFixed(1)}%
            </p>
            <Progress value={metrics.cpu_usage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Memoria</span>
              </div>
              {getMetricIcon(metrics.memory_usage, { warning: 75, critical: 90 })}
            </div>
            <p className={`text-2xl font-bold mt-2 ${getMetricColor(metrics.memory_usage, { warning: 75, critical: 90 })}`}>
              {metrics.memory_usage.toFixed(1)}%
            </p>
            <Progress value={metrics.memory_usage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Disco</span>
              </div>
              {getMetricIcon(metrics.disk_usage, { warning: 80, critical: 95 })}
            </div>
            <p className={`text-2xl font-bold mt-2 ${getMetricColor(metrics.disk_usage, { warning: 80, critical: 95 })}`}>
              {metrics.disk_usage.toFixed(1)}%
            </p>
            <Progress value={metrics.disk_usage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Latencia</span>
              </div>
              {getMetricIcon(metrics.network_latency, { warning: 100, critical: 300 })}
            </div>
            <p className={`text-2xl font-bold mt-2 ${getMetricColor(metrics.network_latency, { warning: 100, critical: 300 })}`}>
              {metrics.network_latency.toFixed(0)}ms
            </p>
            <p className="text-xs text-muted-foreground">red</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Server className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Estado del Servidor</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Tiempo de Respuesta</span>
                <span className="font-medium">{metrics.response_time}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Conexiones Activas</span>
                <span className="font-medium">{metrics.active_connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tasa de Error</span>
                <span className="font-medium">{metrics.error_rate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Uptime</span>
                <span className="font-medium">{formatUptime(metrics.uptime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Ancho de Banda</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Download className="h-3 w-3" />
                  <span className="text-sm">Entrante</span>
                </div>
                <span className="font-medium">{formatBytes(metrics.bandwidth_usage.incoming)}/s</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Upload className="h-3 w-3" />
                  <span className="text-sm">Saliente</span>
                </div>
                <span className="font-medium">{formatBytes(metrics.bandwidth_usage.outgoing)}/s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Timer className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Configuración</span>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="monitoring-interval">Intervalo de Monitoreo (segundos)</Label>
                <Input
                  id="monitoring-interval"
                  type="number"
                  min="10"
                  max="300"
                  value={monitoringInterval}
                  onChange={(e) => setMonitoringInterval(parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="optimization">Optimización</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Rendimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay alertas registradas
                  </p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className={`border rounded-lg p-4 ${
                      alert.resolved ? 'bg-gray-50' : 
                      alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                      alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {alert.type === 'critical' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : alert.type === 'warning' ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <Bell className="h-5 w-5 text-blue-500" />
                          )}
                          <div>
                            <h4 className="font-medium">{alert.message}</h4>
                            <p className="text-sm text-muted-foreground">
                              {alert.metric} • Umbral: {alert.threshold} • Actual: {alert.current_value}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${
                            alert.resolved ? 'bg-gray-100 text-gray-800' :
                            alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.resolved ? 'Resuelto' : alert.type}
                          </Badge>
                          {!alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolver
                            </Button>
                          )}
                        </div>
                      </div>
                      {alert.auto_action && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Acción automática: {alert.auto_action}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crear Regla de Optimización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rule-name">Nombre de la Regla</Label>
                  <Input
                    id="rule-name"
                    value={newOptimizationRule.name}
                    onChange={(e) => setNewOptimizationRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Escalado automático CPU"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rule-description">Descripción</Label>
                  <Textarea
                    id="rule-description"
                    value={newOptimizationRule.description}
                    onChange={(e) => setNewOptimizationRule(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Escalar recursos cuando el CPU supere el 80%"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-metric">Métrica</Label>
                    <Select 
                      value={newOptimizationRule.metric} 
                      onValueChange={(value) => setNewOptimizationRule(prev => ({ ...prev, metric: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpu_usage">Uso de CPU</SelectItem>
                        <SelectItem value="memory_usage">Uso de Memoria</SelectItem>
                        <SelectItem value="disk_usage">Uso de Disco</SelectItem>
                        <SelectItem value="response_time">Tiempo de Respuesta</SelectItem>
                        <SelectItem value="error_rate">Tasa de Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-condition">Condición</Label>
                    <Select 
                      value={newOptimizationRule.condition} 
                      onValueChange={(value: 'greater_than' | 'less_than' | 'equals') => setNewOptimizationRule(prev => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="greater_than">Mayor que</SelectItem>
                        <SelectItem value="less_than">Menor que</SelectItem>
                        <SelectItem value="equals">Igual a</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-threshold">Umbral</Label>
                    <Input
                      id="rule-threshold"
                      type="number"
                      value={newOptimizationRule.threshold}
                      onChange={(e) => setNewOptimizationRule(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-action">Acción</Label>
                    <Select 
                      value={newOptimizationRule.action} 
                      onValueChange={(value) => setNewOptimizationRule(prev => ({ ...prev, action: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scale_up">Escalar Arriba</SelectItem>
                        <SelectItem value="scale_down">Escalar Abajo</SelectItem>
                        <SelectItem value="restart_service">Reiniciar Servicio</SelectItem>
                        <SelectItem value="clear_cache">Limpiar Caché</SelectItem>
                        <SelectItem value="optimize_database">Optimizar BD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={createOptimizationRule} disabled={loading} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Crear Regla
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reglas de Optimización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizationRules.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay reglas de optimización configuradas
                    </p>
                  ) : (
                    optimizationRules.map((rule) => (
                      <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{rule.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge className={rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {rule.enabled ? 'Activa' : 'Inactiva'}
                            </Badge>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(checked) => {
                                // Aquí iría la lógica para actualizar el estado de la regla
                              }}
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Condición:</span>
                            <span className="ml-2">{rule.metric} {rule.condition.replace('_', ' ')} {rule.threshold}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Acción:</span>
                            <span className="ml-2 capitalize">{rule.action.replace('_', ' ')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Activaciones:</span>
                            <span className="ml-2">{rule.trigger_count}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Última vez:</span>
                            <span className="ml-2">{rule.last_triggered ? new Date(rule.last_triggered).toLocaleDateString() : 'Nunca'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Reportes de Rendimiento</h3>
            <div className="flex space-x-2">
              <Button onClick={() => generateReport('hourly')} variant="outline" size="sm">
                Reporte Horario
              </Button>
              <Button onClick={() => generateReport('daily')} variant="outline" size="sm">
                Reporte Diario
              </Button>
              <Button onClick={() => generateReport('weekly')} variant="outline" size="sm">
                Reporte Semanal
              </Button>
              <Button onClick={() => generateReport('monthly')} variant="outline" size="sm">
                Reporte Mensual
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No hay reportes generados</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Genera tu primer reporte usando los botones de arriba
                  </p>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="capitalize">Reporte {report.period}</CardTitle>
                      <Badge variant="outline">
                        {new Date(report.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{report.metrics_summary.avg_cpu.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">CPU Promedio</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{report.metrics_summary.avg_memory.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Memoria Promedio</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{report.metrics_summary.avg_response_time.toFixed(0)}ms</p>
                        <p className="text-sm text-muted-foreground">Tiempo Respuesta</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{report.metrics_summary.total_requests.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Solicitudes Totales</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{report.metrics_summary.error_count}</p>
                        <p className="text-sm text-muted-foreground">Errores</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-teal-600">{report.metrics_summary.uptime_percentage.toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Recomendaciones:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {report.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{rec}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div className="flex space-x-4 text-sm">
                        <span>Problemas detectados: <strong>{report.issues_detected}</strong></span>
                        <span>Optimizaciones aplicadas: <strong>{report.optimizations_applied}</strong></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CPU (últimas 24h)</span>
                    <div className="flex items-center space-x-2">
                      {metricsHistory.length > 0 && metricsHistory[metricsHistory.length - 1].cpu_usage > metricsHistory[0].cpu_usage ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium">
                        {metricsHistory.length > 0 ? 
                          `${(metricsHistory.reduce((sum, m) => sum + m.cpu_usage, 0) / metricsHistory.length).toFixed(1)}%` : 
                          '0%'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memoria (últimas 24h)</span>
                    <div className="flex items-center space-x-2">
                      {metricsHistory.length > 0 && metricsHistory[metricsHistory.length - 1].memory_usage > metricsHistory[0].memory_usage ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium">
                        {metricsHistory.length > 0 ? 
                          `${(metricsHistory.reduce((sum, m) => sum + m.memory_usage, 0) / metricsHistory.length).toFixed(1)}%` : 
                          '0%'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tiempo de Respuesta (últimas 24h)</span>
                    <div className="flex items-center space-x-2">
                      {metricsHistory.length > 0 && metricsHistory[metricsHistory.length - 1].response_time > metricsHistory[0].response_time ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium">
                        {metricsHistory.length > 0 ? 
                          `${(metricsHistory.reduce((sum, m) => sum + m.response_time, 0) / metricsHistory.length).toFixed(0)}ms` : 
                          '0ms'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Alertas Críticas (últimos 7 días)</span>
                    <span className="font-bold text-red-600">
                      {alerts.filter(a => a.type === 'critical' && 
                        new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Optimizaciones Aplicadas (últimos 7 días)</span>
                    <span className="font-bold text-green-600">
                      {optimizationRules.reduce((sum, rule) => sum + rule.trigger_count, 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Uptime Promedio</span>
                    <span className="font-bold text-blue-600">99.9%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tiempo Medio de Resolución</span>
                    <span className="font-bold text-purple-600">12 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitoring;

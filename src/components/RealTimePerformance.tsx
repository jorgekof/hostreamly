import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Zap,
  Clock,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Gauge,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
} from 'lucide-react';
import {
  usePerformanceMonitoring,
  PerformanceMetrics,
  performanceUtils,
} from '@/services/performanceMonitoring';

interface MetricCardProps {
  title: string;
  value: number | undefined;
  unit: string;
  threshold: number;
  icon: React.ReactNode;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  threshold,
  icon,
  description,
}) => {
  const getStatus = () => {
    if (value === undefined) return 'unknown';
    if (value <= threshold * 0.7) return 'excellent';
    if (value <= threshold) return 'good';
    if (value <= threshold * 1.5) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = () => {
    const status = getStatus();
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = () => {
    const status = getStatus();
    switch (status) {
      case 'excellent': return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
      case 'good': return <Badge className="bg-blue-100 text-blue-800">Bueno</Badge>;
      case 'needs-improvement': return <Badge className="bg-yellow-100 text-yellow-800">Mejorable</Badge>;
      case 'poor': return <Badge className="bg-red-100 text-red-800">Pobre</Badge>;
      default: return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div className={`text-2xl font-bold ${getStatusColor()}`}>
            {value !== undefined ? `${value.toFixed(0)}${unit}` : 'N/A'}
          </div>
          {getStatusBadge()}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {value !== undefined && (
          <Progress
            value={Math.min((value / (threshold * 1.5)) * 100, 100)}
            className="mt-2"
          />
        )}
      </CardContent>
    </Card>
  );
};

interface PerformanceScoreProps {
  score: number;
  grade: string;
}

const PerformanceScore: React.FC<PerformanceScoreProps> = ({ score, grade }) => {
  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeColor = () => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Puntuación de Rendimiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className={`text-4xl font-bold ${getScoreColor()}`}>
            {score}
          </div>
          <Badge className={getGradeColor()}>
            Grado {grade}
          </Badge>
        </div>
        <Progress value={score} className="mb-2" />
        <p className="text-sm text-muted-foreground">
          Basado en Core Web Vitals y métricas de rendimiento
        </p>
      </CardContent>
    </Card>
  );
};

interface ResourceTimingProps {
  resources: Array<{
    name: string;
    duration: number;
    size?: number;
    type: string;
  }>;
}

const ResourceTiming: React.FC<ResourceTimingProps> = ({ resources }) => {
  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, typeof resources>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'script': return <Cpu className="w-4 h-4" />;
      case 'stylesheet': return <Eye className="w-4 h-4" />;
      case 'image': return <Monitor className="w-4 h-4" />;
      case 'fetch': return <Wifi className="w-4 h-4" />;
      default: return <HardDrive className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Timing de Recursos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedResources).map(([type, typeResources]) => {
            const avgDuration = typeResources.reduce((sum, r) => sum + r.duration, 0) / typeResources.length;
            const totalSize = typeResources.reduce((sum, r) => sum + (r.size || 0), 0);
            
            return (
              <div key={type} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {getTypeIcon(type)}
                  <div>
                    <p className="font-medium capitalize">{type}</p>
                    <p className="text-sm text-muted-foreground">
                      {typeResources.length} recursos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{avgDuration.toFixed(0)}ms</p>
                  {totalSize > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {(totalSize / 1024).toFixed(1)}KB
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const RealTimePerformance: React.FC = () => {
  const { metrics, report, measureOperation, addCustomMetric, sendMetrics } = usePerformanceMonitoring();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    // Obtener información de memoria si está disponible
    const memory = performanceUtils.getMemoryInfo();
    setMemoryInfo(memory);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Medir el tiempo de actualización
    await measureOperation('dashboard-refresh', async () => {
      // Simular actualización de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
    
    setIsRefreshing(false);
  };

  const handleSendMetrics = async () => {
    try {
      await sendMetrics();
      // Aquí podrías mostrar un toast de éxito
    } catch (error) {
      console.error('Error sending metrics:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rendimiento en Tiempo Real</h2>
          <p className="text-muted-foreground">
            Monitoreo de Core Web Vitals y métricas de rendimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleSendMetrics}>
            <Activity className="w-4 h-4 mr-2" />
            Enviar Métricas
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PerformanceScore score={report.score} grade={report.grade} />
          
          {/* Recommendations */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.recommendations.length > 0 ? (
                <div className="space-y-2">
                  {report.recommendations.map((recommendation, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>¡Excelente! No hay recomendaciones de mejora.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="core-vitals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="core-vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="navigation">Navegación</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="core-vitals">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Largest Contentful Paint"
              value={metrics.lcp}
              unit="ms"
              threshold={2500}
              icon={<Eye className="w-4 h-4 text-muted-foreground" />}
              description="Tiempo hasta que se renderiza el elemento más grande"
            />
            <MetricCard
              title="First Input Delay"
              value={metrics.fid}
              unit="ms"
              threshold={100}
              icon={<Zap className="w-4 h-4 text-muted-foreground" />}
              description="Tiempo de respuesta a la primera interacción"
            />
            <MetricCard
              title="Cumulative Layout Shift"
              value={metrics.cls}
              unit=""
              threshold={0.1}
              icon={<Activity className="w-4 h-4 text-muted-foreground" />}
              description="Estabilidad visual de la página"
            />
            <MetricCard
              title="First Contentful Paint"
              value={metrics.fcp}
              unit="ms"
              threshold={1800}
              icon={<Monitor className="w-4 h-4 text-muted-foreground" />}
              description="Tiempo hasta el primer contenido visible"
            />
            <MetricCard
              title="Time to First Byte"
              value={metrics.ttfb}
              unit="ms"
              threshold={800}
              icon={<Wifi className="w-4 h-4 text-muted-foreground" />}
              description="Tiempo de respuesta del servidor"
            />
          </div>
        </TabsContent>

        <TabsContent value="navigation">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="DOM Content Loaded"
              value={metrics.domContentLoaded}
              unit="ms"
              threshold={3000}
              icon={<Clock className="w-4 h-4 text-muted-foreground" />}
              description="Tiempo hasta que el DOM está listo"
            />
            <MetricCard
              title="Load Complete"
              value={metrics.loadComplete}
              unit="ms"
              threshold={5000}
              icon={<CheckCircle className="w-4 h-4 text-muted-foreground" />}
              description="Tiempo total de carga de la página"
            />
          </div>
        </TabsContent>

        <TabsContent value="resources">
          {metrics.resourceLoadTimes && metrics.resourceLoadTimes.length > 0 ? (
            <ResourceTiming resources={metrics.resourceLoadTimes} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No hay datos de recursos disponibles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {memoryInfo && (
              <>
                <MetricCard
                  title="Memoria Usada"
                  value={memoryInfo.usedJSHeapSize / 1024 / 1024}
                  unit="MB"
                  threshold={100}
                  icon={<HardDrive className="w-4 h-4 text-muted-foreground" />}
                  description="Memoria JavaScript utilizada"
                />
                <MetricCard
                  title="Memoria Total"
                  value={memoryInfo.totalJSHeapSize / 1024 / 1024}
                  unit="MB"
                  threshold={200}
                  icon={<Cpu className="w-4 h-4 text-muted-foreground" />}
                  description="Memoria JavaScript total asignada"
                />
              </>
            )}
            
            {metrics.deviceMemory && (
              <MetricCard
                title="Memoria del Dispositivo"
                value={metrics.deviceMemory}
                unit="GB"
                threshold={8}
                icon={<Monitor className="w-4 h-4 text-muted-foreground" />}
                description="Memoria RAM del dispositivo"
              />
            )}
            
            {metrics.hardwareConcurrency && (
              <MetricCard
                title="Núcleos de CPU"
                value={metrics.hardwareConcurrency}
                unit=""
                threshold={4}
                icon={<Cpu className="w-4 h-4 text-muted-foreground" />}
                description="Número de núcleos lógicos"
              />
            )}
          </div>
          
          {/* Custom Metrics */}
          {metrics.customMetrics && Object.keys(metrics.customMetrics).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Métricas Personalizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(metrics.customMetrics).map(([name, value]) => (
                    <div key={name} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{name}</p>
                      <p className="text-2xl font-bold">{value.toFixed(2)}ms</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimePerformance;

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Play, 
  Clock, 
  Globe, 
  Smartphone, 
  Monitor, 
  Download, 
  Eye, 
  Heart, 
  Share2, 
  DollarSign, 
  Server, 
  Wifi, 
  MapPin, 
  Calendar,
  FileVideo,
  Activity,
  Zap,
  Target,
  PieChart,
  LineChart,
  BarChart,
  RefreshCw,
  Filter,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api, { apiClient } from '@/lib/api';
import { DateRange } from 'react-day-picker';
import { addDays, format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalWatchTime: number;
    uniqueViewers: number;
    averageViewDuration: number;
    totalVideos: number;
    totalStorage: number;
    bandwidth: number;
    revenue: number;
    conversionRate: number;
    retentionRate: number;
  };
  trends: {
    viewsTrend: number;
    watchTimeTrend: number;
    viewersTrend: number;
    revenueTrend: number;
  };
  topVideos: {
    id: string;
    title: string;
    views: number;
    watchTime: number;
    engagement: number;
    revenue: number;
    thumbnail?: string;
  }[];
  demographics: {
    countries: { country: string; views: number; percentage: number }[];
    devices: { device: string; views: number; percentage: number }[];
    browsers: { browser: string; views: number; percentage: number }[];
    ages: { range: string; views: number; percentage: number }[];
  };
  engagement: {
    averageViewDuration: number;
    dropOffPoints: { time: number; percentage: number }[];
    interactionRates: {
      likes: number;
      shares: number;
      comments: number;
      downloads: number;
    };
  };
  performance: {
    loadTimes: { region: string; avgTime: number }[];
    qualityDistribution: { quality: string; percentage: number }[];
    bufferingEvents: number;
    errorRate: number;
  };
  revenue: {
    totalRevenue: number;
    subscriptions: number;
    payPerView: number;
    advertising: number;
    monthlyRecurring: number;
    churnRate: number;
  };
  realTime: {
    currentViewers: number;
    liveStreams: number;
    concurrentStreams: number;
    peakViewers: number;
    activeRegions: { region: string; viewers: number }[];
  };
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

const PRESET_RANGES = {
  today: {
    from: new Date(),
    to: new Date()
  },
  yesterday: {
    from: subDays(new Date(), 1),
    to: subDays(new Date(), 1)
  },
  last7days: {
    from: subDays(new Date(), 7),
    to: new Date()
  },
  last30days: {
    from: subDays(new Date(), 30),
    to: new Date()
  },
  thisMonth: {
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  },
  lastMonth: {
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
  }
};

export const AdvancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(PRESET_RANGES.last7days);
  const [selectedMetric, setSelectedMetric] = useState('views');
  const [selectedDimension, setSelectedDimension] = useState('time');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
    
    // Auto-refresh every 5 minutes if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadAnalytics, 5 * 60 * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dateRange, autoRefresh]);

  const loadAnalytics = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      const response = await api.post('/analytics/advanced', {
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        metric: selectedMetric,
        dimension: selectedDimension
      });
      
      const data = response.data;
      
      setAnalyticsData(data.analytics);
      setChartData(data.chartData);
    } catch (error: unknown) {
      toast({
        title: "Error al cargar analytics",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const exportReport = async () => {
    try {
      const response = await api.post('/analytics/export', {
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
        format: 'pdf'
      });
      
      const data = response.data;
      const error = null;

      if (error) throw error;
      
      // Download the report
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.click();
      
      toast({
        title: "Reporte exportado",
        description: "El reporte de analytics ha sido generado y descargado",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al exportar reporte",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Cargando Analytics</h3>
          <p className="text-muted-foreground">Obteniendo datos analíticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold">Analytics Avanzados</h2>
            <p className="text-muted-foreground">Métricas detalladas y reportes de rendimiento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalViews)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analyticsData.trends.viewsTrend)}
                  <span className={`text-sm ${getTrendColor(analyticsData.trends.viewsTrend)}`}>
                    {Math.abs(analyticsData.trends.viewsTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Watch Time</p>
                <p className="text-2xl font-bold">{formatDuration(analyticsData.overview.totalWatchTime)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analyticsData.trends.watchTimeTrend)}
                  <span className={`text-sm ${getTrendColor(analyticsData.trends.watchTimeTrend)}`}>
                    {Math.abs(analyticsData.trends.watchTimeTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Viewers</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.uniqueViewers)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analyticsData.trends.viewersTrend)}
                  <span className={`text-sm ${getTrendColor(analyticsData.trends.viewersTrend)}`}>
                    {Math.abs(analyticsData.trends.viewersTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${formatNumber(analyticsData.overview.revenue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analyticsData.trends.revenueTrend)}
                  <span className={`text-sm ${getTrendColor(analyticsData.trends.revenueTrend)}`}>
                    {Math.abs(analyticsData.trends.revenueTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Estadísticas en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{analyticsData.realTime.currentViewers}</div>
              <div className="text-sm text-muted-foreground">Espectadores Actuales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{analyticsData.realTime.liveStreams}</div>
              <div className="text-sm text-muted-foreground">Streams en Vivo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{analyticsData.realTime.concurrentStreams}</div>
              <div className="text-sm text-muted-foreground">Streams Concurrentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{analyticsData.realTime.peakViewers}</div>
              <div className="text-sm text-muted-foreground">Pico de Espectadores</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="audience">Audiencia</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tiempos de Carga por Región</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance.loadTimes.map((region, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{region.region}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${Math.min((region.avgTime / 5000) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{region.avgTime}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Calidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance.qualityDistribution.map((quality, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{quality.quality}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${quality.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{quality.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Eventos de Buffering</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.performance.bufferingEvents)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tasa de Error</p>
                    <p className="text-2xl font-bold">{analyticsData.performance.errorRate.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bandwidth</p>
                    <p className="text-2xl font-bold">{formatBytes(analyticsData.overview.bandwidth)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topVideos.map((video, index) => (
                  <div key={video.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                    {video.thumbnail && (
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{video.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatNumber(video.views)} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(video.watchTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {video.engagement.toFixed(1)}% engagement
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${formatNumber(video.revenue)}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Países Top</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.demographics.countries.slice(0, 10).map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>{country.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${country.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{country.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.demographics.devices.map((device, index) => {
                    const getDeviceIcon = (deviceName: string) => {
                      if (deviceName.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4" />;
                      if (deviceName.toLowerCase().includes('desktop')) return <Monitor className="w-4 h-4" />;
                      return <Monitor className="w-4 h-4" />;
                    };
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.device)}
                          <span>{device.device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${device.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{device.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{formatNumber(analyticsData.engagement.interactionRates.likes)}</div>
                    <div className="text-sm text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{formatNumber(analyticsData.engagement.interactionRates.shares)}</div>
                    <div className="text-sm text-muted-foreground">Shares</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{formatNumber(analyticsData.engagement.interactionRates.comments)}</div>
                    <div className="text-sm text-muted-foreground">Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">{formatNumber(analyticsData.engagement.interactionRates.downloads)}</div>
                    <div className="text-sm text-muted-foreground">Downloads</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Duración Promedio de Visualización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-500 mb-2">
                    {formatDuration(analyticsData.engagement.averageViewDuration)}
                  </div>
                  <p className="text-muted-foreground">Tiempo promedio que los usuarios ven el contenido</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Suscripciones</p>
                    <p className="text-2xl font-bold">${formatNumber(analyticsData.revenue.subscriptions)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pay-per-View</p>
                    <p className="text-2xl font-bold">${formatNumber(analyticsData.revenue.payPerView)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Publicidad</p>
                    <p className="text-2xl font-bold">${formatNumber(analyticsData.revenue.advertising)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Recurrente Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500 mb-2">
                    ${formatNumber(analyticsData.revenue.monthlyRecurring)}
                  </div>
                  <p className="text-muted-foreground">MRR (Monthly Recurring Revenue)</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tasa de Churn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-500 mb-2">
                    {analyticsData.revenue.churnRate.toFixed(1)}%
                  </div>
                  <p className="text-muted-foreground">Porcentaje de usuarios que cancelan mensualmente</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

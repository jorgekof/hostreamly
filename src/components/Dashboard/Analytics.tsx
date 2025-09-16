import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Play, Pause, Users, Eye, Clock, TrendingUp, Download, 
  AlertTriangle, Settings, RefreshCw, Calendar, Filter,
  BarChart3, PieChart as PieChartIcon, Activity, Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
interface DashboardData {
  topVideos?: Array<{
    id: string;
    title: string;
    views: number;
    duration: string;
    thumbnail?: string;
    engagement?: number;
  }>;
  totalViews?: number;
  totalVideos?: number;
  totalRevenue?: number;
  viewsGrowth?: number;
  activeViewers?: number;
  avgWatchTime?: number;
  revenueGrowth?: number;
  viewsOverTime?: Array<{
    date: string;
    views: number;
  }>;
}

interface RealtimeMetrics {
  currentViewers?: number;
  activeStreams?: number;
  bandwidth?: number;
  activeViewers?: number;
  recentPlays?: number;
  bandwidthUsage?: number;
  activityFeed?: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    event?: string;
    location?: string;
  }>;
}

interface VideoAnalytics {
  watchTime?: number;
  engagement?: number;
  dropOffPoints?: number[];
}

interface AudienceInsights {
  demographics?: Array<{
    name: string;
    value: number;
  }>;
  geographic?: Array<{
    country: string;
    viewers: number;
  }>;
  uniqueViewers?: number;
  newViewers?: number;
  returningViewers?: number;
}

interface PerformanceMetrics {
  loadTime?: number;
  bufferRatio?: number;
  errorRate?: number;
  avgLatency?: number;
  cacheHitRate?: number;
  uptime?: number;
  avgBitrate?: number;
  bufferRate?: number;
  totalBandwidth?: number;
  bandwidthUsagePercent?: number;
}

interface RevenueAnalytics {
  totalRevenue?: number;
  monthlyGrowth?: number;
  subscriptions?: number;
  revenueGrowth?: number;
}

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  title?: string;
  description?: string;
  severity?: 'high' | 'medium' | 'low';
  created_at?: string;
}

interface AnalyticsData {
  dashboardData?: DashboardData;
  realtimeMetrics?: RealtimeMetrics;
  videoAnalytics?: VideoAnalytics;
  audienceInsights?: AudienceInsights;
  performanceMetrics?: PerformanceMetrics;
  revenueAnalytics?: RevenueAnalytics;
  alerts?: AlertItem[];
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  filters: Record<string, unknown>;
  schedule: string;
  format: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [newReport, setNewReport] = useState<{
    name: string;
    description: string;
    metrics: string[];
    filters: Record<string, unknown>;
    schedule: string;
    format: string;
  }>({
    name: '',
    description: '',
    metrics: [],
    filters: {},
    schedule: 'daily',
    format: 'json'
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
      // Set up auto-refresh for realtime metrics
      const interval = setInterval(() => {
        if (activeTab === 'realtime') {
          loadRealtimeMetrics();
        }
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user, activeTab, refreshInterval]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboardData(),
        loadRealtimeMetrics(),
        loadVideoAnalytics(),
        loadAudienceInsights(),
        loadPerformanceMetrics(),
        loadRevenueAnalytics(),
        loadAlerts(),
        loadCustomReports()
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const callAnalyticsAPI = async (action: string, data: Record<string, unknown> = {}) => {
    if (!user) throw new Error('No user found');

    const response = await fetch('/functions/v1/analytics-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token || 'mock-token'}`
      },
      body: JSON.stringify({ action, ...data, timeRange })
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.statusText}`);
    }

    return response.json();
  };

  const loadDashboardData = async () => {
    try {
      const result = await callAnalyticsAPI('getDashboardData');
      setAnalyticsData(prev => ({ ...prev, dashboardData: result.data }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadRealtimeMetrics = async () => {
    try {
      const result = await callAnalyticsAPI('getRealtimeMetrics');
      setAnalyticsData(prev => ({ ...prev, realtimeMetrics: result.data }));
    } catch (error) {
      console.error('Error loading realtime metrics:', error);
    }
  };

  const loadVideoAnalytics = async () => {
    try {
      const result = await callAnalyticsAPI('getVideoAnalytics', { videoId: selectedVideo });
      setAnalyticsData(prev => ({ ...prev, videoAnalytics: result.data }));
    } catch (error) {
      console.error('Error loading video analytics:', error);
    }
  };

  const loadAudienceInsights = async () => {
    try {
      const result = await callAnalyticsAPI('getAudienceInsights');
      setAnalyticsData(prev => ({ ...prev, audienceInsights: result.data }));
    } catch (error) {
      console.error('Error loading audience insights:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const result = await callAnalyticsAPI('getPerformanceMetrics');
      setAnalyticsData(prev => ({ ...prev, performanceMetrics: result.data }));
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const loadRevenueAnalytics = async () => {
    try {
      const result = await callAnalyticsAPI('getRevenueAnalytics');
      setAnalyticsData(prev => ({ ...prev, revenueAnalytics: result.data }));
    } catch (error) {
      console.error('Error loading revenue analytics:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const result = await callAnalyticsAPI('getAnalyticsAlerts');
      setAnalyticsData(prev => ({ ...prev, alerts: result.data }));
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadCustomReports = async () => {
    try {
      if (!user?.id) return;
      
  
        const data = null, error = null;

      if (error) throw error;
      setCustomReports((data as CustomReport[]) || []);
    } catch (error) {
      console.error('Error loading custom reports:', error);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const result = await callAnalyticsAPI('exportAnalyticsData', { format });
      
      const blob = new Blob([result.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const createCustomReport = async () => {
    try {
      if (!user?.id) return;
      

        const data = null, error = null;
        
      if (error) throw error;
      
      setNewReport({
        name: '',
        description: '',
        metrics: [],
        filters: {},
        schedule: 'daily',
        format: 'json'
      });
      
      await loadCustomReports();
    } catch (error) {
      console.error('Error creating custom report:', error);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.dashboardData?.totalViews?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              +{analyticsData.dashboardData?.viewsGrowth || 0}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.realtimeMetrics?.activeViewers || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently watching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analyticsData.dashboardData?.avgWatchTime / 60) || 0}m
            </div>
            <p className="text-xs text-muted-foreground">
              Per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.revenueAnalytics?.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              +{analyticsData.revenueAnalytics?.revenueGrowth || 0}% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.dashboardData?.viewsOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.dashboardData?.topVideos?.slice(0, 5).map((video: { id: string; title: string; views: number; engagement?: number }, index: number) => (
                <div key={video.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{video.title}</p>
                      <p className="text-sm text-muted-foreground">{video.views} views</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{Math.round(video.engagement || 0)}%</p>
                    <p className="text-sm text-muted-foreground">engagement</p>
                  </div>
                </div>
              )) || []}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CDN Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Avg Latency</span>
                <span className="font-medium">{analyticsData.performanceMetrics?.avgLatency || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cache Hit Rate</span>
                <span className="font-medium">{analyticsData.performanceMetrics?.cacheHitRate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Uptime</span>
                <span className="font-medium text-green-600">{analyticsData.performanceMetrics?.uptime || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Video Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Avg Bitrate</span>
                <span className="font-medium">{analyticsData.performanceMetrics?.avgBitrate || 0} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Buffer Rate</span>
                <span className="font-medium">{analyticsData.performanceMetrics?.bufferRate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Error Rate</span>
                <span className="font-medium text-red-600">{analyticsData.performanceMetrics?.errorRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bandwidth Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {analyticsData.performanceMetrics?.totalBandwidth || 0} TB
              </div>
              <div className="text-sm text-muted-foreground">
                This period
              </div>
              <Progress 
                value={analyticsData.performanceMetrics?.bandwidthUsagePercent || 0} 
                className="mt-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRealtimeTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Real-time Metrics</h3>
        <Button onClick={loadRealtimeMetrics} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Viewers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analyticsData.realtimeMetrics?.activeViewers || 0}
            </div>
            <div className="flex items-center mt-2">
              <Activity className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-muted-foreground">Live now</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Plays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analyticsData.realtimeMetrics?.recentPlays || 0}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Last 5 minutes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bandwidth Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {analyticsData.realtimeMetrics?.bandwidthUsage || 0} GB
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Current hour
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analyticsData.realtimeMetrics?.activityFeed?.map((activity: { id: string; type: string; message: string; timestamp: string; event?: string; location?: string }, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-muted/50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
                <Badge variant="outline">{activity.location}</Badge>
              </div>
            )) || []}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAudienceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Audience Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.audienceInsights?.demographics || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(analyticsData.audienceInsights?.demographics || []).map((entry: { name: string; value: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.audienceInsights?.geographic?.map((location: { country: string; viewers: number }, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>{location.country}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={Math.min((location.viewers / 1000) * 100, 100)} className="w-20" />
                    <span className="text-sm font-medium">{location.viewers}</span>
                  </div>
                </div>
              )) || []}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.audienceInsights?.uniqueViewers || 0}
              </div>
              <p className="text-sm text-muted-foreground">Unique Viewers</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.audienceInsights?.newViewers || 0}
              </div>
              <p className="text-sm text-muted-foreground">New Viewers</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analyticsData.audienceInsights?.returningViewers || 0}
              </div>
              <p className="text-sm text-muted-foreground">Returning Viewers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Custom Reports</h3>
        <div className="flex space-x-2">
          <Button onClick={() => exportData('json')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={() => exportData('csv')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Custom Report</CardTitle>
          <CardDescription>
            Generate custom analytics reports with specific metrics and filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                value={newReport.name}
                onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter report name"
              />
            </div>
            <div>
              <Label htmlFor="reportSchedule">Schedule</Label>
              <Select value={newReport.schedule} onValueChange={(value) => setNewReport(prev => ({ ...prev, schedule: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="reportDescription">Description</Label>
            <Input
              id="reportDescription"
              value={newReport.description}
              onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter report description"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label>Format</Label>
              <Select value={newReport.format} onValueChange={(value) => setNewReport(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createCustomReport} className="mt-6">
              Create Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h4 className="font-medium">{report.name}</h4>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{report.schedule}</Badge>
                    <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Alerts</CardTitle>
          <CardDescription>
            Monitor important metrics and get notified when thresholds are exceeded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.alerts?.map((alert: AlertItem) => (
              <Alert key={alert.id} className={alert.severity === 'high' ? 'border-red-500' : (alert.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500')}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{alert.title || alert.message}</p>
                      <p className="text-sm text-muted-foreground">{alert.description || alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at || alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                      {alert.severity || 'info'}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )) || []}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your video content
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="realtime">
          {renderRealtimeTab()}
        </TabsContent>

        <TabsContent value="audience">
          {renderAudienceTab()}
        </TabsContent>

        <TabsContent value="reports">
          {renderReportsTab()}
        </TabsContent>

        <TabsContent value="alerts">
          {renderAlertsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Video, 
  BarChart3, 
  Settings, 
  Users, 
  CreditCard,
  Play,
  Eye,
  Clock,
  HardDrive,
  TrendingUp,
  Calendar,
  Crown,
  Folder,
  Activity
} from 'lucide-react';
import { ThemeToggleSimple } from '@/components/ui/theme-toggle';
import VideoUpload from './VideoUpload';
import VideoLibrary from './VideoLibrary';
import VideoChapters from './Dashboard/VideoChapters';
import MyVideos from './Dashboard/MyVideos';
import UserFolderManager from './UserFolderManager';
import AdminDashboard from './AdminDashboard';
import UserConfiguration from './Dashboard/UserConfiguration';
import { VideoResponse } from '../services/videoCDN';
import { useToast } from '@/hooks/use-toast';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { DashboardSkeleton } from '@/components/skeletons/SkeletonLoaders';
import RealTimePerformance from './RealTimePerformance';

interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  totalStorage: string;
  totalDuration: string;
  monthlyViews: number;
  monthlyUploads: number;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 12,
    totalViews: 45678,
    totalStorage: '2.4 GB',
    totalDuration: '4h 32m',
    monthlyViews: 12345,
    monthlyUploads: 8
  });
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
    };
    loadDashboardData();
  }, []);

  const handleVideoUploadComplete = (video: VideoResponse) => {
    setStats(prev => ({
      ...prev,
      totalVideos: prev.totalVideos + 1,
      monthlyUploads: prev.monthlyUploads + 1
    }));
    
    toast({
      title: "¡Video subido exitosamente!",
      description: `"${video.title}" está listo para reproducir`
    });
    
    setActiveTab('library');
  };

  const handleVideoUploadError = (error: string) => {
    toast({
      title: "Error en la subida",
      description: error,
      variant: "destructive"
    });
  };

  const handleVideoSelect = (video: VideoResponse) => {

  };

  const handleVideoEdit = (video: VideoResponse) => {

  };

  if (isLoading || adminLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Gestiona tus videos y analiza el rendimiento</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggleSimple />
            <Button 
              onClick={() => setShowConfiguration(true)}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Subir</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Biblioteca</span>
            </TabsTrigger>
            <TabsTrigger value="my-videos" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Videos</span>
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              <span className="hidden sm:inline">Carpetas</span>
            </TabsTrigger>
            <TabsTrigger value="chapters" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Capítulos</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Rendimiento</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVideos}</div>
                  <p className="text-xs text-muted-foreground">+{stats.monthlyUploads} este mes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Visualizaciones</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+{stats.monthlyViews.toLocaleString()} este mes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStorage}</div>
                  <p className="text-xs text-muted-foreground">de 10 GB disponibles</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Duración Total</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDuration}</div>
                  <p className="text-xs text-muted-foreground">contenido subido</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <VideoUpload 
              onUploadComplete={handleVideoUploadComplete}
              onUploadError={handleVideoUploadError}
            />
          </TabsContent>

          <TabsContent value="library">
            <VideoLibrary 
              onVideoSelect={handleVideoSelect}
              onVideoEdit={handleVideoEdit}
            />
          </TabsContent>

          <TabsContent value="my-videos">
            <MyVideos />
          </TabsContent>

          <TabsContent value="folders">
            <UserFolderManager />
          </TabsContent>

          <TabsContent value="chapters">
            <VideoChapters />
          </TabsContent>

          <TabsContent value="performance">
            <RealTimePerformance />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>

        {showConfiguration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <UserConfiguration onClose={() => setShowConfiguration(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

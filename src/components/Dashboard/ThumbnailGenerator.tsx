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
import { Slider } from '@/components/ui/slider';
import { 
  Image, 
  Play, 
  Download, 
  Settings, 
  Wand2, 
  Clock, 
  Grid3X3, 
  Palette, 
  Crop, 
  Zap, 
  Eye, 
  RefreshCw, 
  Upload, 
  Trash2, 
  Edit, 
  Copy, 
  Check, 
  X, 
  FileImage, 
  Sparkles, 
  Target, 
  Layers, 
  Monitor, 
  Smartphone, 
  Tablet,
  Globe,
  Filter,
  Search,
  Calendar,
  BarChart3,
  TrendingUp,
  Heart,
  Share2,
  MousePointer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient as api } from '@/lib/api';

interface ThumbnailConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  quality: number;
  format: 'jpg' | 'png' | 'webp';
  enabled: boolean;
  description: string;
}

interface ThumbnailTemplate {
  id: string;
  name: string;
  description: string;
  overlayText: boolean;
  overlayPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  overlayStyle: {
    fontSize: number;
    fontColor: string;
    backgroundColor: string;
    opacity: number;
    padding: number;
    borderRadius: number;
  };
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    sepia: number;
  };
  border: {
    enabled: boolean;
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  watermark: {
    enabled: boolean;
    text: string;
    position: string;
    opacity: number;
  };
}

interface VideoThumbnail {
  id: string;
  videoId: string;
  videoTitle: string;
  timestamp: number;
  thumbnails: {
    configId: string;
    url: string;
    width: number;
    height: number;
    size: number;
    format: string;
  }[];
  status: 'generating' | 'completed' | 'failed';
  createdAt: string;
  analytics: {
    views: number;
    clicks: number;
    ctr: number;
  };
}

interface GenerationJob {
  id: string;
  videoId: string;
  videoTitle: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  configIds: string[];
  timestamps: number[];
  createdAt: string;
  completedAt?: string;
  error?: string;
}

const DEFAULT_CONFIGS: ThumbnailConfig[] = [
  {
    id: 'youtube-hd',
    name: 'YouTube HD',
    width: 1280,
    height: 720,
    quality: 90,
    format: 'jpg',
    enabled: true,
    description: 'Optimizado para YouTube y plataformas de video'
  },
  {
    id: 'social-media',
    name: 'Redes Sociales',
    width: 1200,
    height: 630,
    quality: 85,
    format: 'jpg',
    enabled: true,
    description: 'Perfecto para Facebook, Twitter, LinkedIn'
  },
  {
    id: 'mobile-optimized',
    name: 'Mobile',
    width: 640,
    height: 360,
    quality: 80,
    format: 'webp',
    enabled: true,
    description: 'Optimizado para dispositivos móviles'
  },
  {
    id: 'high-quality',
    name: 'Alta Calidad',
    width: 1920,
    height: 1080,
    quality: 95,
    format: 'png',
    enabled: false,
    description: 'Máxima calidad para impresión y marketing'
  }
];

const DEFAULT_TEMPLATE: ThumbnailTemplate = {
  id: 'default',
  name: 'Plantilla por Defecto',
  description: 'Plantilla básica sin modificaciones',
  overlayText: false,
  overlayPosition: 'bottom-right',
  overlayStyle: {
    fontSize: 24,
    fontColor: '#ffffff',
    backgroundColor: '#000000',
    opacity: 0.8,
    padding: 12,
    borderRadius: 8
  },
  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sepia: 0
  },
  border: {
    enabled: false,
    width: 2,
    color: '#000000',
    style: 'solid'
  },
  watermark: {
    enabled: false,
    text: '',
    position: 'bottom-right',
    opacity: 0.5
  }
};

export const ThumbnailGenerator = () => {
  const [configs, setConfigs] = useState<ThumbnailConfig[]>(DEFAULT_CONFIGS);
  const [templates, setTemplates] = useState<ThumbnailTemplate[]>([DEFAULT_TEMPLATE]);
  const [thumbnails, setThumbnails] = useState<VideoThumbnail[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>(['youtube-hd', 'social-media']);
  const [timestamps, setTimestamps] = useState<number[]>([10, 30, 60]);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ThumbnailConfig | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ThumbnailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // Auto-refresh jobs every 10 seconds
    const interval = setInterval(loadJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadConfigs(),
        loadTemplates(),
        loadThumbnails(),
        loadJobs()
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

  const loadConfigs = async () => {
    const response = await api.get('/thumbnails/configs');
    const data = response.data;
    const error = null;

    if (error && error.code !== 'PGRST116') throw error;
    if (data && data.length > 0) {
      setConfigs(data);
    }
  };

  const loadTemplates = async () => {
    const response = await api.get('/thumbnails/templates');
    const data = response.data;
    const error = null;

    if (error && error.code !== 'PGRST116') throw error;
    if (data && data.length > 0) {
      setTemplates(data);
    }
  };

  const loadThumbnails = async () => {
    const response = await api.get('/thumbnails');
    const data = response.data;
    const error = null;

    if (error && error.code !== 'PGRST116') throw error;
    
    const processedThumbnails = data?.map(item => ({
      id: item.id,
      videoId: item.video_id,
      videoTitle: item.videos.title,
      timestamp: item.timestamp,
      thumbnails: item.thumbnails || [],
      status: item.status,
      createdAt: item.created_at,
      analytics: item.analytics || { views: 0, clicks: 0, ctr: 0 }
    })) || [];
    
    setThumbnails(processedThumbnails);
  };

  const loadJobs = async () => {
    const response = await api.get('/thumbnails/jobs');
    const data = response.data;
    const error = null;

    if (error && error.code !== 'PGRST116') throw error;
    
    const processedJobs = data?.map(item => ({
      id: item.id,
      videoId: item.video_id,
      videoTitle: item.videos.title,
      status: item.status,
      progress: item.progress || 0,
      configIds: item.config_ids || [],
      timestamps: item.timestamps || [],
      createdAt: item.created_at,
      completedAt: item.completed_at,
      error: item.error
    })) || [];
    
    setJobs(processedJobs);
  };

  const generateThumbnails = async () => {
    if (!selectedVideo || selectedConfigs.length === 0 || timestamps.length === 0) {
      toast({
        title: "Configuración incompleta",
        description: "Selecciona un video, configuraciones y timestamps",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.post('/thumbnails/generate', {
        videoId: selectedVideo,
        configIds: selectedConfigs,
        templateId: selectedTemplate,
        timestamps,
        autoGenerate
      });
      
      const data = response.data;
      const error = null;

      if (error) throw error;

      toast({
        title: "Generación iniciada",
        description: "Las miniaturas se están generando en segundo plano",
      });

      await loadJobs();
    } catch (error: unknown) {
      toast({
        title: "Error al generar miniaturas",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const saveConfig = async () => {
    if (!editingConfig) return;

    try {
      await api.post('/thumbnails/configs', editingConfig);
      console.log('Config saved successfully');

      await loadConfigs();
      setShowConfigDialog(false);
      setEditingConfig(null);
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de miniatura ha sido guardada",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al guardar configuración",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      await api.post('/thumbnails/templates', editingTemplate);
      console.log('Template saved successfully');

      await loadTemplates();
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      
      toast({
        title: "Plantilla guardada",
        description: "La plantilla de miniatura ha sido guardada",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al guardar plantilla",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const deleteConfig = async (configId: string) => {
    try {
      await api.delete(`/thumbnails/configs/${configId}`);
      const error = null;

      if (error) throw error;

      await loadConfigs();
      
      toast({
        title: "Configuración eliminada",
        description: "La configuración ha sido eliminada",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al eliminar configuración",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const toggleConfigEnabled = async (configId: string, enabled: boolean) => {
    try {
      await api.patch(`/thumbnails/configs/${configId}`, { enabled });
      const error = null;

      if (error) throw error;

      await loadConfigs();
    } catch (error: unknown) {
      toast({
        title: "Error al actualizar configuración",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      await api.post('/thumbnails/retry', { jobId });
      const error = null;

      if (error) throw error;

      await loadJobs();
      
      toast({
        title: "Trabajo reiniciado",
        description: "La generación de miniaturas ha sido reiniciada",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al reiniciar trabajo",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': case 'generating': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4" />;
      case 'processing': case 'generating': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'failed': return <X className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredThumbnails = thumbnails.filter(thumbnail => {
    const matchesSearch = thumbnail.videoTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || thumbnail.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold">Generador de Miniaturas</h2>
            <p className="text-muted-foreground">Genera miniaturas automáticamente en múltiples resoluciones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={generateThumbnails}>
            <Wand2 className="w-4 h-4 mr-2" />
            Generar Miniaturas
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">Generador</TabsTrigger>
          <TabsTrigger value="gallery">Galería</TabsTrigger>
          <TabsTrigger value="configs">Configuraciones</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>

        {/* Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Generación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Video</Label>
                  <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un video" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video1">Video de Ejemplo 1</SelectItem>
                      <SelectItem value="video2">Video de Ejemplo 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Plantilla</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Configuraciones</Label>
                  <div className="space-y-2">
                    {configs.filter(c => c.enabled).map(config => (
                      <div key={config.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={config.id}
                          checked={selectedConfigs.includes(config.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedConfigs([...selectedConfigs, config.id]);
                            } else {
                              setSelectedConfigs(selectedConfigs.filter(id => id !== config.id));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={config.id} className="text-sm">
                          {config.name} ({config.width}x{config.height})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Timestamps (segundos)</Label>
                  <div className="flex gap-2">
                    {timestamps.map((timestamp, index) => (
                      <Input
                        key={index}
                        type="number"
                        value={timestamp}
                        onChange={(e) => {
                          const newTimestamps = [...timestamps];
                          newTimestamps[index] = parseInt(e.target.value) || 0;
                          setTimestamps(newTimestamps);
                        }}
                        className="w-20"
                      />
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTimestamps([...timestamps, 0])}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoGenerate}
                    onCheckedChange={setAutoGenerate}
                  />
                  <Label>Generación automática para nuevos videos</Label>
                </div>
              </CardContent>
            </Card>
            
            {/* Active Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Trabajos Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.filter(job => job.status !== 'completed').map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />
                        <div>
                          <div className="font-medium">{job.videoTitle}</div>
                          <div className="text-sm text-muted-foreground">
                            {job.configIds.length} configuraciones • {job.timestamps.length} timestamps
                          </div>
                          {job.status === 'processing' && (
                            <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all" 
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        {job.status === 'failed' && (
                          <Button size="sm" variant="outline" onClick={() => retryJob(job.id)}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {jobs.filter(job => job.status !== 'completed').length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay trabajos activos</h3>
                      <p className="text-muted-foreground">Los trabajos de generación aparecerán aquí</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Buscar por título de video..."
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
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="generating">Generando</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Thumbnails Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThumbnails.map(thumbnail => (
              <Card key={thumbnail.id}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{thumbnail.videoTitle}</h3>
                      <Badge variant={thumbnail.status === 'completed' ? 'default' : 'secondary'}>
                        {thumbnail.status}
                      </Badge>
                    </div>
                    
                    {thumbnail.thumbnails.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {thumbnail.thumbnails.slice(0, 4).map((thumb, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={thumb.url}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                              <div className="flex gap-1">
                                <Button size="sm" variant="secondary">
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="secondary">
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                              {thumb.width}x{thumb.height}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Timestamp: {thumbnail.timestamp}s</span>
                      <span>{thumbnail.thumbnails.length} formatos</span>
                    </div>
                    
                    {thumbnail.analytics && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-sm font-medium">{thumbnail.analytics.views}</div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{thumbnail.analytics.clicks}</div>
                          <div className="text-xs text-muted-foreground">Clicks</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{thumbnail.analytics.ctr.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">CTR</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredThumbnails.length === 0 && (
            <div className="text-center py-12">
              <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay miniaturas</h3>
              <p className="text-muted-foreground">Genera tu primera miniatura para verla aquí</p>
            </div>
          )}
        </TabsContent>

        {/* Configs Tab */}
        <TabsContent value="configs" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingConfig({
                    id: '',
                    name: '',
                    width: 1280,
                    height: 720,
                    quality: 90,
                    format: 'jpg',
                    enabled: true,
                    description: ''
                  });
                }}>
                  <Settings className="w-4 h-4 mr-2" />
                  Nueva Configuración
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configuración de Miniatura</DialogTitle>
                </DialogHeader>
                {editingConfig && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                          value={editingConfig.name}
                          onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Formato</Label>
                        <Select
                          value={editingConfig.format}
                          onValueChange={(value: 'jpg' | 'png' | 'webp') => 
                            setEditingConfig({ ...editingConfig, format: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jpg">JPG</SelectItem>
                            <SelectItem value="png">PNG</SelectItem>
                            <SelectItem value="webp">WebP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ancho</Label>
                        <Input
                          type="number"
                          value={editingConfig.width}
                          onChange={(e) => setEditingConfig({ ...editingConfig, width: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Alto</Label>
                        <Input
                          type="number"
                          value={editingConfig.height}
                          onChange={(e) => setEditingConfig({ ...editingConfig, height: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Calidad ({editingConfig.quality}%)</Label>
                      <Slider
                        value={[editingConfig.quality]}
                        onValueChange={([value]) => setEditingConfig({ ...editingConfig, quality: value })}
                        max={100}
                        min={1}
                        step={1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={editingConfig.description}
                        onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingConfig.enabled}
                        onCheckedChange={(enabled) => setEditingConfig({ ...editingConfig, enabled })}
                      />
                      <Label>Habilitado</Label>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={saveConfig}>
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {configs.map(config => (
              <Card key={config.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {config.format === 'jpg' && <FileImage className="w-5 h-5 text-blue-500" />}
                        {config.format === 'png' && <FileImage className="w-5 h-5 text-green-500" />}
                        {config.format === 'webp' && <FileImage className="w-5 h-5 text-purple-500" />}
                        <div>
                          <h3 className="font-semibold">{config.name}</h3>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{config.width}x{config.height}</span>
                        <span>{config.quality}% calidad</span>
                        <span className="uppercase">{config.format}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(enabled) => toggleConfigEnabled(config.id, enabled)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingConfig(config);
                          setShowConfigDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteConfig(config.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="text-center py-12">
            <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Plantillas de Miniatura</h3>
            <p className="text-muted-foreground">Funcionalidad de plantillas próximamente</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

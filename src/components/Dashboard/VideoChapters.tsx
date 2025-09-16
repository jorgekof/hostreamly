import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { 
  BookOpen, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Upload, 
  Download, 
  Clock, 
  Eye, 
  Settings, 
  Wand2, 
  RefreshCw, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Check, 
  X, 
  FileText, 
  Image, 
  Link, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Users, 
  MousePointer, 
  Zap, 
  Target, 
  Layers, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient as api } from '@/lib/api';
interface VideoChapter {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  order: number;
  thumbnailUrl?: string;
  enabled: boolean;
  metadata?: {
    tags?: string[];
    color?: string;
    icon?: string;
  };
  analytics?: {
    views: number;
    clicks: number;
    engagement: number;
    avgWatchTime: number;
    completionRate: number;
  };
}

interface ChapterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  chapters: {
    title: string;
    description?: string;
    estimatedDuration: number;
    order: number;
  }[];
  isPublic: boolean;
  createdBy: string;
}

interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnailUrl?: string;
  uploadedAt: string;
}

const DEFAULT_TEMPLATES: ChapterTemplate[] = [
  {
    id: 'template-1',
    name: 'Curso Educativo',
    description: 'Estructura básica para contenido educativo',
    category: 'education',
    chapters: [
      { title: 'Introducción', description: 'Presentación del tema', estimatedDuration: 120, order: 1 },
      { title: 'Desarrollo', description: 'Contenido principal', estimatedDuration: 600, order: 2 },
      { title: 'Conclusión', description: 'Resumen y cierre', estimatedDuration: 180, order: 3 }
    ],
    isPublic: true,
    createdBy: 'system'
  },
  {
    id: 'template-2',
    name: 'Tutorial Técnico',
    description: 'Para tutoriales paso a paso',
    category: 'tutorial',
    chapters: [
      { title: 'Requisitos', description: 'Preparación inicial', estimatedDuration: 180, order: 1 },
      { title: 'Configuración', description: 'Setup del entorno', estimatedDuration: 300, order: 2 },
      { title: 'Implementación', description: 'Desarrollo paso a paso', estimatedDuration: 900, order: 3 },
      { title: 'Pruebas', description: 'Verificación y testing', estimatedDuration: 240, order: 4 }
    ],
    isPublic: true,
    createdBy: 'system'
  },
  {
    id: 'template-3',
    name: 'Presentación Corporativa',
    description: 'Para presentaciones empresariales',
    category: 'business',
    chapters: [
      { title: 'Agenda', description: 'Puntos a tratar', estimatedDuration: 60, order: 1 },
      { title: 'Problema', description: 'Identificación del problema', estimatedDuration: 300, order: 2 },
      { title: 'Solución', description: 'Propuesta de solución', estimatedDuration: 480, order: 3 },
      { title: 'Beneficios', description: 'Ventajas y ROI', estimatedDuration: 240, order: 4 },
      { title: 'Próximos Pasos', description: 'Plan de acción', estimatedDuration: 180, order: 5 }
    ],
    isPublic: true,
    createdBy: 'system'
  }
];

export const VideoChapters = () => {
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [chapters, setChapters] = useState<VideoChapter[]>([]);
  const [templates, setTemplates] = useState<ChapterTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedVideoInfo, setSelectedVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [editingChapter, setEditingChapter] = useState<Partial<VideoChapter> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'duration'>('order');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<ChapterTemplate>>({
    name: '',
    description: '',
    category: 'education',
    isPublic: false,
    chapters: []
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedVideo]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadVideos(),
        loadChapters(),
        loadTemplates()
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar los datos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    // TODO: Replace with API call
    const data = null, error = null;

    if (!error && data) {
      const processedVideos = data.map(video => ({
        id: video.id,
        title: video.title,
        duration: video.duration || 0,
        thumbnailUrl: video.thumbnail_url,
        uploadedAt: video.created_at
      }));
      setVideos(processedVideos);
    }
  };

  const loadChapters = async () => {
    if (!selectedVideo) return;

    // TODO: Replace with API call
    const data = null, error = null;

    if (!error && data) {
      const processedChapters = data.map((chapter: any) => ({
        id: chapter.id,
        videoId: chapter.video_id,
        title: chapter.title,
        description: chapter.description,
        startTime: chapter.start_time,
        endTime: chapter.end_time,
        order: chapter.order_index,
        thumbnailUrl: chapter.thumbnail_url,
        enabled: chapter.enabled,
        metadata: chapter.metadata || {},
        analytics: chapter.analytics || {
          views: 0,
          clicks: 0,
          engagement: 0,
          avgWatchTime: 0,
          completionRate: 0
        }
      }));
      setChapters(processedChapters);
    }
  };

  const loadTemplates = async () => {
    // TODO: Replace with API call
        const data = null, error = null;

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading templates:', error);
      return;
    }

    if (data && data.length > 0) {
      const processedTemplates = data.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        chapters: template.chapters,
        category: template.category || 'general',
        isPublic: template.is_public || false,
        createdBy: template.created_by || 'user'
      }));
      setTemplates([...DEFAULT_TEMPLATES, ...processedTemplates]);
    }
  };

  const saveChapter = async () => {
    if (!editingChapter || !selectedVideo) return;

    try {
      const chapterData = {
        video_id: selectedVideo,
        title: editingChapter.title || '',
        description: editingChapter.description,
        start_time: editingChapter.startTime || 0,
        end_time: editingChapter.endTime || 0,
        order_index: editingChapter.order || 1,
        thumbnail_url: editingChapter.thumbnailUrl,
        enabled: editingChapter.enabled ?? true,
        metadata: editingChapter.metadata || {}
      };

      if (editingChapter.id) {
        // TODO: Replace with API call
      } else {
        // TODO: Replace with API call
      }

      setEditingChapter(null);
      loadChapters();
      toast({
        title: 'Éxito',
        description: 'Capítulo guardado correctamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar el capítulo',
        variant: 'destructive'
      });
    }
  };

  const deleteChapter = async (chapterId: string) => {
    try {
      // TODO: Replace with API call

      setChapters(chapters.filter(c => c.id !== chapterId));
      toast({
        title: 'Éxito',
        description: 'Capítulo eliminado correctamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar el capítulo',
        variant: 'destructive'
      });
    }
  };

  const createTemplateFromChapters = async () => {
    if (!selectedVideo || chapters.length === 0) {
      toast({
        title: 'Error',
        description: 'Selecciona un video con capítulos para crear una plantilla',
        variant: 'destructive'
      });
      return;
    }

    const templateChapters = chapters.map(chapter => ({
      title: chapter.title,
      description: chapter.description,
      estimatedDuration: chapter.endTime - chapter.startTime,
      order: chapter.order
    }));

    setNewTemplate({
      name: `Plantilla de ${selectedVideoInfo?.title || 'Video'}`,
      description: 'Plantilla creada desde capítulos existentes',
      category: 'custom',
      isPublic: false,
      chapters: templateChapters
    });
  };

  const saveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.description || !newTemplate.chapters?.length) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    try {
      // TODO: Replace with API call
      console.log('Saving template:', newTemplate);
      
      // Simulate successful save
      const data = {
        id: Date.now().toString(),
        ...newTemplate
      };
      
      if (data) {
        setTemplates([...templates, data]);
        setNewTemplate({
          name: '',
          description: '',
          category: 'education',
          isPublic: false,
          chapters: []
        });
        toast({
          title: 'Éxito',
          description: 'Plantilla creada correctamente'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al crear la plantilla',
        variant: 'destructive'
      });
    }
  };

  const applyTemplate = async () => {
    if (!selectedTemplate || !selectedVideo) return;

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    try {
      // Clear existing chapters
      // TODO: Replace with API call

      const totalEstimatedDuration = template.chapters.reduce(
        (acc, chapter) => acc + chapter.estimatedDuration, 
        0
      );
      const videoDuration = selectedVideoInfo?.duration || totalEstimatedDuration;
      const scaleFactor = videoDuration / totalEstimatedDuration;

      const newChapters: Partial<VideoChapter>[] = template.chapters.map((templateChapter, index) => {
        const startTime = index === 0 ? 0 : 
          template.chapters.slice(0, index).reduce((acc, ch) => acc + (ch.estimatedDuration * scaleFactor), 0);
        const duration = templateChapter.estimatedDuration * scaleFactor;

        return {
          videoId: selectedVideo,
          title: templateChapter.title,
          description: templateChapter.description,
          startTime: Math.round(startTime),
          endTime: Math.round(startTime + duration),
          order: templateChapter.order,
          enabled: true,
          metadata: {
            tags: [],
            color: '#3b82f6',
            icon: 'play'
          }
        };
      });

      for (const chapter of newChapters) {
        // TODO: Replace with API call
      }

      loadChapters();
      toast({
        title: 'Éxito',
        description: 'Plantilla aplicada correctamente'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al aplicar la plantilla',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  };

  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (chapter.description && chapter.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterEnabled === null || chapter.enabled === filterEnabled;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Capítulos de Video</h2>
          <p className="text-muted-foreground">Gestiona los capítulos y marcadores de tiempo de tus videos</p>
        </div>
      </div>

      <Tabs defaultValue="chapters" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chapters">Capítulos</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Chapters Tab */}
        <TabsContent value="chapters" className="space-y-6">
          {/* Video Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Seleccionar Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="video-select">Video</Label>
                  <Select value={selectedVideo} onValueChange={(value) => {
                    setSelectedVideo(value);
                    const videoInfo = videos.find(v => v.id === value);
                    setSelectedVideoInfo(videoInfo || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un video" />
                    </SelectTrigger>
                    <SelectContent>
                      {videos.map(video => (
                        <SelectItem key={video.id} value={video.id}>
                          {video.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedVideoInfo && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  {selectedVideoInfo.thumbnailUrl && (
                    <img 
                      src={selectedVideoInfo.thumbnailUrl} 
                      alt={selectedVideoInfo.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{selectedVideoInfo.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Duración: {formatTime(selectedVideoInfo.duration)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedVideo && (
            <>
              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar capítulos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterEnabled?.toString() || 'all'} onValueChange={(value) => {
                    setFilterEnabled(value === 'all' ? null : value === 'true');
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Activos</SelectItem>
                      <SelectItem value="false">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  >
                    {viewMode === 'list' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  </Button>
                  <Button onClick={() => {
                    setEditingChapter({
                      videoId: selectedVideo,
                      title: '',
                      description: '',
                      startTime: 0,
                      endTime: 60,
                      order: chapters.length + 1,
                      enabled: true,
                      metadata: { tags: [], color: '#3b82f6', icon: 'play' },
                      analytics: {
                        views: 0,
                        clicks: 0,
                        engagement: 0,
                        avgWatchTime: 0,
                        completionRate: 0
                      }
                    });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Capítulo
                  </Button>
                </div>
              </div>

              {/* Chapter Editor Dialog */}
              {editingChapter && (
                <Dialog open={!!editingChapter} onOpenChange={() => setEditingChapter(null)}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingChapter.id ? 'Editar Capítulo' : 'Nuevo Capítulo'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="chapter-title">Título</Label>
                          <Input
                            id="chapter-title"
                            value={editingChapter.title || ''}
                            onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                            placeholder="Título del capítulo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="chapter-order">Orden</Label>
                          <Input
                            id="chapter-order"
                            type="number"
                            value={editingChapter.order || 1}
                            onChange={(e) => setEditingChapter({ ...editingChapter, order: parseInt(e.target.value) || 1 })}
                            min="1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="chapter-description">Descripción</Label>
                        <Textarea
                          id="chapter-description"
                          value={editingChapter.description || ''}
                          onChange={(e) => setEditingChapter({ ...editingChapter, description: e.target.value })}
                          placeholder="Descripción del capítulo"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-time">Tiempo de Inicio</Label>
                          <Input
                            id="start-time"
                            value={formatTime(editingChapter.startTime || 0)}
                            onChange={(e) => setEditingChapter({ ...editingChapter, startTime: parseTime(e.target.value) })}
                            placeholder="0:00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-time">Tiempo de Fin</Label>
                          <Input
                            id="end-time"
                            value={formatTime(editingChapter.endTime || 0)}
                            onChange={(e) => setEditingChapter({ ...editingChapter, endTime: parseTime(e.target.value) })}
                            placeholder="1:00"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="thumbnail-url">URL de Miniatura</Label>
                        <Input
                          id="thumbnail-url"
                          value={editingChapter.thumbnailUrl || ''}
                          onChange={(e) => setEditingChapter({ ...editingChapter, thumbnailUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="tags">Tags (separadas por comas)</Label>
                        <Input
                          id="tags"
                          value={editingChapter.metadata?.tags?.join(', ') || ''}
                          onChange={(e) => setEditingChapter({ 
                            ...editingChapter, 
                            metadata: { 
                              ...editingChapter.metadata, 
                              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                            }
                          })}
                          placeholder="intro, conceptos, demo"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingChapter.enabled}
                          onCheckedChange={(enabled) => setEditingChapter({ ...editingChapter, enabled })}
                        />
                        <Label>Capítulo activo</Label>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setEditingChapter(null)}>
                          Cancelar
                        </Button>
                        <Button onClick={saveChapter}>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Chapters List/Grid */}
              {viewMode === 'list' ? (
                <div className="space-y-2">
                  {filteredChapters.map((chapter, index) => (
                    <Card key={chapter.id} className={`transition-all ${!chapter.enabled ? 'opacity-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{chapter.order}</Badge>
                              {chapter.thumbnailUrl && (
                                <img 
                                  src={chapter.thumbnailUrl} 
                                  alt={chapter.title}
                                  className="w-16 h-10 object-cover rounded"
                                />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium">{chapter.title}</h3>
                              {chapter.description && (
                                <p className="text-sm text-muted-foreground">{chapter.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span>{formatTime(chapter.startTime)} - {formatTime(chapter.endTime)}</span>
                                <span>Duración: {formatTime(chapter.endTime - chapter.startTime)}</span>
                                {chapter.metadata?.tags && chapter.metadata.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {chapter.metadata.tags.slice(0, 3).map(tag => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingChapter(chapter);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteChapter(chapter.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredChapters.map(chapter => (
                    <Card key={chapter.id} className={`transition-all ${!chapter.enabled ? 'opacity-50' : ''}`}>
                      <CardContent className="p-4">
                        {chapter.thumbnailUrl && (
                          <img 
                            src={chapter.thumbnailUrl} 
                            alt={chapter.title}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{chapter.order}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(chapter.endTime - chapter.startTime)}
                            </span>
                          </div>
                          <h3 className="font-medium">{chapter.title}</h3>
                          {chapter.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{chapter.description}</p>
                          )}
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(chapter.startTime)} - {formatTime(chapter.endTime)}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingChapter(chapter);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteChapter(chapter.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredChapters.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay capítulos</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterEnabled !== null 
                      ? 'No se encontraron capítulos con los filtros aplicados'
                      : 'Crea tu primer capítulo para organizar el contenido del video'
                    }
                  </p>
                  {!searchTerm && filterEnabled === null && (
                    <Button onClick={() => {
                      setEditingChapter({
                        videoId: selectedVideo,
                        title: '',
                        description: '',
                        startTime: 0,
                        endTime: 60,
                        order: 1,
                        enabled: true,
                        metadata: { tags: [], color: '#3b82f6', icon: 'play' }
                      });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Capítulo
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Plantillas de Capítulos</h3>
              <p className="text-sm text-muted-foreground">Crea y gestiona plantillas reutilizables</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Plantilla
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Plantilla</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Nombre</Label>
                      <Input
                        id="template-name"
                        value={newTemplate.name || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="Nombre de la plantilla"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-category">Categoría</Label>
                      <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="education">Educación</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                          <SelectItem value="business">Negocios</SelectItem>
                          <SelectItem value="entertainment">Entretenimiento</SelectItem>
                          <SelectItem value="custom">Personalizada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="template-description">Descripción</Label>
                    <Textarea
                      id="template-description"
                      value={newTemplate.description || ''}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Descripción de la plantilla"
                    />
                  </div>
                  
                  <div>
                    <Label>Capítulos de la Plantilla</Label>
                    {newTemplate.chapters && newTemplate.chapters.length > 0 ? (
                      newTemplate.chapters.map((chapter, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded mt-2">
                          <div>
                            <span className="font-medium">{chapter.title}</span>
                            <span className="text-sm text-muted-foreground ml-2">({formatTime(chapter.estimatedDuration)})</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedChapters = newTemplate.chapters?.filter((_, i) => i !== index) || [];
                              setNewTemplate({ ...newTemplate, chapters: updatedChapters });
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">No hay capítulos en esta plantilla</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newTemplate.isPublic || false}
                      onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, isPublic: checked })}
                    />
                    <Label>Hacer plantilla pública</Label>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => {
                      createTemplateFromChapters();
                    }}>
                      Crear desde Capítulos
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        setNewTemplate({
                          name: '',
                          description: '',
                          category: 'education',
                          isPublic: false,
                          chapters: []
                        });
                      }}>
                        Cancelar
                      </Button>
                      <Button onClick={saveTemplate}>
                        Crear Plantilla
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant={template.isPublic ? 'default' : 'secondary'}>
                      {template.isPublic ? 'Pública' : 'Privada'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Capítulos ({template.chapters.length}):</div>
                    {template.chapters.map((chapter, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex justify-between">
                        <span>{chapter.title}</span>
                        <span>{formatTime(chapter.estimatedDuration)}</span>
                      </div>
                    ))}
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        if (selectedVideo) {
                          applyTemplate();
                        }
                      }}
                      disabled={!selectedVideo}
                    >
                      Aplicar Plantilla
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Analytics de Capítulos</h3>
            <p className="text-muted-foreground">Métricas detalladas próximamente</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoChapters;

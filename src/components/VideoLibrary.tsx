import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Play, 
  Edit, 
  Trash2, 
  Download, 
  Share2,
  Eye,
  Calendar,
  Clock,
  FileVideo,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import videoCDNService, { VideoResponse } from '../services/videoCDN';
import VideoPlayer from './VideoPlayer';
import { searchSchema, createFormValidator, handleValidationError } from '@/schemas/validation';
import { z } from 'zod';
import { VideoLibrarySkeleton } from '@/components/skeletons/SkeletonLoaders';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface VideoLibraryProps {
  onVideoSelect?: (video: VideoResponse) => void;
  onVideoEdit?: (video: VideoResponse) => void;
}

interface VideoStats {
  views: number;
  duration: string;
  size: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
}

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'title' | 'views' | 'duration';
type FilterBy = 'all' | 'ready' | 'processing' | 'error';

const VideoLibrary: React.FC<VideoLibraryProps> = ({ onVideoSelect, onVideoEdit }) => {
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [searchErrors, setSearchErrors] = useState<Record<string, string>>({});
  const [selectedVideo, setSelectedVideo] = useState<VideoResponse | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<VideoResponse | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const { toast } = useToast();

  // Simular datos de estadísticas (en una implementación real, esto vendría de la API)
  const getVideoStats = (video: VideoResponse): VideoStats => {
    return {
      views: Math.floor(Math.random() * 10000),
      duration: `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      size: `${(Math.random() * 500 + 50).toFixed(1)} MB`,
      uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: ['ready', 'processing', 'error'][Math.floor(Math.random() * 3)] as 'ready' | 'processing' | 'error'
    };
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Validar parámetros de búsqueda
  const validateSearchParams = (params: any) => {
    const validator = createFormValidator(searchSchema);
    const result = validator(params);
    
    if (!result.success) {
      setSearchErrors(result.errors);
      return null;
    }
    
    setSearchErrors({});
    return result.data;
  };

  useEffect(() => {
    filterAndSortVideos();
  }, [videos, searchTerm, sortBy, filterBy]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const videoListResponse = await videoCDNService.getVideoList();
      setVideos(videoListResponse.items);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los videos",
        variant: "destructive"
      });
      // Datos de ejemplo para demostración
      setVideos([
        {
          videoId: 'demo-1',
          title: 'Video de Demostración 1',
          thumbnailFileName: 'thumb1.jpg',
          status: 4,
          dateUploaded: new Date().toISOString(),
          views: 0,
          isPublic: true,
          length: 120,
          framerate: 30,
          rotation: 0,
          width: 1920,
          height: 1080,
          availableResolutions: '1080p,720p,480p',
          thumbnailCount: 10,
          encodeProgress: 100,
          storageSize: 52428800,
          captions: [],
          hasMP4Fallback: true,
          collectionId: '',
          thumbnailTime: 5000,
          averageWatchTime: 0,
          totalWatchTime: 0,
          category: 'general',
          chapters: [],
          moments: [],
          metaTags: []
        },
        {
          videoId: 'demo-2',
          title: 'Tutorial de Configuración',
          thumbnailFileName: 'thumb2.jpg',
          status: 4,
          dateUploaded: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          views: 0,
          isPublic: false,
          length: 300,
          framerate: 30,
          rotation: 0,
          width: 1920,
          height: 1080,
          availableResolutions: '1080p,720p,480p',
          thumbnailCount: 15,
          encodeProgress: 100,
          storageSize: 104857600,
          captions: [],
          hasMP4Fallback: true,
          collectionId: '',
          thumbnailTime: 10000,
          averageWatchTime: 0,
          totalWatchTime: 0,
          category: 'tutorial',
          chapters: [],
          moments: [],
          metaTags: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortVideos = () => {
    // Validar parámetros de búsqueda
    const searchParams = {
      searchTerm: searchTerm || undefined,
      sortBy,
      filterBy,
      page: 1,
      limit: 50
    };

    const validatedParams = validateSearchParams(searchParams);
    if (!validatedParams) {
      setFilteredVideos(videos); // Retornar videos sin filtrar si hay errores de validación
      return;
    }

    let filtered = videos.filter(video => {
      const matchesSearch = validatedParams.searchTerm ? 
        video.title.toLowerCase().includes(validatedParams.searchTerm.toLowerCase()) : true;
      const stats = getVideoStats(video);
      const matchesFilter = validatedParams.filterBy === 'all' || stats.status === validatedParams.filterBy;
      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      switch (validatedParams.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date':
          return new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime();
        case 'views':
          return getVideoStats(b).views - getVideoStats(a).views;
        case 'duration':
          return b.length - a.length;
        default:
          return 0;
      }
    });

    setFilteredVideos(filtered);
  };

  const handleVideoPlay = (video: VideoResponse) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
    onVideoSelect?.(video);
  };

  const handleVideoEdit = (video: VideoResponse) => {
    onVideoEdit?.(video);
  };

  const handleVideoDelete = async (video: VideoResponse) => {
    try {
      await videoCDNService.deleteVideo(video.videoId);
      setVideos(prev => prev.filter(v => v.videoId !== video.videoId));
      toast({
        title: "Video eliminado",
        description: "El video ha sido eliminado exitosamente"
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el video",
        variant: "destructive"
      });
    } finally {
      setVideoToDelete(null);
    }
  };

  const handleVideoShare = (video: VideoResponse) => {
    const shareUrl = `${window.location.origin}/video/${video.videoId}`;
    
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: shareUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "Enlace copiado",
          description: "El enlace del video ha sido copiado al portapapeles"
        });
      }).catch(() => {
        toast({
          title: "Error",
          description: "No se pudo copiar el enlace",
          variant: "destructive"
        });
      });
    }
  };

  const handleVideoDownload = (video: VideoResponse) => {
    const downloadUrl = `https://${import.meta.env.VITE_BUNNY_CDN_HOSTNAME}/${video.videoId}/original.mp4`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${video.title}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: 'processing' | 'ready' | 'error') => {
    const variants = {
      processing: { variant: 'secondary' as const, text: 'Procesando' },
      ready: { variant: 'default' as const, text: 'Listo' },
      error: { variant: 'destructive' as const, text: 'Error' }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (loading) {
    return <VideoLibrarySkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca de Videos</h2>
          <p className="text-muted-foreground">
            {filteredVideos.length} de {videos.length} videos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${searchErrors.searchTerm ? 'border-destructive' : ''}`}
                />
                {searchErrors.searchTerm && (
                  <p className="text-sm text-destructive mt-1">{searchErrors.searchTerm}</p>
                )}
              </div>
            </div>
            
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha</SelectItem>
                <SelectItem value="title">Título</SelectItem>
                <SelectItem value="views">Visualizaciones</SelectItem>
                <SelectItem value="duration">Duración</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterBy} onValueChange={(value: FilterBy) => setFilterBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ready">Listos</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="error">Con errores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Video Grid/List */}
      {filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileVideo className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay videos</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm ? 'No se encontraron videos que coincidan con tu búsqueda' : 'Aún no has subido ningún video'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {filteredVideos.map((video) => {
            const stats = getVideoStats(video);
            const thumbnailUrl = `https://${import.meta.env.VITE_BUNNY_CDN_HOSTNAME}/${video.videoId}/thumbnail.jpg`;
            
            if (viewMode === 'grid') {
              return (
                <Card key={video.videoId} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-muted">
                    <OptimizedImage
                          src={thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder-video.jpg"
                          sizes="128px"
                          priority={false}
                        />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <Button
                        size="sm"
                        onClick={() => handleVideoPlay(video)}
                        className="bg-white/90 text-black hover:bg-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Reproducir
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(stats.status)}
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white">
                        {formatDuration(video.length)}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate mb-2">{video.title}</h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {stats.views.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {stats.uploadDate}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(video.storageSize)}
                      </span>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleVideoPlay(video)}>
                            <Play className="w-4 h-4 mr-2" />
                            Reproducir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVideoEdit(video)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVideoShare(video)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVideoDownload(video)}>
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setVideoToDelete(video)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            } else {
              return (
                <Card key={video.videoId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-32 h-18 bg-muted rounded overflow-hidden flex-shrink-0">
                        <OptimizedImage
                          src={thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder-video.jpg"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          priority={false}
                        />
                        <div className="absolute bottom-1 right-1">
                          <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                            {formatDuration(video.length)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate mb-1">{video.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {stats.views.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {stats.uploadDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(video.length)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(stats.status)}
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(video.storageSize)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVideoPlay(video)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleVideoEdit(video)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleVideoShare(video)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Compartir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleVideoDownload(video)}>
                              <Download className="w-4 h-4 mr-2" />
                              Descargar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setVideoToDelete(video)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {isPlayerOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-white text-xl font-semibold">{selectedVideo.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlayerOpen(false)}
                className="text-white hover:bg-white/20"
              >
                ✕
              </Button>
            </div>
            <VideoPlayer
              videoId={selectedVideo.videoId}
              title={selectedVideo.title}
              autoplay={true}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!videoToDelete} onOpenChange={() => setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar video?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El video "{videoToDelete?.title}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => videoToDelete && handleVideoDelete(videoToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VideoLibrary;

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Play, 
  Eye, 
  Clock, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient as api } from '@/lib/api';
import BunnyStreamPlayer from '@/components/VideoPlayer/BunnyStreamPlayer';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Video {
  id: string;
  title: string;
  description?: string;
  bunny_video_id: string;
  bunny_library_id: string;
  bunny_collection_id?: string;
  embed_url?: string;
  play_url?: string;
  thumbnail_url?: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted';
  visibility: 'public' | 'unlisted' | 'private';
  duration?: number;
  file_size: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface MyVideosProps {
  expanded?: boolean;
}

export const MyVideos = ({ expanded = false }: MyVideosProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await api.videos.getMyVideos({
        page: currentPage,
        limit: 12,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      });

      if (response.data.success) {
        setVideos(response.data.data.videos);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [currentPage, statusFilter, searchTerm]);

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este video?')) {
      return;
    }

    try {
      await api.videos.delete(videoId);
      toast({
        title: "Video eliminado",
        description: "El video ha sido eliminado exitosamente",
      });
      loadVideos();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el video",
        variant: "destructive",
      });
    }
  };

  const handleShareVideo = async (video: Video) => {
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          url: shareUrl
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Enlace copiado",
          description: "El enlace del video ha sido copiado al portapapeles",
        });
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Enlace copiado",
        description: "El enlace del video ha sido copiado al portapapeles",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'unlisted': return 'bg-yellow-100 text-yellow-800';
      case 'private': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedVideo && selectedVideo.embed_url) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setSelectedVideo(null)}
          >
            ← Volver a mis videos
          </Button>
          <div className="flex gap-2">
            <Badge className={getStatusColor(selectedVideo.status)}>
              {selectedVideo.status}
            </Badge>
            <Badge className={getVisibilityColor(selectedVideo.visibility)}>
              {selectedVideo.visibility}
            </Badge>
          </div>
        </div>

        <BunnyStreamPlayer
          embedUrl={selectedVideo.embed_url}
          playUrl={selectedVideo.play_url}
          title={selectedVideo.title}
          videoId={selectedVideo.bunny_video_id}
          libraryId={selectedVideo.bunny_library_id}
          responsive={true}
          controls={true}
        />

        <Card>
          <CardHeader>
            <CardTitle>{selectedVideo.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Vistas:</span>
                <p>{selectedVideo.view_count.toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium">Duración:</span>
                <p>{formatDuration(selectedVideo.duration)}</p>
              </div>
              <div>
                <span className="font-medium">Tamaño:</span>
                <p>{formatFileSize(selectedVideo.file_size)}</p>
              </div>
              <div>
                <span className="font-medium">Subido:</span>
                <p>{formatDistanceToNow(new Date(selectedVideo.created_at), { 
                  addSuffix: true, 
                  locale: es 
                })}</p>
              </div>
            </div>
            {selectedVideo.description && (
              <div className="mt-4">
                <span className="font-medium">Descripción:</span>
                <p className="mt-1 text-gray-600">{selectedVideo.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Mis Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ready">Listos</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="uploading">Subiendo</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de videos */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No tienes videos aún
              </h3>
              <p className="text-gray-500">
                Sube tu primer video para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="group hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                        <Play className="w-12 h-12 text-blue-400" />
                      </div>
                    )}
                    
                    {/* Overlay con botón de reproducir */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <Button
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedVideo(video)}
                        disabled={video.status !== 'ready' || !video.embed_url}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </div>

                    {/* Badges de estado */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge className={getStatusColor(video.status)} variant="secondary">
                        {video.status}
                      </Badge>
                      <Badge className={getVisibilityColor(video.visibility)} variant="secondary">
                        {video.visibility}
                      </Badge>
                    </div>

                    {/* Menú de opciones */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedVideo(video)}>
                            <Play className="w-4 h-4 mr-2" />
                            Ver video
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareVideo(video)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartir
                          </DropdownMenuItem>
                          {video.play_url && (
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Descargar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{video.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(video.duration)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(video.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                      <span>{formatFileSize(video.file_size)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-3 text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyVideos;

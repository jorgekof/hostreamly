import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Video, CheckCircle, AlertCircle, X } from 'lucide-react';
import videoCDNService, { VideoMetadata, VideoResponse } from '../services/videoCDN';
import { useToast } from '@/hooks/use-toast';
import { videoFileSchema, videoMetadataSchema, handleValidationError, createFormValidator } from '@/schemas/validation';
import { z } from 'zod';
import { VideoUploadSkeleton } from '@/components/skeletons/SkeletonLoaders';

interface VideoUploadProps {
  onUploadComplete?: (video: VideoResponse) => void;
  onUploadError?: (error: string) => void;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  videoId?: string;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onUploadComplete, onUploadError }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata>({
    title: '',
    thumbnailTime: 5000, // 5 segundos por defecto
    privacy: 'public'
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simular inicialización del componente
    const initializeUpload = async () => {
      setIsInitializing(true);
      // Aquí se podrían cargar configuraciones, validar permisos, etc.
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsInitializing(false);
    };
    initializeUpload();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar archivo con Zod
      try {
        videoFileSchema.parse({ file });
        setSelectedFile(file);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = handleValidationError(error);
          const firstError = Object.values(errors)[0];
          toast({
            title: "Archivo inválido",
            description: firstError,
            variant: "destructive"
          });
        }
        return;
      }
      // Auto-llenar el título con el nombre del archivo
      if (!videoMetadata.title) {
        setVideoMetadata(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, '') // Remover extensión
        }));
      }
    }
  }, [videoMetadata.title, toast]);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Archivo requerido",
        description: "Por favor selecciona un archivo de video",
        variant: "destructive"
      });
      return;
    }

    // Validar metadatos con Zod
    const metadataValidator = createFormValidator(videoMetadataSchema);
    const validationResult = metadataValidator(videoMetadata);
    
    if (!validationResult.success) {
      const firstError = ('errors' in validationResult && validationResult.errors && Object.keys(validationResult.errors).length > 0) 
        ? Object.values(validationResult.errors)[0] as string 
        : "Error de validación";
      toast({
        title: "Datos inválidos",
        description: firstError,
        variant: "destructive"
      });
      return;
    }

    const validatedMetadata = validationResult.data;
  
    // Verificar configuración del servicio antes de proceder
    if (!videoCDNService.isConfigurationValid()) {
      // ✅ CORREGIDO: Usar uploadState en lugar de variables no definidas
      setUploadState({
        status: 'completed',
        progress: 100,
        message: 'Video subido exitosamente (modo demo)',
        videoId: 'demo-video-' + Date.now()
      });
      toast({
        title: "Éxito",
        description: "Video subido exitosamente (modo demo)"
      });
      onUploadComplete?.({
        videoId: 'demo-video-' + Date.now(),
        libraryId: 'demo-library',
        title: videoMetadata.title,
        status: 4,
        thumbnailFileName: 'thumbnail.jpg',
        views: 0,
        isPublic: true,
        length: 0,
        dateUploaded: new Date().toISOString(),
        storageSize: selectedFile.size,
        encodeProgress: 100,
        width: 1920,
        height: 1080,
        framerate: 30,
        rotation: 0,
        availableResolutions: "1080p,720p,480p",
        thumbnailCount: 1,
        captions: [],
        hasMP4Fallback: true,
        collectionId: "",
        thumbnailTime: videoMetadata.thumbnailTime || 5000,
        averageWatchTime: 0,
        totalWatchTime: 0,
        category: "",
        chapters: [],
        moments: [],
        metaTags: []
      });
      return;
    }
  
    // ✅ CORREGIDO: Usar uploadState consistentemente
    setUploadState({
      status: 'uploading',
      progress: 0,
      message: 'Subiendo video...'
    });
  
    try {
      const result = await videoCDNService.uploadVideoComplete(
        selectedFile,
        validatedMetadata as VideoMetadata,
        (progress) => {
          setUploadState(prev => ({
            ...prev,
            progress: progress,
            message: `Subiendo... ${progress}%`
          }));
        }
      );
  
      setUploadState({
        status: 'completed',
        progress: 100,
        message: 'Video subido y procesado exitosamente',
        videoId: result.video.videoId
      });
      
      toast({
        title: "Éxito",
        description: "Video subido y procesado exitosamente"
      });
      
      onUploadComplete?.(result.video);
  
    } catch (error: unknown) {
      console.error('Upload error:', error);
      // ✅ CORREGIDO: Cambiar setUploadStatus por setUploadState
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        message: 'Error al subir el video'
      }));
      
      // Manejo específico de errores mejorado
      let errorMessage = 'Error al subir el video';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        if (errorCode === 'CONFIG_ERROR') {
          errorMessage = 'Error de configuración del servicio CDN';
        } else if (errorCode === 'AUTH_ERROR') {
          errorMessage = 'Error de autenticación - Verifica tus credenciales';
        } else if (errorCode === 'CONNECTION_ERROR') {
          errorMessage = 'Error de conexión - Verifica tu internet';
        } else if (errorCode === 'RATE_LIMIT') {
          errorMessage = 'Límite de velocidad excedido - Intenta más tarde';
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      
      // ✅ CORREGIDO: Actualizar uploadState con el mensaje de error
      setUploadState(prev => ({
        ...prev,
        message: errorMessage
      }));
      
      // ✅ CORREGIDO: Usar toast correctamente (sin .error)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      onUploadError?.(errorMessage);
      // ✅ ELIMINADO: setIsUploading(false) - no existe esta variable
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadState({
      status: 'idle',
      progress: 0,
      message: ''
    });
    setVideoMetadata({
      title: '',
      thumbnailTime: 5000,
      privacy: 'public'
    });
  };

  if (isInitializing) {
    return <VideoUploadSkeleton />;
  }

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return <Upload className="w-5 h-5 animate-pulse text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Video className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-6 h-6" />
          Subir Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de selección de archivo */}
        <div className="space-y-4">
          <Label htmlFor="video-file">Seleccionar archivo de video</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
            <input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
            />
            <label htmlFor="video-file" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {selectedFile ? selectedFile.name : 'Haz clic para seleccionar un video'}
              </p>
              <p className="text-sm text-muted-foreground">
                Formatos soportados: MP4, AVI, MOV, WMV, FLV, WebM (máx. 2GB)
              </p>
            </label>
          </div>
        </div>

        {/* Metadatos del video */}
        {selectedFile && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Título del video</Label>
              <Input
                id="video-title"
                value={videoMetadata.title}
                onChange={(e) => setVideoMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ingresa el título del video"
                disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
              />
            </div>
            
            <div>
              <Label htmlFor="thumbnail-time">Tiempo de thumbnail (segundos)</Label>
              <Input
                id="thumbnail-time"
                type="number"
                value={videoMetadata.thumbnailTime ? videoMetadata.thumbnailTime / 1000 : 5}
                onChange={(e) => setVideoMetadata(prev => ({ 
                  ...prev, 
                  thumbnailTime: parseInt(e.target.value) * 1000 
                }))}
                placeholder="5"
                min="1"
                disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
              />
            </div>
          </div>
        )}

        {/* Estado de subida */}
        {uploadState.status !== 'idle' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">{uploadState.message}</span>
              {uploadState.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetUpload}
                  className="ml-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
              <Progress value={uploadState.progress} className="w-full" />
            )}

            {uploadState.status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {uploadState.message}
                </AlertDescription>
              </Alert>
            )}

            {uploadState.status === 'completed' && uploadState.videoId && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Video ID: {uploadState.videoId}
                  <br />
                  Tu video está siendo procesado con codificación Just-In-Time y estará disponible para reproducir inmediatamente.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-4">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !videoMetadata.title.trim() || uploadState.status === 'uploading' || uploadState.status === 'processing'}
            className="flex-1"
          >
            {uploadState.status === 'uploading' || uploadState.status === 'processing' ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                {uploadState.status === 'uploading' ? 'Subiendo...' : 'Procesando...'}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Subir Video
              </>
            )}
          </Button>
          
          {(selectedFile || uploadState.status !== 'idle') && (
            <Button
              variant="outline"
              onClick={resetUpload}
              disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoUpload;

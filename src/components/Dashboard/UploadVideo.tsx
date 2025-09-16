import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, FileVideo, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient as api } from '@/lib/api';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface UploadVideoProps {
  expanded?: boolean;
}

export const UploadVideo = ({ expanded = false }: UploadVideoProps) => {
  const [isOpen, setIsOpen] = useState(expanded);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { canUploadVideo } = usePlanLimits();

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setUploadProgress(0);
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv', 'video/m4v'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no soportado",
        description: "Solo se permiten archivos de video (MP4, AVI, MOV, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (50GB max)
    const maxSize = 50 * 1024 * 1024 * 1024; // 50GB in bytes
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no puede superar los 50GB",
        variant: "destructive",
      });
      return;
    }

    // Estimate duration (very rough estimate based on file size)
    const estimatedDurationMinutes = Math.max(1, Math.floor(file.size / (1024 * 1024 * 2))); // Rough estimate

    // Check plan limits
    const limitCheck = canUploadVideo(file.size, estimatedDurationMinutes);
    if (!limitCheck.allowed) {
      toast({
        title: "Límite excedido",
        description: limitCheck.reason,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('description', description);

      // Call Video CDN upload function with plan limits enforcement
      const response = await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      
      const data = response.data;
      const error = null;

      // Check if it's a payment required error (plan limits exceeded)
      if (error) {
        if (error.status === 402) {
          toast({
            title: "Límites del plan excedidos",
            description: error.details?.reason || 'Has excedido los límites de tu plan actual',
            variant: "destructive",
          });
          if (error.requiresPayment && error.details?.overage_cost) {
            toast({
              title: "Cobro adicional requerido",
              description: `Costo estimado: $${error.details.overage_cost.toFixed(2)} por ${error.details.overage_gb.toFixed(2)}GB adicionales`,
            });
          }
        } else {
          toast({
            title: "Error al subir video",
            description: error.message || "Ocurrió un error inesperado",
            variant: "destructive",
          });
        }
        throw error;
      }

      if (data.success) {
        toast({
          title: "¡Video subido exitosamente!",
          description: "Tu video está siendo procesado. Recibirás una notificación cuando esté listo.",
        });

        // Reset form
        resetForm();
        setIsOpen(false);

        // Simulate upload progress for UI feedback
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 10;
          });
        }, 200);

      } else {
        throw new Error(data.error || 'Upload failed');
      }

    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast({
        title: "Error al subir video",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (expanded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Subir Nuevo Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : selectedFile 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <FileVideo className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-green-700">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="mt-2"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cambiar archivo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragOver ? 'Suelta el archivo aquí' : 'Sube tu video'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Arrastra y suelta o{' '}
                    <button
                      className="text-primary hover:underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      selecciona un archivo
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos soportados: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tamaño máximo: 50GB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Subiendo video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Video Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título del video</Label>
              <Input
                id="title"
                type="text"
                placeholder="Ingresa el título de tu video"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe tu video..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                rows={3}
              />
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Video
                </>
              )}
            </Button>
            
            {!expanded && (
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={uploading}
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Button size="lg" onClick={() => setIsOpen(true)} className="hidden md:flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Subir Video
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Subir Nuevo Video</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-primary bg-primary/5' 
                      : selectedFile 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <FileVideo className="w-12 h-12 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="mt-2"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cambiar archivo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <Upload className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">
                          {isDragOver ? 'Suelta el archivo aquí' : 'Sube tu video'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Arrastra y suelta o{' '}
                          <button
                            className="text-primary hover:underline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            selecciona un archivo
                          </button>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Formatos soportados: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tamaño máximo: 50GB
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Subiendo video...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Video Details */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título del video</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Ingresa el título de tu video"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu video..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={uploading}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Upload Button */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || !title.trim() || uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Video
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

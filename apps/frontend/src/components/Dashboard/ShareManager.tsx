import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Globe,
  Code,
  QrCode,
  Link,
  Download,
  Eye,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  url: string;
}

export const ShareManager = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [shareSettings, setShareSettings] = useState({
    allowDownload: true,
    showControls: true,
    autoplay: false,
    loop: false,
    showTitle: true,
    showDescription: true,
    customDomain: '',
    password: '',
    expiryDate: ''
  });

  // Mock videos
  const videos: Video[] = [
    {
      id: '1',
      title: 'Tutorial: Configuración Inicial',
      thumbnail: '/placeholder.svg',
      duration: 180,
      url: 'https://example.com/video/1'
    },
    {
      id: '2',
      title: 'Demo del Producto - Versión 2.0',
      thumbnail: '/placeholder.svg',
      duration: 420,
      url: 'https://example.com/video/2'
    }
  ];

  const generateShareLink = (platform?: string) => {
    if (!selectedVideo) return '';
    
    const baseUrl = shareSettings.customDomain || 'https://tu-dominio.com';
    const videoUrl = `${baseUrl}/watch/${selectedVideo.id}`;
    
    const params = new URLSearchParams();
    if (!shareSettings.showControls) params.append('controls', '0');
    if (shareSettings.autoplay) params.append('autoplay', '1');
    if (shareSettings.loop) params.append('loop', '1');
    if (!shareSettings.showTitle) params.append('title', '0');
    if (shareSettings.password) params.append('token', 'protected');
    
    const finalUrl = params.toString() ? `${videoUrl}?${params.toString()}` : videoUrl;
    
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(finalUrl)}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(finalUrl)}&text=${encodeURIComponent(selectedVideo.title)}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(finalUrl)}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodeURIComponent(selectedVideo.title + ' ' + finalUrl)}`;
      default:
        return finalUrl;
    }
  };

  const generateEmbedCode = () => {
    if (!selectedVideo) return '';
    
    const shareUrl = generateShareLink();
    return `<iframe 
  src="${shareUrl}" 
  width="640" 
  height="360" 
  frameborder="0" 
  allowfullscreen
  ${shareSettings.allowDownload ? 'allowtransparency' : ''}
></iframe>`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado al portapapeles`);
  };

  const openSocialShare = (platform: string) => {
    const url = generateShareLink(platform);
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="space-y-6">
      {/* Video Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Video para Compartir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`relative cursor-pointer rounded-lg border-2 transition-colors ${
                  selectedVideo?.id === video.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
                onClick={() => setSelectedVideo(video)}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
                <div className="p-3">
                  <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                {selectedVideo?.id === video.id && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedVideo && (
        <Tabs defaultValue="social" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="social">Redes Sociales</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
            <TabsTrigger value="link">Link Directo</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Compartir en Redes Sociales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => openSocialShare('facebook')}
                  >
                    <Facebook className="w-8 h-8 text-blue-600" />
                    <span className="text-sm">Facebook</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => openSocialShare('twitter')}
                  >
                    <Twitter className="w-8 h-8 text-blue-400" />
                    <span className="text-sm">Twitter</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => openSocialShare('linkedin')}
                  >
                    <Linkedin className="w-8 h-8 text-blue-700" />
                    <span className="text-sm">LinkedIn</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => openSocialShare('whatsapp')}
                  >
                    <Instagram className="w-8 h-8 text-green-600" />
                    <span className="text-sm">WhatsApp</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Código de Inserción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Código HTML</Label>
                  <div className="relative">
                    <Textarea
                      value={generateEmbedCode()}
                      readOnly
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateEmbedCode(), 'Código de inserción')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ancho</Label>
                    <Input defaultValue="640" />
                  </div>
                  <div className="space-y-2">
                    <Label>Alto</Label>
                    <Input defaultValue="360" />
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Vista Previa</h4>
                  <div className="bg-black aspect-video rounded flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-4xl mb-2">▶️</div>
                      <p className="text-sm">{selectedVideo.title}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Link Directo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL del Video</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generateShareLink()}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      onClick={() => copyToClipboard(generateShareLink(), 'Link')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <QrCode className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                      <h4 className="font-medium">Código QR</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Comparte fácilmente desde móvil
                      </p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar QR
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Estadísticas de Compartir</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total shares:</span>
                          <Badge variant="secondary">247</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Esta semana:</span>
                          <Badge variant="secondary">23</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Más popular:</span>
                          <Badge>Facebook</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Compartir</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Permitir descarga</Label>
                        <p className="text-sm text-muted-foreground">Los usuarios pueden descargar el video</p>
                      </div>
                      <Switch
                        checked={shareSettings.allowDownload}
                        onCheckedChange={(checked) => 
                          setShareSettings(prev => ({ ...prev, allowDownload: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mostrar controles</Label>
                        <p className="text-sm text-muted-foreground">Controles de reproducción visibles</p>
                      </div>
                      <Switch
                        checked={shareSettings.showControls}
                        onCheckedChange={(checked) => 
                          setShareSettings(prev => ({ ...prev, showControls: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Reproducción automática</Label>
                        <p className="text-sm text-muted-foreground">Inicia automáticamente</p>
                      </div>
                      <Switch
                        checked={shareSettings.autoplay}
                        onCheckedChange={(checked) => 
                          setShareSettings(prev => ({ ...prev, autoplay: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Dominio personalizado</Label>
                      <Input
                        placeholder="tu-dominio.com"
                        value={shareSettings.customDomain}
                        onChange={(e) => 
                          setShareSettings(prev => ({ ...prev, customDomain: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contraseña (opcional)</Label>
                      <Input
                        type="password"
                        placeholder="Proteger con contraseña"
                        value={shareSettings.password}
                        onChange={(e) => 
                          setShareSettings(prev => ({ ...prev, password: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha de expiración</Label>
                      <Input
                        type="datetime-local"
                        value={shareSettings.expiryDate}
                        onChange={(e) => 
                          setShareSettings(prev => ({ ...prev, expiryDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Radio, 
  RadioOff, 
  Users, 
  Eye, 
  Clock, 
  Settings, 
  Copy, 
  Share2, 
  Download,
  BarChart3,
  Wifi,
  WifiOff,
  Play,
  Square,
  Pause,
  Volume2,
  Monitor,
  Smartphone,
  Tv,
  Globe,
  Lock,
  Key,
  Calendar,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient as api } from '@/lib/api';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'live' | 'ended' | 'offline';
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
  embedCode: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  viewerCount: number;
  maxViewers: number;
  duration: number;
  isPrivate: boolean;
  password?: string;
  allowChat: boolean;
  allowRecording: boolean;
  autoStart: boolean;
  quality: 'auto' | '1080p' | '720p' | '480p' | '360p';
  bitrate: number;
  framerate: number;
  createdAt: string;
  updatedAt: string;
}

interface StreamAnalytics {
  totalViews: number;
  uniqueViewers: number;
  averageWatchTime: number;
  peakViewers: number;
  chatMessages: number;
  countries: { [key: string]: number };
  devices: { [key: string]: number };
  qualityDistribution: { [key: string]: number };
}

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto (Adaptativo)', bitrate: 0 },
  { value: '1080p', label: '1080p Full HD', bitrate: 6000 },
  { value: '720p', label: '720p HD', bitrate: 3000 },
  { value: '480p', label: '480p SD', bitrate: 1500 },
  { value: '360p', label: '360p', bitrate: 800 }
];

const FRAMERATE_OPTIONS = [24, 30, 60];

export const LiveStreamManager = () => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [analytics, setAnalytics] = useState<StreamAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    isPrivate: false,
    password: '',
    allowChat: true,
    allowRecording: true,
    autoStart: false,
    quality: 'auto' as const,
    framerate: 30
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStreams();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      if (selectedStream?.status === 'live') {
        updateStreamStats(selectedStream.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedStream]);

  const loadStreams = async () => {
    try {
      //
      // Use existing streams or empty array
      setStreams(streams);
    } catch (error: unknown) {
      toast({
        title: "Error al cargar streams",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const createStream = async () => {
    setCreating(true);
    try {
      // Generate stream key and URLs
      const streamKey = generateStreamKey();
      const streamId = crypto.randomUUID();
      
      const streamData = {
        id: streamId,
        title: newStream.title,
        description: newStream.description,
        status: 'offline' as const,
        stream_key: streamKey,
        rtmp_url: `rtmp://ingest.bunnycdn.com/live/${streamKey}`,
        playback_url: `https://iframe.mediadelivery.net/play/${streamId}`,
        embed_code: generateEmbedCode(streamId),
        scheduled_at: newStream.scheduledAt || null,
        is_private: newStream.isPrivate,
        password: newStream.password || null,
        allow_chat: newStream.allowChat,
        allow_recording: newStream.allowRecording,
        auto_start: newStream.autoStart,
        quality: newStream.quality,
        bitrate: QUALITY_OPTIONS.find(q => q.value === newStream.quality)?.bitrate || 0,
        framerate: newStream.framerate,
        viewer_count: 0,
        max_viewers: 0,
        duration: 0
      };


        const data = null, error = null;

      if (error) throw error;

      // Create stream on Bunny CDN
      await createBunnyStream(data);

      await loadStreams();
      setShowCreateDialog(false);
      setNewStream({
        title: '',
        description: '',
        scheduledAt: '',
        isPrivate: false,
        password: '',
        allowChat: true,
        allowRecording: true,
        autoStart: false,
        quality: 'auto',
        framerate: 30
      });
      
      toast({
        title: "Stream creado",
        description: "Tu stream en vivo está listo para transmitir",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al crear stream",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const createBunnyStream = async (stream: LiveStream) => {
    try {
      const response = await api.post('/live-streams/create', {
        streamId: stream.id,
        title: stream.title,
        quality: stream.quality,
        framerate: stream.framerate,
        allowRecording: stream.allow_recording
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Bunny stream:', error);
      throw error;
    }
  };

  const startStream = async (streamId: string) => {
    try {
      
        const data = null, error = null;

      if (error) throw error;

      await loadStreams();
      setConnectionStatus('connected');
      
      toast({
        title: "Stream iniciado",
        description: "Tu transmisión en vivo está activa",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al iniciar stream",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const stopStream = async (streamId: string) => {
    try {
      
        const data = null, error = null;

      if (error) throw error;

      await loadStreams();
      setConnectionStatus('disconnected');
      
      toast({
        title: "Stream finalizado",
        description: "Tu transmisión en vivo ha terminado",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al finalizar stream",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const updateStreamStats = async (streamId: string) => {
    try {
      const response = await api.get(`/live-streams/${streamId}/stats`);
      const data = response.data;
      
      // Update local state with real-time stats
      setStreams(prev => prev.map(stream => 
        stream.id === streamId 
          ? { ...stream, viewerCount: data.viewerCount, maxViewers: Math.max(stream.maxViewers, data.viewerCount) }
          : stream
      ));
    } catch (error) {
      console.error('Error updating stream stats:', error);
    }
  };

  const generateStreamKey = (): string => {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 24);
  };

  const generateEmbedCode = (streamId: string): string => {
    return `<iframe src="https://iframe.mediadelivery.net/play/${streamId}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'scheduled': return 'bg-blue-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return <Radio className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'ended': return <Square className="w-4 h-4" />;
      default: return <RadioOff className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold">Streaming en Vivo</h2>
            <p className="text-muted-foreground">Gestiona tus transmisiones en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm capitalize">{connectionStatus}</span>
          </div>
          <Badge variant="outline">{streams.length} streams</Badge>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Stream
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Stream</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título del Stream</Label>
                    <Input
                      value={newStream.title}
                      onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
                      placeholder="Mi transmisión en vivo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Programar (opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={newStream.scheduledAt}
                      onChange={(e) => setNewStream({ ...newStream, scheduledAt: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={newStream.description}
                    onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
                    placeholder="Describe tu transmisión..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Calidad</Label>
                    <Select value={newStream.quality} onValueChange={(value: 'auto' | '1080p' | '720p' | '480p' | '360p') => setNewStream({ ...newStream, quality: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUALITY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>FPS</Label>
                    <Select value={newStream.framerate.toString()} onValueChange={(value) => setNewStream({ ...newStream, framerate: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FRAMERATE_OPTIONS.map(fps => (
                          <SelectItem key={fps} value={fps.toString()}>
                            {fps} FPS
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Stream Privado</Label>
                      <p className="text-sm text-muted-foreground">Requiere contraseña para acceder</p>
                    </div>
                    <Switch
                      checked={newStream.isPrivate}
                      onCheckedChange={(checked) => setNewStream({ ...newStream, isPrivate: checked })}
                    />
                  </div>
                  
                  {newStream.isPrivate && (
                    <div className="space-y-2">
                      <Label>Contraseña</Label>
                      <Input
                        type="password"
                        value={newStream.password}
                        onChange={(e) => setNewStream({ ...newStream, password: e.target.value })}
                        placeholder="Contraseña del stream"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label>Permitir Chat</Label>
                    <Switch
                      checked={newStream.allowChat}
                      onCheckedChange={(checked) => setNewStream({ ...newStream, allowChat: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Grabar Automáticamente</Label>
                    <Switch
                      checked={newStream.allowRecording}
                      onCheckedChange={(checked) => setNewStream({ ...newStream, allowRecording: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Inicio Automático</Label>
                    <Switch
                      checked={newStream.autoStart}
                      onCheckedChange={(checked) => setNewStream({ ...newStream, autoStart: checked })}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createStream} disabled={creating || !newStream.title}>
                    {creating ? "Creando..." : "Crear Stream"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="streams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="streams">Mis Streams</TabsTrigger>
          <TabsTrigger value="live">En Vivo</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Streams List */}
        <TabsContent value="streams" className="space-y-6">
          {streams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay streams</h3>
                <p className="text-muted-foreground mb-4">Crea tu primer stream en vivo</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Crear Stream
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {streams.map(stream => (
                <Card key={stream.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStream(stream)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(stream.status)}`} />
                        <div>
                          <h3 className="font-semibold">{stream.title}</h3>
                          <p className="text-sm text-muted-foreground">{stream.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {getStatusIcon(stream.status)}
                              {stream.status}
                            </span>
                            {stream.status === 'live' && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {stream.viewerCount} espectadores
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(stream.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {stream.isPrivate && <Lock className="w-4 h-4 text-yellow-500" />}
                        {stream.allowRecording && <Download className="w-4 h-4 text-blue-500" />}
                        
                        {stream.status === 'offline' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              startStream(stream.id);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Play className="w-4 h-4" />
                            Iniciar
                          </Button>
                        )}
                        
                        {stream.status === 'live' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              stopStream(stream.id);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Square className="w-4 h-4" />
                            Finalizar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Live Stream Details */}
        <TabsContent value="live" className="space-y-6">
          {selectedStream ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stream Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(selectedStream.status)}
                    {selectedStream.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">RTMP URL</Label>
                      <div className="flex items-center gap-2">
                        <Input value={selectedStream.rtmpUrl} readOnly className="font-mono text-xs" />
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedStream.rtmpUrl, 'RTMP URL')}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Stream Key</Label>
                      <div className="flex items-center gap-2">
                        <Input value={selectedStream.streamKey} readOnly className="font-mono text-xs" type="password" />
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedStream.streamKey, 'Stream Key')}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">URL de Reproducción</Label>
                      <div className="flex items-center gap-2">
                        <Input value={selectedStream.playbackUrl} readOnly className="font-mono text-xs" />
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedStream.playbackUrl, 'URL de reproducción')}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Live Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Estadísticas en Tiempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-red-500">{selectedStream.viewerCount}</div>
                      <div className="text-sm text-muted-foreground">Espectadores Actuales</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">{selectedStream.maxViewers}</div>
                      <div className="text-sm text-muted-foreground">Pico de Audiencia</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-500">{Math.floor(selectedStream.duration / 60)}m</div>
                      <div className="text-sm text-muted-foreground">Duración</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">{selectedStream.quality}</div>
                      <div className="text-sm text-muted-foreground">Calidad</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecciona un stream</h3>
                <p className="text-muted-foreground">Elige un stream para ver los detalles en vivo</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Streaming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Detallados</h3>
                <p className="text-muted-foreground">Métricas avanzadas de tus transmisiones en vivo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración de Streaming
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Notificaciones de Stream</Label>
                    <p className="text-sm text-muted-foreground">Recibe alertas cuando inicies o finalices streams</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto-grabación</Label>
                    <p className="text-sm text-muted-foreground">Graba automáticamente todos los streams</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Chat Moderado</Label>
                    <p className="text-sm text-muted-foreground">Activa filtros automáticos en el chat</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

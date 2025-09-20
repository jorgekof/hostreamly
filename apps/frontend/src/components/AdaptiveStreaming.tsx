import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Settings, 
  Monitor, 
  Wifi, 
  WifiOff,
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import api, { apiClient } from '@/lib/api';
interface QualityLevel {
  id: string;
  name: string;
  width: number;
  height: number;
  bitrate: number;
  fps: number;
  codec: string;
  enabled: boolean;
}

interface AdaptiveProfile {
  id: string;
  name: string;
  description: string;
  qualityLevels: QualityLevel[];
  adaptationRules: {
    bandwidthThresholds: number[];
    bufferThresholds: number[];
    enableAutoSwitch: boolean;
    aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  };
}

interface Video {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  [key: string]: unknown;
}

interface StreamingStats {
  currentBitrate: number;
  bufferHealth: number;
  droppedFrames: number;
  networkSpeed: number;
  qualityChanges: number;
  viewerCount: number;
  avgLatency: number;
}

const AdaptiveStreaming: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [adaptiveProfiles, setAdaptiveProfiles] = useState<AdaptiveProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [streamingStats, setStreamingStats] = useState<StreamingStats>({
    currentBitrate: 0,
    bufferHealth: 0,
    droppedFrames: 0,
    networkSpeed: 0,
    qualityChanges: 0,
    viewerCount: 0,
    avgLatency: 0
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newProfile, setNewProfile] = useState<Partial<AdaptiveProfile>>({
    name: '',
    description: '',
    qualityLevels: [],
    adaptationRules: {
      bandwidthThresholds: [500, 1000, 2500, 5000],
      bufferThresholds: [5, 10, 15],
      enableAutoSwitch: true,
      aggressiveness: 'balanced'
    }
  });

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const defaultQualityLevels: QualityLevel[] = useMemo(() => [
    {
      id: '240p',
      name: '240p',
      width: 426,
      height: 240,
      bitrate: 400,
      fps: 30,
      codec: 'h264',
      enabled: true
    },
    {
      id: '360p',
      name: '360p',
      width: 640,
      height: 360,
      bitrate: 800,
      fps: 30,
      codec: 'h264',
      enabled: true
    },
    {
      id: '480p',
      name: '480p',
      width: 854,
      height: 480,
      bitrate: 1200,
      fps: 30,
      codec: 'h264',
      enabled: true
    },
    {
      id: '720p',
      name: '720p HD',
      width: 1280,
      height: 720,
      bitrate: 2500,
      fps: 30,
      codec: 'h264',
      enabled: true
    },
    {
      id: '1080p',
      name: '1080p Full HD',
      width: 1920,
      height: 1080,
      bitrate: 5000,
      fps: 30,
      codec: 'h264',
      enabled: true
    },
    {
      id: '1440p',
      name: '1440p 2K',
      width: 2560,
      height: 1440,
      bitrate: 8000,
      fps: 30,
      codec: 'h264',
      enabled: false
    },
    {
      id: '2160p',
      name: '2160p 4K',
      width: 3840,
      height: 2160,
      bitrate: 15000,
      fps: 30,
      codec: 'h264',
      enabled: false
    }
  ], []);

  const defaultProfiles: AdaptiveProfile[] = useMemo(() => [
    {
      id: 'mobile-optimized',
      name: 'Mobile Optimized',
      description: 'Optimizado para dispositivos móviles con conexiones limitadas',
      qualityLevels: defaultQualityLevels.slice(0, 4),
      adaptationRules: {
        bandwidthThresholds: [300, 600, 1000, 2000],
        bufferThresholds: [3, 6, 10],
        enableAutoSwitch: true,
        aggressiveness: 'aggressive'
      }
    },
    {
      id: 'desktop-standard',
      name: 'Desktop Standard',
      description: 'Configuración estándar para escritorio',
      qualityLevels: defaultQualityLevels.slice(1, 6),
      adaptationRules: {
        bandwidthThresholds: [500, 1000, 2500, 5000, 8000],
        bufferThresholds: [5, 10, 15],
        enableAutoSwitch: true,
        aggressiveness: 'balanced'
      }
    },
    {
      id: 'premium-quality',
      name: 'Premium Quality',
      description: 'Máxima calidad para conexiones de alta velocidad',
      qualityLevels: defaultQualityLevels,
      adaptationRules: {
        bandwidthThresholds: [1000, 2500, 5000, 8000, 15000, 25000],
        bufferThresholds: [10, 15, 20],
        enableAutoSwitch: true,
        aggressiveness: 'conservative'
      }
    }
  ], [defaultQualityLevels]);

  const { user } = useAuth();

  const updateStreamingStats = useCallback(async () => {
    if (!selectedVideo) return;

    try {
      const response = await api.get(`/videos/${selectedVideo}/streaming-stats`);
      setStreamingStats(response.data.stats || {
        currentBitrate: 0,
        bufferHealth: 0,
        droppedFrames: 0,
        networkSpeed: 0,
        qualityChanges: 0,
        viewerCount: 0,
        avgLatency: 0
      });
    } catch (error) {
      console.error('Error updating streaming stats:', error);
    }
  }, [selectedVideo]);

  const loadVideos = useCallback(async () => {
    try {
      if (!user) return;

      const response = await api.get('/videos');
      setVideos(response.data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Error al cargar videos');
    }
  }, [user]);

  useEffect(() => {
    loadVideos();
    setAdaptiveProfiles(defaultProfiles);
    setNewProfile(prev => ({ ...prev, qualityLevels: defaultQualityLevels }));
  }, [loadVideos, defaultProfiles, defaultQualityLevels]);

  useEffect(() => {
    if (autoRefresh && isStreaming) {
      refreshInterval.current = setInterval(() => {
        updateStreamingStats();
      }, 2000);
    } else if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh, isStreaming, updateStreamingStats]);

  const createAdaptiveProfile = async () => {
    if (!newProfile.name || !newProfile.qualityLevels?.length) {
      toast.error('Nombre y niveles de calidad son requeridos');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const response = await api.post('/streaming/adaptive-profiles', {
        ...newProfile,
        userId: user.id
      });

      const data = response.data;
      setAdaptiveProfiles(prev => [...prev, data.profile || data]);
      setNewProfile({
        name: '',
        description: '',
        qualityLevels: defaultQualityLevels,
        adaptationRules: {
          bandwidthThresholds: [500, 1000, 2500, 5000],
          bufferThresholds: [5, 10, 15],
          enableAutoSwitch: true,
          aggressiveness: 'balanced'
        }
      });
      toast.success('Perfil adaptativo creado exitosamente');
    } catch (error) {
      console.error('Error creating adaptive profile:', error);
      toast.error('Error al crear perfil adaptativo');
    } finally {
      setLoading(false);
    }
  };

  const startAdaptiveStreaming = async () => {
    if (!selectedVideo || !selectedProfile) {
      toast.error('Selecciona un video y perfil');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const profile = adaptiveProfiles.find(p => p.id === selectedProfile);
      if (!profile) throw new Error('Perfil no encontrado');

      const response = await api.post('/streaming/adaptive/start', {
        videoId: selectedVideo,
        profileId: selectedProfile,
        userId: user.id
      });

      setIsStreaming(true);
      toast.success('Streaming adaptativo iniciado');
    } catch (error) {
      console.error('Error starting adaptive streaming:', error);
      toast.error('Error al iniciar streaming adaptativo');
    } finally {
      setLoading(false);
    }
  };

  const stopAdaptiveStreaming = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const response = await api.post('/streaming/adaptive/stop', {
        videoId: selectedVideo,
        userId: user.id
      });

      setIsStreaming(false);
      toast.success('Streaming adaptativo detenido');
    } catch (error) {
      console.error('Error stopping adaptive streaming:', error);
      toast.error('Error al detener streaming adaptativo');
    } finally {
      setLoading(false);
    }
  };



  const updateQualityLevel = (index: number, field: keyof QualityLevel, value: string | number | boolean) => {
    setNewProfile(prev => ({
      ...prev,
      qualityLevels: prev.qualityLevels?.map((level, i) => 
        i === index ? { ...level, [field]: value } : level
      ) || []
    }));
  };

  const addQualityLevel = () => {
    const newLevel: QualityLevel = {
      id: `custom-${Date.now()}`,
      name: 'Custom',
      width: 1280,
      height: 720,
      bitrate: 2500,
      fps: 30,
      codec: 'h264',
      enabled: true
    };

    setNewProfile(prev => ({
      ...prev,
      qualityLevels: [...(prev.qualityLevels || []), newLevel]
    }));
  };

  const removeQualityLevel = (index: number) => {
    setNewProfile(prev => ({
      ...prev,
      qualityLevels: prev.qualityLevels?.filter((_, i) => i !== index) || []
    }));
  };

  const getQualityBadgeColor = (bitrate: number) => {
    if (bitrate < 1000) return 'bg-red-100 text-red-800';
    if (bitrate < 2500) return 'bg-yellow-100 text-yellow-800';
    if (bitrate < 5000) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getConnectionStatus = () => {
    if (streamingStats.networkSpeed > 5000) return { icon: Wifi, color: 'text-green-500', text: 'Excelente' };
    if (streamingStats.networkSpeed > 2000) return { icon: Wifi, color: 'text-blue-500', text: 'Buena' };
    if (streamingStats.networkSpeed > 500) return { icon: Wifi, color: 'text-yellow-500', text: 'Regular' };
    return { icon: WifiOff, color: 'text-red-500', text: 'Pobre' };
  };

  const ConnectionIcon = getConnectionStatus().icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Streaming Adaptativo</h2>
          <p className="text-muted-foreground">
            Configura streaming con múltiples bitrates para optimizar la experiencia del usuario
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="auto-refresh">Auto-refresh</Label>
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
        </div>
      </div>

      <Tabs defaultValue="streaming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="streaming">Streaming</TabsTrigger>
          <TabsTrigger value="profiles">Perfiles</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="streaming" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configuración de Streaming</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="video-select">Video</Label>
                  <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar video" />
                    </SelectTrigger>
                    <SelectContent>
                      {videos.map((video) => (
                        <SelectItem key={video.id} value={video.id}>
                          {video.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="profile-select">Perfil Adaptativo</Label>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {adaptiveProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  {!isStreaming ? (
                    <Button 
                      onClick={startAdaptiveStreaming} 
                      disabled={loading || !selectedVideo || !selectedProfile}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Streaming
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopAdaptiveStreaming} 
                      disabled={loading}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Detener Streaming
                    </Button>
                  )}
                  <Button 
                    onClick={updateStreamingStats} 
                    disabled={loading}
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Estado en Tiempo Real</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <ConnectionIcon className={`h-4 w-4 ${getConnectionStatus().color}`} />
                      <span className="text-sm font-medium">Conexión</span>
                    </div>
                    <p className="text-2xl font-bold">{getConnectionStatus().text}</p>
                    <p className="text-xs text-muted-foreground">
                      {(streamingStats.networkSpeed / 1000).toFixed(1)} Mbps
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm font-medium">Bitrate Actual</span>
                    </div>
                    <p className="text-2xl font-bold">{streamingStats.currentBitrate}</p>
                    <p className="text-xs text-muted-foreground">kbps</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">Buffer</span>
                    </div>
                    <Progress value={streamingStats.bufferHealth} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {streamingStats.bufferHealth}% saludable
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">Espectadores</span>
                    </div>
                    <p className="text-2xl font-bold">{streamingStats.viewerCount}</p>
                    <p className="text-xs text-muted-foreground">en vivo</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Frames perdidos:</span>
                    <span>{streamingStats.droppedFrames}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cambios de calidad:</span>
                    <span>{streamingStats.qualityChanges}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Latencia promedio:</span>
                    <span>{streamingStats.avgLatency}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Niveles de Calidad Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adaptiveProfiles
                    .find(p => p.id === selectedProfile)
                    ?.qualityLevels.filter(level => level.enabled)
                    .map((level) => (
                      <div key={level.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{level.name}</h4>
                          <Badge className={getQualityBadgeColor(level.bitrate)}>
                            {level.bitrate} kbps
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Resolución: {level.width}x{level.height}</p>
                          <p>FPS: {level.fps}</p>
                          <p>Codec: {level.codec.toUpperCase()}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Perfiles Existentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {adaptiveProfiles.map((profile) => (
                  <div key={profile.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{profile.name}</h4>
                      <Badge variant="outline">
                        {profile.qualityLevels.filter(l => l.enabled).length} niveles
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{profile.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.qualityLevels
                        .filter(level => level.enabled)
                        .map((level) => (
                          <Badge key={level.id} variant="secondary" className="text-xs">
                            {level.name}
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="profile-name">Nombre del Perfil</Label>
                  <Input
                    id="profile-name"
                    value={newProfile.name || ''}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Mobile Optimized"
                  />
                </div>

                <div>
                  <Label htmlFor="profile-description">Descripción</Label>
                  <Textarea
                    id="profile-description"
                    value={newProfile.description || ''}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe el propósito de este perfil..."
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Niveles de Calidad</Label>
                    <Button onClick={addQualityLevel} size="sm" variant="outline">
                      Agregar Nivel
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {newProfile.qualityLevels?.map((level, index) => (
                      <div key={level.id} className="border rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Input
                            value={level.name}
                            onChange={(e) => updateQualityLevel(index, 'name', e.target.value)}
                            placeholder="Nombre"
                            className="flex-1 mr-2"
                          />
                          <Switch
                            checked={level.enabled}
                            onCheckedChange={(checked) => updateQualityLevel(index, 'enabled', checked)}
                          />
                          <Button
                            onClick={() => removeQualityLevel(index)}
                            size="sm"
                            variant="ghost"
                            className="ml-2"
                          >
                            ×
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            value={level.width}
                            onChange={(e) => updateQualityLevel(index, 'width', parseInt(e.target.value))}
                            placeholder="Ancho"
                          />
                          <Input
                            type="number"
                            value={level.height}
                            onChange={(e) => updateQualityLevel(index, 'height', parseInt(e.target.value))}
                            placeholder="Alto"
                          />
                          <Input
                            type="number"
                            value={level.bitrate}
                            onChange={(e) => updateQualityLevel(index, 'bitrate', parseInt(e.target.value))}
                            placeholder="Bitrate (kbps)"
                          />
                          <Input
                            type="number"
                            value={level.fps}
                            onChange={(e) => updateQualityLevel(index, 'fps', parseInt(e.target.value))}
                            placeholder="FPS"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={createAdaptiveProfile} disabled={loading} className="w-full">
                  {loading ? 'Creando...' : 'Crear Perfil'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Bitrate Promedio</span>
                </div>
                <p className="text-2xl font-bold mt-2">{streamingStats.currentBitrate}</p>
                <p className="text-xs text-muted-foreground">kbps</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Salud del Buffer</span>
                </div>
                <p className="text-2xl font-bold mt-2">{streamingStats.bufferHealth}%</p>
                <p className="text-xs text-muted-foreground">promedio</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Frames Perdidos</span>
                </div>
                <p className="text-2xl font-bold mt-2">{streamingStats.droppedFrames}</p>
                <p className="text-xs text-muted-foreground">total</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Latencia</span>
                </div>
                <p className="text-2xl font-bold mt-2">{streamingStats.avgLatency}</p>
                <p className="text-xs text-muted-foreground">ms promedio</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rendimiento del Streaming Adaptativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    El streaming adaptativo está funcionando correctamente. 
                    Se han realizado {streamingStats.qualityChanges} cambios de calidad 
                    para optimizar la experiencia del usuario.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Métricas de Red</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Velocidad de red:</span>
                        <span>{(streamingStats.networkSpeed / 1000).toFixed(1)} Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cambios de calidad:</span>
                        <span>{streamingStats.qualityChanges}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latencia promedio:</span>
                        <span>{streamingStats.avgLatency}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Métricas de Reproducción</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Bitrate actual:</span>
                        <span>{streamingStats.currentBitrate} kbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Salud del buffer:</span>
                        <span>{streamingStats.bufferHealth}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frames perdidos:</span>
                        <span>{streamingStats.droppedFrames}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdaptiveStreaming;

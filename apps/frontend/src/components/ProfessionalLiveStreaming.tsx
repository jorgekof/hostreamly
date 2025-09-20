import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  Settings, 
  Users, 
  BarChart3, 
  DollarSign, 
  Shield, 
  Globe, 
  Zap,
  Camera,
  Mic,
  Monitor,
  Wifi,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  MessageSquare,
  Heart,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

import { apiClient as api } from '@/lib/api';
interface StreamChannel {
  id: string;
  name: string;
  status: 'live' | 'offline' | 'starting' | 'stopping';
  viewers: number;
  duration: string;
  quality: 'HD' | 'Full HD' | '4K';
  latency: number;
  bitrate: number;
  revenue: number;
  provider: 'AWS IVS' | 'JW Player' | 'Wowza';
  streamKey: string;
  playbackUrl: string;
  recordingEnabled: boolean;
  monetizationEnabled: boolean;
  chatEnabled: boolean;
  moderationEnabled: boolean;
}

interface StreamAnalytics {
  totalViewers: number;
  peakViewers: number;
  averageWatchTime: number;
  engagement: number;
  revenue: number;
  chatMessages: number;
  likes: number;
  shares: number;
  qualityDistribution: {
    '4K': number;
    'Full HD': number;
    'HD': number;
    'SD': number;
  };
  geographicDistribution: {
    region: string;
    viewers: number;
    percentage: number;
  }[];
}

interface StreamProvider {
  id: string;
  name: string;
  description: string;
  features: string[];
  pricing: {
    input: string;
    output: string;
    storage: string;
  };
  maxQuality: string;
  latency: string;
  scalability: string;
  monetization: boolean;
  analytics: boolean;
  security: string[];
}

const ProfessionalLiveStreaming: React.FC = () => {
  const [channels, setChannels] = useState<StreamChannel[]>([]);
  const [analytics, setAnalytics] = useState<StreamAnalytics | null>(null);
  const [providers] = useState<StreamProvider[]>([
    {
      id: 'aws-ivs',
      name: 'Amazon IVS',
      description: 'Servicio de video interactivo de Amazon con baja latencia y alta escalabilidad',
      features: [
        'Baja latencia (< 3 segundos)',
        'Escalabilidad automática',
        'Integración con AWS',
        'Chat en tiempo real',
        'Grabación automática',
        'Análisis detallados',
        'Moderación de contenido',
        'Múltiples calidades'
      ],
      pricing: {
        input: '$0.85/hora (HD), $2.00/hora (Standard)',
        output: '$0.036-0.144/hora por viewer',
        storage: 'Incluido en S3'
      },
      maxQuality: '1080p Full HD',
      latency: '< 3 segundos',
      scalability: 'Ilimitada',
      monetization: true,
      analytics: true,
      security: ['DRM', 'Tokenización', 'Geo-restricciones', 'Encriptación AES']
    },
    {
      id: 'jw-player',
      name: 'JW Player',
      description: 'Plataforma de video empresarial con herramientas avanzadas de monetización',
      features: [
        'Player personalizable',
        'Análisis avanzados',
        'Monetización integrada',
        'CDN global',
        'Streaming adaptativo',
        'Protección DRM',
        'APIs robustas',
        'Soporte 4K'
      ],
      pricing: {
        input: 'Desde $99/mes',
        output: 'Incluido en plan',
        storage: 'Incluido'
      },
      maxQuality: '4K Ultra HD',
      latency: '5-15 segundos',
      scalability: 'Empresarial',
      monetization: true,
      analytics: true,
      security: ['DRM Widevine', 'PlayReady', 'FairPlay', 'Tokenización']
    },
    {
      id: 'wowza',
      name: 'Wowza Streaming Cloud',
      description: 'Solución de streaming profesional con máximo control y personalización',
      features: [
        'Ultra baja latencia',
        'Streaming en tiempo real',
        'APIs extensivas',
        'Personalización completa',
        'Múltiples protocolos',
        'Transcoding avanzado',
        'Escalabilidad global',
        'Soporte empresarial'
      ],
      pricing: {
        input: '$85-425/mes según plan',
        output: 'Incluido en plan',
        storage: 'Separado'
      },
      maxQuality: 'Ultra HD 4K',
      latency: '< 1 segundo (WebRTC)',
      scalability: 'Ilimitada',
      monetization: true,
      analytics: true,
      security: ['Encriptación SSL/TLS', 'Autenticación', 'Geo-blocking']
    }
  ]);
  const [selectedProvider, setSelectedProvider] = useState<string>('aws-ivs');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
    loadAnalytics();
  }, []);

  const loadChannels = async () => {
    try {
      // TODO: Implementar llamada a la API
      // const { data, error } = await api.getChannels();
      // if (error) throw error;
      // setChannels(data.channels || []);
    } catch (error) {
      console.error('Error loading channels:', error);
      // Datos de ejemplo para demostración
      setChannels([
        {
          id: '1',
          name: 'Canal Principal',
          status: 'live',
          viewers: 1247,
          duration: '02:34:15',
          quality: 'Full HD',
          latency: 2.8,
          bitrate: 4500,
          revenue: 156.78,
          provider: 'AWS IVS',
          streamKey: 'sk_us-west-2_abc123def456',
          playbackUrl: 'https://abc123def456.us-west-2.playback.live-video.net/api/video/v1/us-west-2.123456789012.channel.abc123def456.m3u8',
          recordingEnabled: true,
          monetizationEnabled: true,
          chatEnabled: true,
          moderationEnabled: true
        },
        {
          id: '2',
          name: 'Evento Especial',
          status: 'offline',
          viewers: 0,
          duration: '00:00:00',
          quality: 'HD',
          latency: 0,
          bitrate: 0,
          revenue: 0,
          provider: 'AWS IVS',
          streamKey: 'sk_us-west-2_xyz789abc123',
          playbackUrl: '',
          recordingEnabled: false,
          monetizationEnabled: false,
          chatEnabled: true,
          moderationEnabled: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // TODO: Implementar llamada a la API
      // const { data, error } = await api.getAnalytics();
      // if (error) throw error;
      // setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Datos de ejemplo
      setAnalytics({
        totalViewers: 15420,
        peakViewers: 2847,
        averageWatchTime: 18.5,
        engagement: 78.3,
        revenue: 2456.89,
        chatMessages: 8934,
        likes: 1247,
        shares: 156,
        qualityDistribution: {
          '4K': 15,
          'Full HD': 45,
          'HD': 35,
          'SD': 5
        },
        geographicDistribution: [
          { region: 'América del Norte', viewers: 6234, percentage: 40.4 },
          { region: 'Europa', viewers: 4567, percentage: 29.6 },
          { region: 'Asia', viewers: 3456, percentage: 22.4 },
          { region: 'América Latina', viewers: 1163, percentage: 7.6 }
        ]
      });
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error('El nombre del canal es requerido');
      return;
    }

    setIsCreatingChannel(true);
    try {
      // TODO: Implementar llamada a la API
      // const { data, error } = await api.createChannel({ name: newChannelName, description: newChannelDescription });
      // if (error) throw error;

      toast.success('Canal creado exitosamente');
      setNewChannelName('');
      setNewChannelDescription('');
      loadChannels();
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Error al crear el canal');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const startStream = async (channelId: string) => {
    try {
      // TODO: Implementar llamada a la API
      // const { data, error } = await api.startStream(channelId);
      // if (error) throw error;

      toast.success('Stream iniciado');
      loadChannels();
    } catch (error) {
      console.error('Error starting stream:', error);
      toast.error('Error al iniciar el stream');
    }
  };

  const stopStream = async (channelId: string) => {
    try {
      // TODO: Implementar llamada a la API
      // const { data, error } = await api.stopStream(channelId);
      // if (error) throw error;

      toast.success('Stream detenido');
      loadChannels();
    } catch (error) {
      console.error('Error stopping stream:', error);
      toast.error('Error al detener el stream');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'starting': return 'bg-yellow-500';
      case 'stopping': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'EN VIVO';
      case 'starting': return 'INICIANDO';
      case 'stopping': return 'DETENIENDO';
      default: return 'OFFLINE';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Streaming Profesional</h2>
          <p className="text-muted-foreground">
            Gestiona streams en vivo con soluciones empresariales de alta calidad
          </p>
        </div>
        <Button onClick={() => setIsCreatingChannel(true)}>
          <Camera className="mr-2 h-4 w-4" />
          Crear Canal
        </Button>
      </div>

      {/* Selector de Proveedor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Proveedor de Streaming
          </CardTitle>
          <CardDescription>
            Selecciona la plataforma de streaming profesional que mejor se adapte a tus necesidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card 
                key={provider.id} 
                className={`cursor-pointer transition-all ${
                  selectedProvider === provider.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedProvider(provider.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    {selectedProvider === provider.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {provider.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Calidad:</span>
                      <p className="text-muted-foreground">{provider.maxQuality}</p>
                    </div>
                    <div>
                      <span className="font-medium">Latencia:</span>
                      <p className="text-muted-foreground">{provider.latency}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium text-sm">Características:</span>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {provider.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.features.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Canales</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monetization">Monetización</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          {/* Analytics Overview */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Viewers Totales</p>
                      <p className="text-2xl font-bold">{analytics.totalViewers.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Pico de Viewers</p>
                      <p className="text-2xl font-bold">{analytics.peakViewers.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Tiempo Promedio</p>
                      <p className="text-2xl font-bold">{analytics.averageWatchTime}m</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Ingresos</p>
                      <p className="text-2xl font-bold">${analytics.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Canales de Streaming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {channels.map((channel) => (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {channel.name}
                        <Badge className={getStatusColor(channel.status)}>
                          {getStatusText(channel.status)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Proveedor: {channel.provider} • Calidad: {channel.quality}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {channel.status === 'live' ? (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => stopStream(channel.id)}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => startStream(channel.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {channel.status === 'live' && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{channel.viewers.toLocaleString()} viewers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{channel.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>{channel.latency}s latencia</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-muted-foreground" />
                        <span>{channel.bitrate} kbps</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Stream Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={channel.streamKey} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {channel.playbackUrl && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Playback URL</Label>
                      <Input 
                        value={channel.playbackUrl} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={channel.recordingEnabled ? "default" : "secondary"}>
                      Grabación {channel.recordingEnabled ? 'ON' : 'OFF'}
                    </Badge>
                    <Badge variant={channel.monetizationEnabled ? "default" : "secondary"}>
                      Monetización {channel.monetizationEnabled ? 'ON' : 'OFF'}
                    </Badge>
                    <Badge variant={channel.chatEnabled ? "default" : "secondary"}>
                      Chat {channel.chatEnabled ? 'ON' : 'OFF'}
                    </Badge>
                    <Badge variant={channel.moderationEnabled ? "default" : "secondary"}>
                      Moderación {channel.moderationEnabled ? 'ON' : 'OFF'}
                    </Badge>
                  </div>

                  {channel.status === 'live' && channel.monetizationEnabled && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ingresos del stream:</span>
                        <span className="font-medium">${channel.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              {/* Distribución de Calidad */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Calidad de Video</CardTitle>
                  <CardDescription>
                    Porcentaje de viewers por calidad de video
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.qualityDistribution).map(([quality, percentage]) => (
                      <div key={quality} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{quality}</span>
                          <span>{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Distribución Geográfica */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución Geográfica</CardTitle>
                  <CardDescription>
                    Viewers por región geográfica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.geographicDistribution.map((region, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{region.region}</span>
                          <span>{region.viewers.toLocaleString()} ({region.percentage}%)</span>
                        </div>
                        <Progress value={region.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Métricas de Engagement */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Mensajes de Chat</p>
                        <p className="text-2xl font-bold">{analytics.chatMessages.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Likes</p>
                        <p className="text-2xl font-bold">{analytics.likes.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Compartidos</p>
                        <p className="text-2xl font-bold">{analytics.shares.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="monetization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Monetización</CardTitle>
              <CardDescription>
                Configura las opciones de monetización para tus streams en vivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anuncios Pre-roll</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar anuncios antes del inicio del stream
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anuncios Mid-roll</Label>
                    <p className="text-sm text-muted-foreground">
                      Insertar anuncios durante el stream
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Suscripciones Premium</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir suscripciones para contenido exclusivo
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Donaciones en Vivo</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar donaciones durante el stream
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Precio de Suscripción Mensual</Label>
                <div className="flex gap-2">
                  <Input placeholder="25.00" type="number" step="0.01" />
                  <Select defaultValue="usd">
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Configuración de Anuncios</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Frecuencia Mid-roll (minutos)</Label>
                    <Input placeholder="15" type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Duración máxima (segundos)</Label>
                    <Input placeholder="30" type="number" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Proveedor</CardTitle>
              <CardDescription>
                Configura los ajustes específicos del proveedor seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedProvider === 'aws-ivs' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Para usar Amazon IVS, necesitas configurar tus credenciales de AWS en las variables de entorno.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Región de AWS</Label>
                      <Select defaultValue="us-west-2">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us-west-2">US West 2 (Oregon)</SelectItem>
                          <SelectItem value="us-east-1">US East 1 (Virginia)</SelectItem>
                          <SelectItem value="eu-west-1">EU West 1 (Ireland)</SelectItem>
                          <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipo de Canal por Defecto</Label>
                      <Select defaultValue="standard">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic ($0.20/hora)</SelectItem>
                          <SelectItem value="standard">Standard ($2.00/hora)</SelectItem>
                          <SelectItem value="advanced_sd">Advanced SD ($0.50/hora)</SelectItem>
                          <SelectItem value="advanced_hd">Advanced HD ($0.85/hora)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {selectedProvider === 'jw-player' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configura tu API Key de JW Player para habilitar la integración.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input placeholder="Ingresa tu JW Player API Key" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Secret Key</Label>
                      <Input placeholder="Ingresa tu JW Player Secret Key" type="password" />
                    </div>
                  </div>
                </div>
              )}

              {selectedProvider === 'wowza' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configura tu cuenta de Wowza Streaming Cloud para comenzar.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input placeholder="Ingresa tu Wowza API Key" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Access Key</Label>
                      <Input placeholder="Ingresa tu Wowza Access Key" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Servidor de Streaming</Label>
                      <Input placeholder="https://your-server.wowza.com" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Grabación Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Grabar automáticamente todos los streams
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Moderación Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Activar moderación de contenido con IA
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones en Tiempo Real</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones de eventos del stream
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button className="w-full">
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para crear canal */}
      {isCreatingChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Crear Nuevo Canal</CardTitle>
              <CardDescription>
                Configura un nuevo canal de streaming con {providers.find(p => p.id === selectedProvider)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del Canal</Label>
                <Input 
                  placeholder="Mi Canal de Streaming"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descripción (Opcional)</Label>
                <Textarea 
                  placeholder="Descripción del canal..."
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsCreatingChannel(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={createChannel}
                  disabled={isCreatingChannel}
                >
                  {isCreatingChannel ? 'Creando...' : 'Crear Canal'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProfessionalLiveStreaming;

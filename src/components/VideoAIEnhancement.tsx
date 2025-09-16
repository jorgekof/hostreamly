import React, { useState, useEffect, useRef } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { 
  Brain, 
  Sparkles, 
  Eye, 
  Wand2, 
  Zap,
  TrendingUp,
  Activity,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  Play,
  Pause,
  Volume2,
  Image,
  FileText,
  Target,
  Cpu,
  Clock,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
interface Video {
  id: string;
  title: string;
  filename: string;
  duration: number;
  size: number;
  resolution: string;
  format: string;
  url: string;
  thumbnail_url?: string;
  created_at: string;
}

interface AIAnalysis {
  id: string;
  video_id: string;
  analysis_type: 'content' | 'quality' | 'optimization' | 'enhancement';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: {
    score: number;
    confidence: number;
    suggestions: string[];
    metadata: Record<string, unknown>;
  };
  created_at: string;
  completed_at?: string;
}

interface EnhancementJob {
  id: string;
  video_id: string;
  enhancement_type: 'upscale' | 'denoise' | 'stabilize' | 'colorgrade' | 'audio_enhance';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  settings: Record<string, unknown>;
  output_url?: string;
  created_at: string;
}

interface AISettings {
  contentAnalysis: {
    enabled: boolean;
    detectObjects: boolean;
    detectScenes: boolean;
    detectText: boolean;
    detectFaces: boolean;
    generateTags: boolean;
  };
  qualityEnhancement: {
    enabled: boolean;
    upscaling: boolean;
    denoising: boolean;
    stabilization: boolean;
    colorGrading: boolean;
    audioEnhancement: boolean;
  };
  autoOptimization: {
    enabled: boolean;
    adaptiveQuality: boolean;
    smartCompression: boolean;
    autoThumbnails: boolean;
    autoChapters: boolean;
  };
}

const VideoAIEnhancement: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [aiAnalyses, setAiAnalyses] = useState<AIAnalysis[]>([]);
  const [enhancementJobs, setEnhancementJobs] = useState<EnhancementJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    contentAnalysis: {
      enabled: true,
      detectObjects: true,
      detectScenes: true,
      detectText: true,
      detectFaces: false,
      generateTags: true
    },
    qualityEnhancement: {
      enabled: true,
      upscaling: false,
      denoising: true,
      stabilization: false,
      colorGrading: true,
      audioEnhancement: true
    },
    autoOptimization: {
      enabled: true,
      adaptiveQuality: true,
      smartCompression: true,
      autoThumbnails: true,
      autoChapters: false
    }
  });

  const [enhancementSettings, setEnhancementSettings] = useState({
    upscale: {
      factor: 2,
      model: 'esrgan',
      preserveDetails: true
    },
    denoise: {
      strength: 0.5,
      preserveTexture: true
    },
    stabilization: {
      strength: 0.7,
      cropRatio: 0.1
    },
    colorGrade: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      preset: 'auto'
    },
    audioEnhance: {
      noiseReduction: true,
      normalize: true,
      enhance: true
    }
  });

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadVideos();
    loadAIAnalyses();
    loadEnhancementJobs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        loadAIAnalyses();
        loadEnhancementJobs();
      }, 10000);
    } else if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh]);

  const loadVideos = async () => {
    try {
      if (!user) return;

  
        const data = null;

      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const loadAIAnalyses = async () => {
    try {
      if (!user) return;


        const data = null;

      setAiAnalyses(data || []);
    } catch (error) {
      console.error('Error loading AI analyses:', error);
    }
  };

  const loadEnhancementJobs = async () => {
    try {
      if (!user) return;

      
        const data = null;

      setEnhancementJobs(data || []);
    } catch (error) {
      console.error('Error loading enhancement jobs:', error);
    }
  };

  const startContentAnalysis = async () => {
    if (!selectedVideo) {
      toast.error('Selecciona un video para analizar');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      

      toast.success('Análisis de contenido iniciado');
      loadAIAnalyses();
    } catch (error) {
      console.error('Error starting content analysis:', error);
      toast.error('Error al iniciar análisis de contenido');
    } finally {
      setLoading(false);
    }
  };

  const startQualityEnhancement = async (enhancementType: string) => {
    if (!selectedVideo) {
      toast.error('Selecciona un video para mejorar');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const settings = enhancementSettings[enhancementType as keyof typeof enhancementSettings];

      

      toast.success(`Mejora de ${enhancementType} iniciada`);
      loadEnhancementJobs();
    } catch (error) {
      console.error('Error starting quality enhancement:', error);
      toast.error('Error al iniciar mejora de calidad');
    } finally {
      setLoading(false);
    }
  };

  const startAutoOptimization = async () => {
    if (!selectedVideo) {
      toast.error('Selecciona un video para optimizar');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      

      toast.success('Optimización automática iniciada');
      loadAIAnalyses();
      loadEnhancementJobs();
    } catch (error) {
      console.error('Error starting auto optimization:', error);
      toast.error('Error al iniciar optimización automática');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const selectedVideoData = videos.find(v => v.id === selectedVideo);
  const videoAnalyses = aiAnalyses.filter(a => a.video_id === selectedVideo);
  const videoJobs = enhancementJobs.filter(j => j.video_id === selectedVideo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mejora de Video con IA</h2>
          <p className="text-muted-foreground">
            Análisis inteligente y mejora automática de calidad de video
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          <Button onClick={startAutoOptimization} disabled={loading || !selectedVideo}>
            <Sparkles className="h-4 w-4 mr-2" />
            Optimización Auto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Análisis IA</span>
            </div>
            <p className="text-2xl font-bold mt-2">{aiAnalyses.length}</p>
            <p className="text-xs text-muted-foreground">
              {aiAnalyses.filter(a => a.status === 'completed').length} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wand2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Mejoras Activas</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {enhancementJobs.filter(j => j.status === 'processing').length}
            </p>
            <p className="text-xs text-muted-foreground">en progreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Calidad Promedio</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {aiAnalyses.length > 0 
                ? Math.round(aiAnalyses.reduce((sum, a) => sum + a.results.score, 0) / aiAnalyses.length)
                : 0
              }
            </p>
            <p className="text-xs text-muted-foreground">de 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Videos Mejorados</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {enhancementJobs.filter(j => j.status === 'completed').length}
            </p>
            <p className="text-xs text-muted-foreground">exitosos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Seleccionar Video</CardTitle>
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

            {selectedVideoData && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedVideoData.title}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Duración: {Math.floor(selectedVideoData.duration / 60)}:{(selectedVideoData.duration % 60).toString().padStart(2, '0')}</p>
                  <p>Resolución: {selectedVideoData.resolution}</p>
                  <p>Formato: {selectedVideoData.format}</p>
                  <p>Tamaño: {(selectedVideoData.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={startContentAnalysis} 
                disabled={loading || !selectedVideo}
                className="w-full"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Analizar Contenido
              </Button>
              
              <Button 
                onClick={() => startQualityEnhancement('upscale')} 
                disabled={loading || !selectedVideo}
                className="w-full"
                variant="outline"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Mejorar Calidad
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuración IA</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="analysis" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis">Análisis</TabsTrigger>
                <TabsTrigger value="enhancement">Mejora</TabsTrigger>
                <TabsTrigger value="optimization">Optimización</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="detect-objects">Detectar Objetos</Label>
                    <Switch
                      id="detect-objects"
                      checked={aiSettings.contentAnalysis.detectObjects}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({
                          ...prev,
                          contentAnalysis: {
                            ...prev.contentAnalysis,
                            detectObjects: checked
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="detect-scenes">Detectar Escenas</Label>
                    <Switch
                      id="detect-scenes"
                      checked={aiSettings.contentAnalysis.detectScenes}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({
                          ...prev,
                          contentAnalysis: {
                            ...prev.contentAnalysis,
                            detectScenes: checked
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="detect-text">Detectar Texto</Label>
                    <Switch
                      id="detect-text"
                      checked={aiSettings.contentAnalysis.detectText}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({
                          ...prev,
                          contentAnalysis: {
                            ...prev.contentAnalysis,
                            detectText: checked
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="generate-tags">Generar Tags</Label>
                    <Switch
                      id="generate-tags"
                      checked={aiSettings.contentAnalysis.generateTags}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({
                          ...prev,
                          contentAnalysis: {
                            ...prev.contentAnalysis,
                            generateTags: checked
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="enhancement" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Factor de Upscaling</Label>
                    <Slider
                      value={[enhancementSettings.upscale.factor]}
                      onValueChange={([value]) => 
                        setEnhancementSettings(prev => ({
                          ...prev,
                          upscale: { ...prev.upscale, factor: value }
                        }))
                      }
                      max={4}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      {enhancementSettings.upscale.factor}x
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fuerza de Denoise</Label>
                    <Slider
                      value={[enhancementSettings.denoise.strength]}
                      onValueChange={([value]) => 
                        setEnhancementSettings(prev => ({
                          ...prev,
                          denoise: { ...prev.denoise, strength: value }
                        }))
                      }
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      {(enhancementSettings.denoise.strength * 100).toFixed(0)}%
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Preset de Color</Label>
                    <Select 
                      value={enhancementSettings.colorGrade.preset} 
                      onValueChange={(value) => 
                        setEnhancementSettings(prev => ({
                          ...prev,
                          colorGrade: { ...prev.colorGrade, preset: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automático</SelectItem>
                        <SelectItem value="vivid">Vívido</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="cinematic">Cinematográfico</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="optimization" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="adaptive-quality">Calidad Adaptativa</Label>
                    <Switch
                      id="adaptive-quality"
                      checked={aiSettings.autoOptimization.adaptiveQuality}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({
                          ...prev,
                          autoOptimization: {
                            ...prev.autoOptimization,
                            adaptiveQuality: checked
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="smart-compression">Compresión Inteligente</Label>
                    <Switch
                      id="smart-compression"
                      checked={aiSettings.autoOptimization.smartCompression}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({
                          ...prev,
                          autoOptimization: {
                            ...prev.autoOptimization,
                            smartCompression: checked
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-thumbnails">Miniaturas Automáticas</Label>
                    <Switch
                      id="auto-thumbnails"
                      checked={aiSettings.autoOptimization.autoThumbnails}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({
                          ...prev,
                          autoOptimization: {
                            ...prev.autoOptimization,
                            autoThumbnails: checked
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-chapters">Capítulos Automáticos</Label>
                    <Switch
                      id="auto-chapters"
                      checked={aiSettings.autoOptimization.autoChapters}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({
                          ...prev,
                          autoOptimization: {
                            ...prev.autoOptimization,
                            autoChapters: checked
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analyses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analyses">Análisis IA</TabsTrigger>
          <TabsTrigger value="enhancements">Mejoras</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Contenido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {videoAnalyses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay análisis disponibles. Selecciona un video y ejecuta un análisis.
                  </p>
                ) : (
                  videoAnalyses.map((analysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">{analysis.analysis_type}</h4>
                        <Badge className={getStatusColor(analysis.status)}>
                          {analysis.status}
                        </Badge>
                      </div>
                      
                      {analysis.status === 'completed' && (
                        <>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">Puntuación:</span>
                              <span className={`font-bold ${getScoreColor(analysis.results.score)}`}>
                                {analysis.results.score}/100
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">Confianza:</span>
                              <span className="font-medium">
                                {(analysis.results.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          
                          {analysis.results.suggestions.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium">Sugerencias:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {analysis.results.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Iniciado: {new Date(analysis.created_at).toLocaleString()}
                        {analysis.completed_at && (
                          <> • Completado: {new Date(analysis.completed_at).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhancements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trabajos de Mejora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {videoJobs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay trabajos de mejora. Inicia una mejora de calidad.
                  </p>
                ) : (
                  videoJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">{job.enhancement_type.replace('_', ' ')}</h4>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      
                      {job.status === 'processing' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="w-full" />
                        </div>
                      )}
                      
                      {job.status === 'completed' && job.output_url && (
                        <div className="space-y-2">
                          <p className="text-sm text-green-600">✓ Mejora completada exitosamente</p>
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-2" />
                            Ver Resultado
                          </Button>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Iniciado: {new Date(job.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Mejora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Videos Analizados</span>
                    <span className="font-bold">{aiAnalyses.filter(a => a.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Videos Mejorados</span>
                    <span className="font-bold">{enhancementJobs.filter(j => j.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tasa de Éxito</span>
                    <span className="font-bold text-green-500">
                      {enhancementJobs.length > 0 
                        ? Math.round((enhancementJobs.filter(j => j.status === 'completed').length / enhancementJobs.length) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Calidad Promedio</span>
                    <span className={`font-bold ${
                      aiAnalyses.length > 0 
                        ? getScoreColor(Math.round(aiAnalyses.reduce((sum, a) => sum + a.results.score, 0) / aiAnalyses.length))
                        : 'text-gray-500'
                    }`}>
                      {aiAnalyses.length > 0 
                        ? Math.round(aiAnalyses.reduce((sum, a) => sum + a.results.score, 0) / aiAnalyses.length)
                        : 0
                      }/100
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mejoras Recomendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedVideoData && videoAnalyses.length > 0 ? (
                    videoAnalyses
                      .filter(a => a.status === 'completed' && a.results.suggestions.length > 0)
                      .slice(0, 3)
                      .map((analysis, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <h5 className="text-sm font-medium mb-2">{analysis.analysis_type}</h5>
                          <p className="text-sm text-muted-foreground">
                            {analysis.results.suggestions[0]}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Ejecuta un análisis para ver recomendaciones personalizadas.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoAIEnhancement;

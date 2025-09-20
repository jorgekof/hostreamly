import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Code, Zap, Shield, Globe, Users } from "lucide-react";
import { Link } from "react-router-dom";

const DocsPage = () => {
  const apiEndpoints = [
    {
      method: "POST",
      endpoint: "/api/videos/upload",
      description: "Subir un nuevo video",
      params: ["file", "title", "description"]
    },
    {
      method: "GET",
      endpoint: "/api/videos/{id}",
      description: "Obtener información de un video",
      params: ["id"]
    },
    {
      method: "DELETE",
      endpoint: "/api/videos/{id}",
      description: "Eliminar un video",
      params: ["id"]
    }
  ];

  const guides = [
    {
      title: "Guía de Inicio Rápido",
      description: "Configura tu cuenta y sube tu primer video en 5 minutos",
      icon: Zap,
      time: "5 min"
    },
    {
      title: "Integración de API",
      description: "Aprende a integrar nuestra API en tu aplicación",
      icon: Code,
      time: "15 min"
    },
    {
      title: "Seguridad y Privacidad",
      description: "Configuración de seguridad y control de acceso",
      icon: Shield,
      time: "10 min"
    },
    {
      title: "CDN Global",
      description: "Optimiza la entrega de contenido a nivel mundial",
      icon: Globe,
      time: "8 min"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Content Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Documentación
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Todo lo que necesitas para integrar y aprovechar al máximo Hostreamly.com
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick Start Guides */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Guías de Inicio</h2>
            <p className="text-muted-foreground">Comienza rápidamente con nuestras guías paso a paso</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/docs/quick-start" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                      <Zap className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary">5 min</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">Guía de Inicio Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Configura tu cuenta y sube tu primer video en 5 minutos</CardDescription>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/docs/api-integration" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                      <Code className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary">15 min</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">Integración de API</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Aprende a integrar nuestra API en tu aplicación</CardDescription>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/docs/security" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                      <Shield className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary">10 min</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">Seguridad y Privacidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Configuración de seguridad y control de acceso</CardDescription>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/docs/cdn" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary">8 min</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">CDN Global</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Optimiza la entrega de contenido a nivel mundial</CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Integration Examples */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Integraciones Funcionales</h2>
            <p className="text-muted-foreground">Integraciones completamente implementadas y listas para usar</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                name: "Shopify", 
                logo: "🛒", 
                description: "Aplicación completa para tiendas Shopify",
                status: "Funcional",
                link: "/docs/integrations/shopify"
              },
              { 
                name: "JavaScript/React", 
                logo: "⚛️", 
                description: "SDK y componentes para aplicaciones web",
                status: "Funcional",
                link: "/docs/integrations/javascript"
              },
              { 
                name: "HTML/Iframe", 
                logo: "📄", 
                description: "Integración básica con iframe embebido",
                status: "Funcional",
                link: "/docs/integrations/javascript"
              },
              { 
                name: "API REST", 
                logo: "🔗", 
                description: "API completa para integraciones personalizadas",
                status: "Funcional",
                link: "/docs/integrations/api"
              },
              { 
                name: "Webhooks", 
                logo: "🔔", 
                description: "Notificaciones en tiempo real",
                status: "Funcional",
                link: "/docs/integrations/api"
              }
            ].map((platform, index) => (
              <Link key={index} to={platform.link} className="block">
                <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group h-full">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{platform.logo}</div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{platform.description}</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {platform.status}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🚧 Integraciones en Desarrollo</h3>
            <p className="text-muted-foreground mb-4">Las siguientes integraciones están planificadas para futuras versiones:</p>
            <div className="flex flex-wrap gap-2">
              {["Moodle", "Canvas", "Blackboard", "Vue.js", "Angular", "iOS", "Android", "Flutter", "Unity"].map((platform, index) => (
                <Badge key={index} variant="outline" className="opacity-60">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Referencia de API</h2>
            <p className="text-muted-foreground">Endpoints principales para integrar con Hostreamly.com</p>
          </div>
          
          <div className="space-y-4">
            {apiEndpoints.map((endpoint, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={endpoint.method === "GET" ? "secondary" : endpoint.method === "POST" ? "default" : "destructive"}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {endpoint.endpoint}
                      </code>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {endpoint.params.map((param, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SDK Examples */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ejemplos de Código</h2>
            <p className="text-muted-foreground">Implementaciones rápidas en diferentes lenguajes y plataformas</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  JavaScript / React
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Subir video con progress
const uploadVideo = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', 'Mi Video');
  formData.append('description', 'Descripción del video');
  
  const xhr = new XMLHttpRequest();
  
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const progress = (event.loaded / event.total) * 100;
      onProgress(progress);
    }
  };
  
  return new Promise((resolve, reject) => {
    xhr.onload = () => resolve(JSON.parse(xhr.response));
    xhr.onerror = () => reject(xhr.statusText);
    
    xhr.open('POST', '/api/videos/upload');
    xhr.setRequestHeader('Authorization', 'Bearer YOUR_API_KEY');
    xhr.send(formData);
  });
};

// Reproducir video
const VideoPlayer = ({ videoId }) => {
  return (
    <div className="video-container">
      <iframe
        src={\`https://player.hostreamly.com/\${videoId}\`}
        width="100%"
        height="400"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
};`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  PHP / Laravel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<?php
// Hostreamly.com PHP SDK
use Hostreamly\\Client;

class VideoController extends Controller 
{
    private $hostreamly;
    
    public function __construct() 
    {
        $this->hostreamly = new Client([
            'api_key' => env('HOSTREAMLY_API_KEY'),
            'base_url' => 'https://api.hostreamly.com'
        ]);
    }
    
    public function upload(Request $request) 
    {
        $file = $request->file('video');
        
        $response = $this->hostreamly->videos()->upload([
            'file' => $file,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'tags' => $request->input('tags'),
            'privacy' => 'private' // public, private, unlisted
        ]);
        
        return response()->json($response);
    }
    
    public function getVideo($id) 
    {
        $video = $this->hostreamly->videos()->get($id);
        return view('video.show', compact('video'));
    }
}
?>`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Python / Django
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`# Hostreamly.com Python SDK
import hostreamly
from django.shortcuts import render
from django.http import JsonResponse

class VideoViewSet(viewsets.ModelViewSet):
    def __init__(self):
        self.client = hostreamly.Client(
            api_key=settings.HOSTREAMLY_API_KEY
        )
    
    def upload_video(self, request):
        file = request.FILES['video']
        
        response = self.client.videos.upload(
            file=file,
            title=request.POST.get('title'),
            description=request.POST.get('description'),
            webhook_url='https://mysite.com/webhook/video'
        )
        
        return JsonResponse(response)
    
    def get_analytics(self, video_id):
        analytics = self.client.analytics.get_video_stats(
            video_id=video_id,
            start_date='2024-01-01',
            end_date='2024-12-31'
        )
        
        return JsonResponse({
            'views': analytics['total_views'],
            'watch_time': analytics['total_watch_time'],
            'engagement_rate': analytics['engagement_rate']
        })`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Mobile / Flutter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Hostreamly.com Flutter SDK
import 'package:hostreamly/hostreamly.dart';

class VideoService {
  final HostreamlyClient _client = HostreamlyClient(
    apiKey: 'YOUR_API_KEY',
  );
  
  Future<UploadResponse> uploadVideo(File videoFile) async {
    try {
      final response = await _client.videos.upload(
        file: videoFile,
        title: 'Video desde móvil',
        thumbnail: await _generateThumbnail(videoFile),
        quality: VideoQuality.adaptive,
      );
      
      return response;
    } catch (e) {
      throw VideoUploadException(e.toString());
    }
  }
  
  Widget buildVideoPlayer(String videoId) {
    return HostreamlyPlayer(
      videoId: videoId,
      autoPlay: false,
      showControls: true,
      responsive: true,
      onProgress: (duration, position) {
        // Track progress for analytics
      },
    );
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Advanced Features */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Características Avanzadas</h2>
            <p className="text-muted-foreground">Potencia tu plataforma con nuestras funciones empresariales</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">DRM Protection</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Protege tu contenido premium con encriptación avanzada y control de acceso granular.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Widevine & FairPlay DRM
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Token-based authentication
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Geo-blocking avanzado
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Live Streaming</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Transmisiones en vivo de alta calidad con latencia ultra baja para eventos en tiempo real.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Latencia &lt; 2 segundos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Concurrent viewers ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Chat en tiempo real
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Globe className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">CDN Global</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Red de distribución mundial con 119+ ubicaciones para máximo rendimiento.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Edge computing optimizado
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Cache inteligente
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Failover automático
                </li>
              </ul>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DocsPage;

import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Key, Webhook, Globe, Database, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

const APIIntegrationGuide = () => {
  const integrationSteps = [
    {
      title: "Obtener Credenciales de API",
      icon: Key,
      content: [
        "Accede a tu dashboard de Hostreamly.com",
        "Ve a Configuración → API Keys",
        "Genera una nueva API Key con los permisos necesarios",
        "Guarda tu API Key de forma segura (no la compartas)"
      ]
    },
    {
      title: "Configurar Autenticación",
      icon: Database,
      content: [
        "Incluye tu API Key en el header Authorization",
        "Formato: 'Bearer YOUR_API_KEY'",
        "Todas las peticiones deben incluir este header",
        "Las API Keys expiran cada 90 días por seguridad"
      ]
    },
    {
      title: "Subir Videos via API",
      icon: Code,
      content: [
        "Usa el endpoint POST /api/v1/videos/upload",
        "Envía el archivo como FormData",
        "Incluye metadatos: título, descripción, tags",
        "Monitorea el progreso con callbacks"
      ]
    },
    {
      title: "Configurar Webhooks",
      icon: Webhook,
      content: [
        "Define URLs de callback en tu aplicación",
        "Configura eventos: upload_complete, encoding_finished",
        "Valida la firma del webhook para seguridad",
        "Implementa retry logic para fallos temporales"
      ]
    }
  ];

  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/videos/upload",
      description: "Subir un nuevo video",
      params: ["file", "title", "description", "tags", "privacy"],
      response: "{ id, status, upload_url, progress_callback }"
    },
    {
      method: "GET",
      path: "/api/v1/videos/{id}",
      description: "Obtener información de un video",
      params: ["id"],
      response: "{ id, title, status, thumbnail, embed_code, analytics }"
    },
    {
      method: "PUT",
      path: "/api/v1/videos/{id}",
      description: "Actualizar metadatos del video",
      params: ["id", "title", "description", "tags"],
      response: "{ id, updated_fields, timestamp }"
    },
    {
      method: "DELETE",
      path: "/api/v1/videos/{id}",
      description: "Eliminar un video",
      params: ["id"],
      response: "{ success, message, deleted_at }"
    },
    {
      method: "GET",
      path: "/api/v1/videos/{id}/analytics",
      description: "Obtener estadísticas del video",
      params: ["id", "start_date", "end_date"],
      response: "{ views, watch_time, engagement, geography }"
    },
    {
      method: "POST",
      path: "/api/v1/live/streams",
      description: "Crear transmisión en vivo",
      params: ["title", "description", "privacy"],
      response: "{ stream_key, rtmp_url, player_url }"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Link to="/docs" className="text-muted-foreground hover:text-primary">
                ← Volver a Documentación
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-primary rounded-lg">
                <Code className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Integración de API</h1>
                <div className="flex items-center gap-4">
                  <Badge>REST API v1</Badge>
                  <Badge variant="secondary">15 min de lectura</Badge>
                  <p className="text-muted-foreground">
                    Aprende a integrar Hostreamly.com en tu aplicación
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Introducción</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  La API REST de Hostreamly.com te permite integrar completamente nuestras funcionalidades de video hosting 
                  en tu aplicación. Con endpoints simples y bien documentados, puedes subir, gestionar y reproducir videos 
                  desde cualquier plataforma.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Globe className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-medium">Base URL</h4>
                    <code className="text-sm">https://api.hostreamly.com</code>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Key className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-medium">Autenticación</h4>
                    <span className="text-sm">Bearer Token</span>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Code className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-medium">Formato</h4>
                    <span className="text-sm">JSON</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Integration Steps */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Pasos de Integración</h2>
            <div className="space-y-6">
              {integrationSteps.map((step, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-primary rounded-lg">
                        <step.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <span className="text-lg">{index + 1}. {step.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {step.content.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                            {i + 1}
                          </div>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* API Endpoints */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Endpoints Principales</h2>
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={
                            endpoint.method === "GET" ? "secondary" : 
                            endpoint.method === "POST" ? "default" : 
                            endpoint.method === "PUT" ? "outline" : 
                            "destructive"
                          }
                          className="font-mono"
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm bg-muted px-3 py-1 rounded font-mono">
                          {endpoint.path}
                        </code>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{endpoint.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Respuesta: <code>{endpoint.response}</code>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
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

          {/* Code Examples */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Ejemplos de Código</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>JavaScript / Node.js</CardTitle>
                  <CardDescription>Ejemplo completo de integración con axios</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Hostreamly.com API Client
const axios = require('axios');

class HostreamlyAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.hostreamly.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      }
    });
  }

  async uploadVideo(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    formData.append('tags', JSON.stringify(metadata.tags));
    formData.append('privacy', metadata.privacy || 'private');

    try {
      const response = await this.client.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded * 100) / progress.total);
          console.log(\`Upload progress: \${percent}%\`);
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(\`Upload failed: \${error.response?.data?.message || error.message}\`);
    }
  }

  async getVideo(videoId) {
    const response = await this.client.get(\`/videos/\${videoId}\`);
    return response.data;
  }

  async getVideoAnalytics(videoId, startDate, endDate) {
    const response = await this.client.get(\`/videos/\${videoId}/analytics\`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  }

  async deleteVideo(videoId) {
    const response = await this.client.delete(\`/videos/\${videoId}\`);
    return response.data;
  }
}

// Uso
const api = new HostreamlyAPI('your-api-key-here');

// Subir video
const uploadResult = await api.uploadVideo(videoFile, {
  title: 'Mi Video Empresarial',
  description: 'Video de capacitación para empleados',
  tags: ['capacitacion', 'empresarial', 'recursos-humanos'],
  privacy: 'private'
});

console.log('Video uploaded:', uploadResult.id);`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Python</CardTitle>
                  <CardDescription>Cliente Python con requests y progreso de upload</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import requests
import json
from requests_toolbelt.multipart.encoder import MultipartEncoder, MultipartEncoderMonitor

class HostreamlyAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://api.hostreamly.com/v1'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def upload_video(self, file_path, metadata, progress_callback=None):
        def create_callback(encoder):
            def callback(monitor):
                progress = (monitor.bytes_read / monitor.len) * 100
                if progress_callback:
                    progress_callback(progress)
            return callback
        
        with open(file_path, 'rb') as file:
            encoder = MultipartEncoder(
                fields={
                    'file': (file_path, file, 'video/mp4'),
                    'title': metadata['title'],
                    'description': metadata['description'],
                    'tags': json.dumps(metadata.get('tags', [])),
                    'privacy': metadata.get('privacy', 'private')
                }
            )
            
            if progress_callback:
                encoder = MultipartEncoderMonitor(encoder, create_callback(encoder))
            
            response = requests.post(
                f'{self.base_url}/videos/upload',
                data=encoder,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': encoder.content_type
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f'Upload failed: {response.text}')
    
    def get_video(self, video_id):
        response = requests.get(
            f'{self.base_url}/videos/{video_id}',
            headers=self.headers
        )
        return response.json()
    
    def get_analytics(self, video_id, start_date, end_date):
        params = {
            'start_date': start_date,
            'end_date': end_date
        }
        response = requests.get(
            f'{self.base_url}/videos/{video_id}/analytics',
            headers=self.headers,
            params=params
        )
        return response.json()

# Ejemplo de uso
api = HostreamlyAPI('your-api-key-here')

def print_progress(progress):
    print(f'Upload progress: {progress:.1f}%')

result = api.upload_video(
    '/path/to/video.mp4',
    {
        'title': 'Video de Capacitación',
        'description': 'Material educativo para el equipo',
        'tags': ['capacitacion', 'educacion'],
        'privacy': 'private'
    },
    progress_callback=print_progress
)

print(f'Video uploaded successfully: {result["id"]}')`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Webhooks */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Configuración de Webhooks</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Los webhooks te permiten recibir notificaciones en tiempo real sobre eventos de tus videos.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Eventos Disponibles:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Badge variant="outline">video.upload.started</Badge>
                      <Badge variant="outline">video.upload.completed</Badge>
                      <Badge variant="outline">video.encoding.started</Badge>
                      <Badge variant="outline">video.encoding.completed</Badge>
                      <Badge variant="outline">video.encoding.failed</Badge>
                      <Badge variant="outline">video.deleted</Badge>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Ejemplo de Payload:</h4>
                    <pre className="text-sm overflow-x-auto">
{`{
  "event": "video.encoding.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "video_id": "vid_123456789",
    "title": "Mi Video",
    "status": "ready",
    "duration": 300,
    "thumbnail_url": "https://cdn.hostreamly.com/thumbs/vid_123456789.jpg",
    "embed_code": "<iframe src='...'></iframe>",
    "analytics_url": "https://api.hostreamly.com/v1/videos/vid_123456789/analytics"
  },
  "signature": "sha256=abcdef123456..."
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Rate Limits */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Límites y Consideraciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Rate Limits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• 1000 requests/hora para operaciones de lectura</li>
                    <li>• 100 uploads/hora por API key</li>
                    <li>• 10 GB máximo por archivo de video</li>
                    <li>• Retry automático con backoff exponencial</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Mejores Prácticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Usa HTTPS para todas las peticiones</li>
                    <li>• Implementa retry logic para uploads</li>
                    <li>• Cachea respuestas cuando sea posible</li>
                    <li>• Valida webhooks con signatures</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Next Steps */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">¿Listo para empezar?</h3>
            <p className="text-muted-foreground mb-6">
              Obtén tu API key y comienza a integrar Hostreamly.com en minutos
            </p>
            <div className="flex gap-4 justify-center">
              <Button>Obtener API Key</Button>
              <Link to="/docs">
                <Button variant="outline">Ver más guías</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIIntegrationGuide;

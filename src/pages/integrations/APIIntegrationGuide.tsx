import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Key, Shield, Zap, CheckCircle, Copy } from "lucide-react";
import { Link } from "react-router-dom";

const APIIntegrationGuide = () => {
  const features = [
    {
      icon: Server,
      title: "RESTful API",
      description: "API REST completa con endpoints para todas las operaciones"
    },
    {
      icon: Key,
      title: "Autenticación JWT",
      description: "Sistema seguro de autenticación con tokens JWT"
    },
    {
      icon: Shield,
      title: "Rate Limiting",
      description: "Protección contra abuso con límites de velocidad"
    },
    {
      icon: Zap,
      title: "Webhooks",
      description: "Notificaciones en tiempo real de eventos importantes"
    }
  ];

  const endpoints = [
    {
      method: "POST",
      path: "/api/auth/login",
      description: "Autenticar usuario y obtener token JWT",
      example: `{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}`
    },
    {
      method: "GET",
      path: "/api/videos",
      description: "Obtener lista de videos del usuario",
      example: `// Headers requeridos
{
  "Authorization": "Bearer JWT_TOKEN",
  "Content-Type": "application/json"
}`
    },
    {
      method: "POST",
      path: "/api/videos/upload",
      description: "Subir nuevo video",
      example: `// FormData
const formData = new FormData();
formData.append('video', videoFile);
formData.append('title', 'Mi Video');
formData.append('description', 'Descripción del video');`
    },
    {
      method: "GET",
      path: "/api/videos/:id",
      description: "Obtener información de un video específico",
      example: `// Respuesta
{
  "id": "abc123",
  "title": "Mi Video",
  "description": "Descripción",
  "duration": 120,
  "thumbnail": "https://cdn.hostreamly.com/thumb/abc123.jpg",
  "streamUrl": "https://cdn.hostreamly.com/stream/abc123/playlist.m3u8"
}`
    },
    {
      method: "PUT",
      path: "/api/videos/:id",
      description: "Actualizar información de video",
      example: `{
  "title": "Nuevo Título",
  "description": "Nueva descripción",
  "visibility": "public"
}`
    },
    {
      method: "DELETE",
      path: "/api/videos/:id",
      description: "Eliminar video",
      example: `// Respuesta
{
  "success": true,
  "message": "Video eliminado correctamente"
}`
    }
  ];

  const webhookEvents = [
    {
      event: "video.uploaded",
      description: "Se ha subido un nuevo video",
      payload: `{
  "event": "video.uploaded",
  "data": {
    "videoId": "abc123",
    "title": "Mi Video",
    "userId": "user456",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`
    },
    {
      event: "video.processed",
      description: "Video procesado y listo para reproducir",
      payload: `{
  "event": "video.processed",
  "data": {
    "videoId": "abc123",
    "status": "ready",
    "streamUrl": "https://cdn.hostreamly.com/stream/abc123/playlist.m3u8",
    "thumbnail": "https://cdn.hostreamly.com/thumb/abc123.jpg"
  }
}`
    },
    {
      event: "video.deleted",
      description: "Video eliminado del sistema",
      payload: `{
  "event": "video.deleted",
  "data": {
    "videoId": "abc123",
    "userId": "user456",
    "timestamp": "2024-01-15T11:00:00Z"
  }
}`
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
                <Server className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">API REST de Hostreamly</h1>
                <div className="flex items-center gap-4">
                  <Badge className="bg-green-100 text-green-800">Funcional</Badge>
                  <Badge variant="secondary">v2.0</Badge>
                  <p className="text-muted-foreground">
                    API completa para integrar Hostreamly en cualquier aplicación
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Features */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Características de la API</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-primary rounded-lg">
                        <feature.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Base URL */}
          <section>
            <h2 className="text-2xl font-bold mb-6">URL Base</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <code className="text-lg font-mono">https://api.hostreamly.com</code>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard('https://api.hostreamly.com')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Todas las peticiones deben incluir el header <code>Content-Type: application/json</code> y 
                  el token de autenticación en el header <code>Authorization: Bearer TOKEN</code>
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Authentication */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Autenticación</h2>
            <Card>
              <CardHeader>
                <CardTitle>Obtener Token JWT</CardTitle>
                <CardDescription>Autentica tu aplicación para acceder a la API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>POST</Badge>
                      <code>/api/auth/login</code>
                    </div>
                    <pre className="text-sm overflow-x-auto">
                      <code>{`curl -X POST https://api.hostreamly.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@ejemplo.com",
    "password": "tu-contraseña"
  }'`}</code>
                    </pre>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Respuesta Exitosa</h4>
                    <pre className="text-sm text-green-700">
                      <code>{`{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "tu-email@ejemplo.com",
    "name": "Tu Nombre"
  }
}`}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Endpoints */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Endpoints Principales</h2>
            <div className="space-y-6">
              {endpoints.map((endpoint, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Badge variant={endpoint.method === 'GET' ? 'secondary' : endpoint.method === 'POST' ? 'default' : endpoint.method === 'PUT' ? 'outline' : 'destructive'}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-base">{endpoint.path}</code>
                    </CardTitle>
                    <CardDescription>{endpoint.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{endpoint.example}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Webhooks */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Webhooks</h2>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Configuración de Webhooks</CardTitle>
                <CardDescription>Recibe notificaciones en tiempo real de eventos importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Configurar Webhook URL</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>POST</Badge>
                      <code>/api/webhooks</code>
                    </div>
                    <pre className="text-sm">
                      <code>{`{
  "url": "https://tu-app.com/webhooks/hostreamly",
  "events": ["video.uploaded", "video.processed", "video.deleted"],
  "secret": "tu-secreto-webhook"
}`}</code>
                    </pre>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Verificación de Firma</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Cada webhook incluye una firma HMAC-SHA256 en el header <code>X-Hostreamly-Signature</code>
                    </p>
                    <pre className="text-sm text-blue-700">
                      <code>{`const crypto = require('crypto');
const signature = req.headers['x-hostreamly-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

if (signature === expectedSignature) {
  // Webhook válido
}`}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Eventos Disponibles</h3>
              {webhookEvents.map((webhook, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Badge variant="secondary">{webhook.event}</Badge>
                    </CardTitle>
                    <CardDescription>{webhook.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{webhook.payload}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Error Handling */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Manejo de Errores</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">400 - Bad Request</h4>
                      <p className="text-sm text-red-700">Parámetros inválidos o faltantes</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">401 - Unauthorized</h4>
                      <p className="text-sm text-yellow-700">Token de autenticación inválido</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">403 - Forbidden</h4>
                      <p className="text-sm text-orange-700">Sin permisos para esta operación</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">404 - Not Found</h4>
                      <p className="text-sm text-gray-700">Recurso no encontrado</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">429 - Rate Limited</h4>
                      <p className="text-sm text-purple-700">Demasiadas peticiones</p>
                    </div>
                    <div className="p-4 bg-red-100 rounded-lg">
                      <h4 className="font-semibold text-red-900 mb-2">500 - Server Error</h4>
                      <p className="text-sm text-red-800">Error interno del servidor</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Formato de Error</h4>
                    <pre className="text-sm">
                      <code>{`{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email o contraseña incorrectos",
    "details": {
      "field": "email",
      "reason": "not_found"
    }
  }
}`}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Rate Limits */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Límites de Velocidad</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">1000</div>
                    <p className="text-sm text-muted-foreground">Peticiones por hora</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">100</div>
                    <p className="text-sm text-muted-foreground">Subidas por día</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">10GB</div>
                    <p className="text-sm text-muted-foreground">Límite por archivo</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Los headers de respuesta incluyen información sobre los límites: 
                    <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Support */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Server className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">Documentación Completa</h3>
                    <p className="text-muted-foreground mb-4">
                      Explora todos los endpoints y ejemplos
                    </p>
                    <Button className="w-full" asChild>
                      <Link to="/docs/api-reference">
                        Ver Referencia API
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-secondary/10 to-primary/10">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">¿Necesitas Ayuda?</h3>
                    <p className="text-muted-foreground mb-4">
                      Nuestro equipo está aquí para ayudarte
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/support">Contactar Soporte</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <a href="https://github.com/hostreamly/api-examples" target="_blank" rel="noopener noreferrer">
                          Ejemplos en GitHub
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default APIIntegrationGuide;
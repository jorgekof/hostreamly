import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Zap, BarChart3, Settings, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const CDNGuide = () => {
  const cdnLocations = [
    { region: "Norte América", cities: ["Nueva York", "Los Ángeles", "Chicago", "Toronto", "México DF"], count: 25 },
    { region: "Europa", cities: ["Londres", "Ámsterdam", "Frankfurt", "París", "Madrid"], count: 28 },
    { region: "Asia Pacífico", cities: ["Tokio", "Singapur", "Sídney", "Mumbai", "Seúl"], count: 22 },
    { region: "América Latina", cities: ["São Paulo", "Buenos Aires", "Santiago", "Bogotá", "Lima"], count: 18 },
    { region: "Medio Oriente y África", cities: ["Dubái", "Tel Aviv", "Ciudad del Cabo", "Lagos", "El Cairo"], count: 14 },
    { region: "Oceanía", cities: ["Sídney", "Melbourne", "Auckland", "Perth", "Brisbane"], count: 12 }
  ];

  const optimizationFeatures = [
    {
      icon: Zap,
      title: "Caché Inteligente",
      description: "Algoritmos adaptativos que aprenden de patrones de acceso",
      benefits: [
        "Caché automático de contenido popular",
        "Prefetch predictivo basado en Analytics",
        "Invalidación inteligente de caché",
        "Compresión adaptativa por tipo de dispositivo"
      ]
    },
    {
      icon: BarChart3,
      title: "Balanceador de Carga",
      description: "Distribución automática de tráfico para máximo rendimiento",
      benefits: [
        "Routing basado en latencia mínima",
        "Failover automático entre servidores",
        "Distribución geográfica inteligente",
        "Monitoreo en tiempo real de salud de servidores"
      ]
    },
    {
      icon: Settings,
      title: "Optimización de Video",
      description: "Entrega adaptativa según conexión y dispositivo",
      benefits: [
        "Streaming adaptativo (ABR)",
        "Múltiples resoluciones automáticas",
        "Optimización por tipo de dispositivo",
        "Compresión avanzada H.265/AV1"
      ]
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
                <Globe className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">CDN Global</h1>
                <div className="flex items-center gap-4">
                  <Badge>119+ Ubicaciones</Badge>
                  <Badge variant="secondary">8 min de lectura</Badge>
                  <p className="text-muted-foreground">
                    Optimiza la entrega de contenido a nivel mundial
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* CDN Overview */}
          <section>
            <h2 className="text-2xl font-bold mb-6">¿Qué es nuestro CDN Global?</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-6">
                  Nuestra Red de Distribución de Contenido (CDN) está diseñada específicamente para la entrega óptima 
                  de video empresarial. Con 119+ ubicaciones estratégicamente distribuidas, garantizamos que tu contenido 
                  se entregue desde el servidor más cercano a cada usuario.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4 className="font-bold text-2xl mb-2">&lt; 100ms</h4>
                    <p className="text-sm text-muted-foreground">Latencia promedio global</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                    <Zap className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4 className="font-bold text-2xl mb-2">99.9%</h4>
                    <p className="text-sm text-muted-foreground">Uptime garantizado</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4 className="font-bold text-2xl mb-2">100+</h4>
                    <p className="text-sm text-muted-foreground">Países cubiertos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Global Locations */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Ubicaciones Globales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cdnLocations.map((location, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{location.region}</span>
                      <Badge variant="secondary">{location.count} servidores</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {location.cities.map((city, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3 h-3 text-primary" />
                          {city}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Optimization Features */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Características de Optimización</h2>
            <div className="space-y-6">
              {optimizationFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-primary rounded-lg">
                        <feature.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      {feature.title}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Implementation Guide */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Configuración y Optimización</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Configuración Automática</CardTitle>
                  <CardDescription>El CDN se configura automáticamente al subir contenido</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Al subir un video, automáticamente se distribuye en el CDN
const uploadResponse = await hostreamly.videos.upload({
  file: videoFile,
  title: 'Video Empresarial',
  cdn: {
    autoDistribute: true, // Por defecto es true
    regions: ['all'], // O especifica regiones: ['na', 'eu', 'apac']
    cachePolicy: 'aggressive', // 'conservative', 'standard', 'aggressive'
    compressionLevel: 'adaptive' // Se ajusta según el dispositivo
  }
});

// El video estará disponible globalmente en ~5-10 minutos
console.log('CDN URLs:', uploadResponse.cdnUrls);
// {
//   'na': 'https://na-cdn.hostreamly.com/video-id',
        //   'eu': 'https://eu-cdn.hostreamly.com/video-id',
        //   'apac': 'https://apac-cdn.hostreamly.com/video-id'
// }`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Optimización Manual</CardTitle>
                  <CardDescription>Ajustes avanzados para casos específicos</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Configuración avanzada de CDN
const optimizeCDN = async (videoId, config) => {
  const response = await fetch(\`https://api.hostreamly.com/v1/videos/\${videoId}/cdn\`, {
    method: 'PUT',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // Configuración de caché
      caching: {
        ttl: 86400, // 24 horas en segundos
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'CDN-Cache-Control': 'max-age=2592000' // 30 días para CDN
        },
        vary: ['User-Agent', 'Accept-Encoding'] // Caché por tipo de dispositivo
      },
      
      // Configuración de compresión
      compression: {
        gzip: true,
        brotli: true, // Mejor compresión para browsers compatibles
        quality: 'adaptive', // Se ajusta según ancho de banda detectado
        formats: ['h264', 'h265', 'av1'] // Múltiples codecs
      },
      
      // Configuración de seguridad
      security: {
        hotlinkProtection: true,
        tokenAuth: true,
        geoBlocking: {
          allowedCountries: ['US', 'CA', 'MX'],
          blockedCountries: ['CN', 'RU']
        }
      },
      
      // Configuración de analytics
      analytics: {
        trackPerformance: true,
        trackUserExperience: true,
        customDimensions: {
          department: 'marketing',
          campaign: 'q1-training'
        }
      }
    })
  });
  
  return response.json();
};

// Ejemplo de uso
await optimizeCDN('video-123', {
  targetRegions: ['north-america', 'europe'],
  priority: 'performance' // 'performance', 'cost', 'balanced'
});`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Monitoreo de Performance</CardTitle>
                  <CardDescription>Herramientas para monitorear y optimizar el rendimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Obtener métricas de CDN
const getCDNMetrics = async (videoId, timeRange = '24h') => {
  const response = await fetch(\`https://api.hostreamly.com/v1/analytics/cdn\`, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`
    },
    params: {
      video_id: videoId,
      time_range: timeRange, // '1h', '24h', '7d', '30d'
      metrics: [
        'cache_hit_ratio',
        'average_latency',
        'bandwidth_usage',
        'error_rate',
        'geographic_distribution'
      ]
    }
  });
  
  const metrics = await response.json();
  
  // Ejemplo de respuesta
  console.log('CDN Performance:', {
    cacheHitRatio: metrics.cache_hit_ratio, // 95.2%
    avgLatency: metrics.average_latency, // 45ms
    totalBandwidth: metrics.bandwidth_usage, // 1.2TB
    errorRate: metrics.error_rate, // 0.01%
    topRegions: metrics.geographic_distribution
  });
  
  return metrics;
};

// Configurar alertas automáticas
const setupCDNAlerts = async () => {
  await fetch('https://api.hostreamly.com/v1/alerts/cdn', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      alerts: [
        {
          metric: 'cache_hit_ratio',
          condition: 'below',
          threshold: 90,
          action: 'email',
          recipients: ['devops@yourcompany.com']
        },
        {
          metric: 'average_latency',
          condition: 'above',
          threshold: 150, // ms
          action: 'slack',
          webhook: process.env.SLACK_WEBHOOK
        },
        {
          metric: 'error_rate',
          condition: 'above', 
          threshold: 1, // %
          action: 'pagerduty',
          urgency: 'high'
        }
      ]
    })
  });
};`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Performance Benefits */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Beneficios de Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Velocidad de Carga
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>3x más rápido</strong> que hosting tradicional</li>
                    <li>• <strong>Inicio instantáneo</strong> con precarga inteligente</li>
                    <li>• <strong>Buffering mínimo</strong> gracias a caché optimizado</li>
                    <li>• <strong>Adaptación automática</strong> a velocidad de conexión</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Reducción de Costos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>40% menos ancho de banda</strong> por compresión avanzada</li>
                    <li>• <strong>Reducción de servidores</strong> por distribución eficiente</li>
                    <li>• <strong>Menor uso de CPU</strong> en servidores origen</li>
                    <li>• <strong>Escalado automático</strong> según demanda</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Alcance Global
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Cobertura 99%</strong> de la población mundial</li>
                    <li>• <strong>Latencia uniforme</strong> en todos los continentes</li>
                    <li>• <strong>Failover automático</strong> entre regiones</li>
                    <li>• <strong>Optimización local</strong> por zona geográfica</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Experiencia de Usuario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Calidad adaptativa</strong> según dispositivo</li>
                    <li>• <strong>Carga progresiva</strong> para videos largos</li>
                    <li>• <strong>Compatibilidad universal</strong> con todos los browsers</li>
                    <li>• <strong>Optimización móvil</strong> automática</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Best Practices */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Mejores Prácticas</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium mb-3">Configuración Óptima</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Usa configuración 'adaptive' para videos corporativos</li>
                      <li>• Habilita todas las regiones para audiencia global</li>
                      <li>• Configura TTL largo (24h+) para contenido estático</li>
                      <li>• Usa compresión 'aggressive' para entrenamientos largos</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Monitoreo Continuo</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Revisa métricas de cache hit ratio semanalmente</li>
                      <li>• Configura alertas para latencia &gt; 150ms</li>
                      <li>• Monitorea distribución geográfica de accesos</li>
                      <li>• Analiza patrones de uso para optimizar caché</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Support */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">¿Necesitas optimización personalizada?</h3>
            <p className="text-muted-foreground mb-6">
              Nuestro equipo puede ayudarte a configurar el CDN específicamente para tu caso de uso
            </p>
            <div className="flex gap-4 justify-center">
              <Button>Consulta Gratuita</Button>
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

export default CDNGuide;

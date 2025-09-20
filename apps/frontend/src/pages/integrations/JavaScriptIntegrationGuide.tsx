import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Zap, Smartphone, Globe, CheckCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const JavaScriptIntegrationGuide = () => {
  const features = [
    {
      icon: Code,
      title: "JavaScript Vanilla",
      description: "Integración simple sin dependencias adicionales"
    },
    {
      icon: Zap,
      title: "React Components",
      description: "Componentes listos para usar en aplicaciones React"
    },
    {
      icon: Smartphone,
      title: "Responsive",
      description: "Adaptación automática a diferentes tamaños de pantalla"
    },
    {
      icon: Globe,
      title: "Cross-Browser",
      description: "Compatible con todos los navegadores modernos"
    }
  ];

  const methods = [
    {
      title: "Iframe Embed",
      description: "La forma más simple de integrar videos",
      code: `<!-- Iframe básico -->
<iframe 
  src="https://api.hostreamly.com/embed/player/VIDEO_ID" 
  width="800" 
  height="450" 
  frameborder="0" 
  allowfullscreen
  allow="autoplay; encrypted-media">
</iframe>

<!-- Iframe responsivo -->
<div class="hostreamly-responsive">
  <iframe 
    src="https://api.hostreamly.com/embed/player/VIDEO_ID?controls=1&responsive=1" 
    frameborder="0" 
    allowfullscreen
    allow="autoplay; encrypted-media">
  </iframe>
</div>

<style>
.hostreamly-responsive {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
}

.hostreamly-responsive iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>`
    },
    {
      title: "JavaScript SDK",
      description: "Control programático completo del reproductor",
      code: `// Incluir el SDK
<script src="https://cdn.hostreamly.com/js/hostreamly-player.min.js"></script>

// Inicializar reproductor
const player = new HostreamlyPlayer({
  container: '#video-container',
  videoId: 'VIDEO_ID',
  width: 800,
  height: 450,
  autoplay: false,
  controls: true,
  responsive: true,
  theme: 'dark'
});

// Event listeners
player.on('ready', () => {
  console.log('Player is ready');
});

player.on('play', () => {
  console.log('Video started playing');
});

player.on('pause', () => {
  console.log('Video paused');
});

player.on('ended', () => {
  console.log('Video ended');
});

// Control methods
player.play();
player.pause();
player.setVolume(0.5);
player.seekTo(30); // seconds`
    },
    {
      title: "React Component",
      description: "Componente React reutilizable",
      code: `import React, { useEffect, useRef, useState } from 'react';

interface HostreamlyPlayerProps {
  videoId: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  controls?: boolean;
  responsive?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const HostreamlyPlayer: React.FC<HostreamlyPlayerProps> = ({
  videoId,
  width = '100%',
  height = 450,
  autoplay = false,
  controls = true,
  responsive = true,
  onReady,
  onPlay,
  onPause,
  onEnded
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    if (containerRef.current && window.HostreamlyPlayer) {
      const playerInstance = new window.HostreamlyPlayer({
        container: containerRef.current,
        videoId,
        width,
        height,
        autoplay,
        controls,
        responsive
      });

      // Event listeners
      if (onReady) playerInstance.on('ready', onReady);
      if (onPlay) playerInstance.on('play', onPlay);
      if (onPause) playerInstance.on('pause', onPause);
      if (onEnded) playerInstance.on('ended', onEnded);

      setPlayer(playerInstance);

      return () => {
        playerInstance.destroy();
      };
    }
  }, [videoId, width, height, autoplay, controls, responsive]);

  return <div ref={containerRef} className="hostreamly-player" />;
};

export default HostreamlyPlayer;

// Uso del componente
<HostreamlyPlayer
  videoId="abc123"
  responsive={true}
  onReady={() => console.log('Ready!')}
  onPlay={() => console.log('Playing!')}
/>`
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
                <h1 className="text-4xl font-bold mb-2">Integración JavaScript & React</h1>
                <div className="flex items-center gap-4">
                  <Badge className="bg-green-100 text-green-800">Funcional</Badge>
                  <Badge variant="secondary">SDK Disponible</Badge>
                  <p className="text-muted-foreground">
                    Integra videos de Hostreamly en aplicaciones web y React
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
            <h2 className="text-2xl font-bold mb-6">Características Principales</h2>
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

          {/* Integration Methods */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Métodos de Integración</h2>
            <div className="space-y-8">
              {methods.map((method, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{method.title}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{method.code}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* API Reference */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Referencia de API</h2>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Configuración del Reproductor</CardTitle>
                <CardDescription>Opciones disponibles para personalizar el reproductor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Parámetro</th>
                        <th className="text-left p-2 font-semibold">Tipo</th>
                        <th className="text-left p-2 font-semibold">Default</th>
                        <th className="text-left p-2 font-semibold">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 font-mono">videoId</td>
                        <td className="p-2">string</td>
                        <td className="p-2">-</td>
                        <td className="p-2">ID único del video (requerido)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-mono">width</td>
                        <td className="p-2">number|string</td>
                        <td className="p-2">800</td>
                        <td className="p-2">Ancho del reproductor</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-mono">height</td>
                        <td className="p-2">number|string</td>
                        <td className="p-2">450</td>
                        <td className="p-2">Alto del reproductor</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-mono">autoplay</td>
                        <td className="p-2">boolean</td>
                        <td className="p-2">false</td>
                        <td className="p-2">Reproducir automáticamente</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-mono">controls</td>
                        <td className="p-2">boolean</td>
                        <td className="p-2">true</td>
                        <td className="p-2">Mostrar controles del reproductor</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-mono">responsive</td>
                        <td className="p-2">boolean</td>
                        <td className="p-2">false</td>
                        <td className="p-2">Adaptación responsiva</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-mono">muted</td>
                        <td className="p-2">boolean</td>
                        <td className="p-2">false</td>
                        <td className="p-2">Iniciar sin sonido</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-mono">loop</td>
                        <td className="p-2">boolean</td>
                        <td className="p-2">false</td>
                        <td className="p-2">Reproducir en bucle</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-mono">theme</td>
                        <td className="p-2">string</td>
                        <td className="p-2">'light'</td>
                        <td className="p-2">Tema del reproductor ('light'|'dark')</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos del Reproductor</CardTitle>
                <CardDescription>Funciones disponibles para controlar la reproducción</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-sm font-semibold">play()</code>
                      <p className="text-xs text-muted-foreground mt-1">Iniciar reproducción</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-sm font-semibold">pause()</code>
                      <p className="text-xs text-muted-foreground mt-1">Pausar reproducción</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-sm font-semibold">stop()</code>
                      <p className="text-xs text-muted-foreground mt-1">Detener reproducción</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-sm font-semibold">seekTo(seconds)</code>
                      <p className="text-xs text-muted-foreground mt-1">Saltar a tiempo específico</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-sm font-semibold">setVolume(level)</code>
                      <p className="text-xs text-muted-foreground mt-1">Ajustar volumen (0-1)</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-sm font-semibold">mute()</code>
                      <p className="text-xs text-muted-foreground mt-1">Silenciar audio</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-sm font-semibold">unmute()</code>
                      <p className="text-xs text-muted-foreground mt-1">Activar audio</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-sm font-semibold">destroy()</code>
                      <p className="text-xs text-muted-foreground mt-1">Destruir instancia</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Events */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Eventos Disponibles</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary">ready</Badge>
                      <span className="text-sm">Reproductor listo</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary">play</Badge>
                      <span className="text-sm">Reproducción iniciada</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary">pause</Badge>
                      <span className="text-sm">Reproducción pausada</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary">ended</Badge>
                      <span className="text-sm">Reproducción terminada</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary">timeupdate</Badge>
                      <span className="text-sm">Tiempo actualizado</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary">volumechange</Badge>
                      <span className="text-sm">Volumen cambiado</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary">fullscreen</Badge>
                      <span className="text-sm">Pantalla completa</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="secondary">error</Badge>
                      <span className="text-sm">Error de reproducción</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Requirements */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Requisitos</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Navegadores Soportados
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Chrome 60+</li>
                      <li>• Firefox 55+</li>
                      <li>• Safari 12+</li>
                      <li>• Edge 79+</li>
                      <li>• iOS Safari 12+</li>
                      <li>• Android Chrome 60+</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Tecnologías
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• JavaScript ES6+</li>
                      <li>• React 16.8+ (para componentes)</li>
                      <li>• TypeScript (opcional)</li>
                      <li>• Conexión HTTPS (recomendado)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Resources */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Code className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">SDK JavaScript</h3>
                    <p className="text-muted-foreground mb-4">
                      Descarga el SDK completo con ejemplos
                    </p>
                    <Button className="w-full" asChild>
                      <a href="https://cdn.hostreamly.com/js/hostreamly-player.min.js" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Descargar SDK
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-secondary/10 to-primary/10">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">¿Necesitas Ayuda?</h3>
                    <p className="text-muted-foreground mb-4">
                      Documentación y soporte técnico
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/support">Contactar Soporte</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <a href="https://github.com/hostreamly/javascript-sdk" target="_blank" rel="noopener noreferrer">
                          Ver en GitHub
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

export default JavaScriptIntegrationGuide;
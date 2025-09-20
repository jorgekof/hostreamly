import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PlayerDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Demo del Reproductor
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experimenta nuestro reproductor avanzado con todas las funcionalidades profesionales
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              title="Video Demo Profesional"
              watermark={{
                src: "/placeholder.svg",
                position: "bottom-right",
                opacity: 0.7
              }}
              analytics={true}
              onTimeUpdate={(currentTime, duration) => {}}
              onPlay={() => {}}
              onPause={() => {}}
            />

            {/* Features Demo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">🎯 Características Destacadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Codificación Just-In-Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Calidad adaptativa automática</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Watermark personalizable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Controles personalizables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Analytics en tiempo real</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">⚡ Controles Avanzados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Velocidad de reproducción variable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Saltar 10s adelante/atrás</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Subtítulos opcionales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Pantalla completa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Control de volumen</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Analytics en Vivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Vistas actuales:</span>
                    <span className="font-bold text-primary">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tiempo promedio:</span>
                    <span className="font-bold text-green-500">3:42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Retención:</span>
                    <span className="font-bold text-orange-500">78%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Dispositivos móviles:</span>
                    <span className="font-bold text-blue-500">64%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🌍 CDN Global</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Latencia promedio:</span>
                    <span className="font-bold text-green-500">23ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Ubicaciones CDN:</span>
                    <span className="font-bold text-primary">180+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime:</span>
                    <span className="font-bold text-green-500">99.99%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cacheo inteligente:</span>
                    <span className="font-bold text-orange-500">Activo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔧 Configuraciones Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Watermark:</p>
                  <p className="text-xs text-muted-foreground">Posición: Inferior derecha</p>
                  <p className="text-xs text-muted-foreground">Opacidad: 70%</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Calidad:</p>
                  <p className="text-xs text-muted-foreground">Auto (1080p disponible)</p>
                  <p className="text-xs text-muted-foreground">Codificación: Premium</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Seguridad:</p>
                  <p className="text-xs text-muted-foreground">DRM: Habilitado</p>
                  <p className="text-xs text-muted-foreground">Geobloqueo: Configurado</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Te gusta lo que ves? Comienza tu prueba gratuita hoy mismo.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:shadow-glow transition-all">
              Comenzar Prueba Gratis
            </button>
            <button className="border border-primary text-primary px-8 py-3 rounded-lg font-medium hover:bg-primary/5 transition-all">
              Ver Más Demos
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default PlayerDemo;

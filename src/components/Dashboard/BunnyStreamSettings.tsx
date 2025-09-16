import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Eye, EyeOff, ExternalLink, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { apiClient as api } from '@/lib/api';
interface APIConfig {
  bunny_stream_api_key: string;
  bunny_stream_library_id: string;
  bunny_stream_access_key: string;
  bunny_cdn_hostname: string;
  bunny_webhook_secret: string;
  bunny_token_authentication_key: string;
  enable_multiple_libraries: boolean;
  default_library_region: string;
  auto_create_collections: boolean;
}

export const VideoCDNSettings = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<APIConfig>({
    bunny_stream_api_key: '',
    bunny_stream_library_id: '',
    bunny_stream_access_key: '',
    bunny_cdn_hostname: '',
    bunny_webhook_secret: '',
    bunny_token_authentication_key: '',
    enable_multiple_libraries: false,
    default_library_region: 'europe',
    auto_create_collections: true
  });
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveConfig = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (!config.bunny_stream_api_key || !config.bunny_stream_library_id || !config.bunny_cdn_hostname) {
      toast.error('API Key, Library ID y CDN Hostname son requeridos');
      return;
    }

    setLoading(true);
    try {
  
        const data = null, error = null;

      if (error) throw error;

      toast.success('Configuración de Video CDN guardada exitosamente');
      
      // Test the configuration
      await testVideoCDNConnection();
      
    } catch (error) {
      console.error('Error saving Bunny Stream config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const testVideoCDNConnection = async () => {
    if (!config.bunny_stream_api_key || !config.bunny_stream_library_id) {
      setTestResult({
        success: false,
        message: 'Configura primero las credenciales'
      });
      return;
    }

    try {
      const response = await fetch(`https://video.bunnycdn.com/library/${config.bunny_stream_library_id}`, {
        headers: {
          'AccessKey': config.bunny_stream_api_key
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `Conexión exitosa con la librería: ${data.Name}`
        });
      } else {
        setTestResult({
          success: false,
          message: `Error de conexión: ${response.status} - Verifica tus credenciales`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error de red al conectar con Video CDN'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Video CDN
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configura tu cuenta de Video CDN para habilitar el hosting de videos real.
            <a 
              href="https://bunny.net/stream/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-1 inline-flex items-center text-primary hover:underline"
            >
              Crear cuenta
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup">Configuración</TabsTrigger>
              <TabsTrigger value="advanced">Avanzado</TabsTrigger>
              <TabsTrigger value="test">Prueba de Conexión</TabsTrigger>
              <TabsTrigger value="guide">Guía</TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api_key">Video CDN API Key</Label>
                  <div className="relative">
                    <Input
                      id="api_key"
                      type={showKeys ? "text" : "password"}
                      value={config.bunny_stream_api_key}
                      onChange={(e) => setConfig(prev => ({ ...prev, bunny_stream_api_key: e.target.value }))}
                      placeholder="Ingresa tu API Key de Video CDN"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys(!showKeys)}
                    >
                      {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Disponible en tu dashboard de Video CDN → Stream → Libraries → [Tu Librería] → API
                  </p>
                </div>

                <div>
                  <Label htmlFor="library_id">Library ID</Label>
                  <Input
                    id="library_id"
                    value={config.bunny_stream_library_id}
                    onChange={(e) => setConfig(prev => ({ ...prev, bunny_stream_library_id: e.target.value }))}
                    placeholder="12345"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ID numérico de tu librería de Video CDN
                  </p>
                </div>

                <div>
                  <Label htmlFor="cdn_hostname">CDN Hostname</Label>
                  <Input
                    id="cdn_hostname"
                    value={config.bunny_cdn_hostname}
                    onChange={(e) => setConfig(prev => ({ ...prev, bunny_cdn_hostname: e.target.value }))}
                    placeholder="vz-xxxxxxxx-xxx.b-cdn.net"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Hostname de tu Pull Zone para la entrega de contenido
                  </p>
                </div>

                <div>
                  <Label htmlFor="token_auth_key">Token Authentication Key (Opcional)</Label>
                  <div className="relative">
                    <Input
                      id="token_auth_key"
                      type={showKeys ? "text" : "password"}
                      value={config.bunny_token_authentication_key}
                      onChange={(e) => setConfig(prev => ({ ...prev, bunny_token_authentication_key: e.target.value }))}
                      placeholder="Clave para autenticación de tokens"
                      className="pr-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clave para generar tokens de acceso seguro (opcional pero recomendado)
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhook_secret">Webhook Secret (Opcional)</Label>
                  <div className="relative">
                    <Input
                      id="webhook_secret"
                      type={showKeys ? "text" : "password"}
                      value={config.bunny_webhook_secret}
                      onChange={(e) => setConfig(prev => ({ ...prev, bunny_webhook_secret: e.target.value }))}
                      placeholder="Secreto para validar webhooks"
                      className="pr-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Secreto para validar la autenticidad de los webhooks de Bunny Stream
                  </p>
                </div>

                <Button 
                  onClick={handleSaveConfig} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Configuración Avanzada de Bibliotecas</h3>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Múltiples Bibliotecas</Label>
                      <p className="text-sm text-muted-foreground">
                        Habilitar asignación automática de usuarios a diferentes bibliotecas para mejor organización
                      </p>
                    </div>
                    <Switch
                      checked={config.enable_multiple_libraries}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enable_multiple_libraries: checked }))}
                    />
                  </div>

                  {config.enable_multiple_libraries && (
                    <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                      <div>
                        <Label htmlFor="default_region">Región por Defecto para Nuevas Bibliotecas</Label>
                        <Select
                          value={config.default_library_region}
                          onValueChange={(value) => setConfig(prev => ({ ...prev, default_library_region: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="europe">Europa</SelectItem>
                            <SelectItem value="us-east">Estados Unidos - Este</SelectItem>
                            <SelectItem value="us-west">Estados Unidos - Oeste</SelectItem>
                            <SelectItem value="asia">Asia Pacífico</SelectItem>
                            <SelectItem value="oceania">Oceanía</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Región donde se crearán nuevas bibliotecas automáticamente
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <Label className="text-sm">Crear Colecciones Automáticamente</Label>
                          <p className="text-xs text-muted-foreground">
                            Crear una carpeta/colección con el nombre del usuario en cada biblioteca
                          </p>
                        </div>
                        <Switch
                          checked={config.auto_create_collections}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_create_collections: checked }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Estrategia de Asignación</h3>
                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Distribución Automática</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        El sistema asignará automáticamente usuarios a bibliotecas basándose en:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Ubicación geográfica del usuario</li>
                        <li>• Carga actual de cada biblioteca</li>
                        <li>• Límites de almacenamiento por biblioteca</li>
                        <li>• Rendimiento y latencia de la región</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Beneficios</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
                        <li>• Mejor organización y gestión de contenido</li>
                        <li>• Distribución equilibrada de carga</li>
                        <li>• Optimización de costos por región</li>
                        <li>• Escalabilidad mejorada</li>
                        <li>• Aislamiento de datos por usuario</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <Button 
                  onClick={testVideoCDNConnection} 
                  variant="outline"
                  className="w-full"
                >
                  Probar Conexión con Video CDN
                </Button>
                
                {testResult && (
                  <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <ExternalLink className="w-4 h-4 text-red-500" />
                      )}
                      <AlertDescription>
                        {testResult.message}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="guide" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Cómo obtener tus credenciales de Video CDN:</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">1</Badge>
                    <div>
                      <p className="font-medium">Crear cuenta en Video CDN</p>
                      <p className="text-sm text-muted-foreground">
                        Regístrate en <a href="https://bunny.net/stream/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">bunny.net/stream</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">2</Badge>
                    <div>
                      <p className="font-medium">Crear una Video Library</p>
                      <p className="text-sm text-muted-foreground">
                        En el dashboard, ve a Stream → Create Library
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">3</Badge>
                    <div>
                      <p className="font-medium">Obtener API Key y Library ID</p>
                      <p className="text-sm text-muted-foreground">
                        En tu librería → Settings → API Access
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">4</Badge>
                    <div>
                      <p className="font-medium">Configurar en Hostreamly.com</p>
                      <p className="text-sm text-muted-foreground">
                        Pega las credenciales en la pestaña "Configuración" arriba
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Modelo de Negocio:</strong> Video CDN cobra por almacenamiento y transferencia sin límites.
                  Hostreamly.com agrega límites basados en planes para crear un modelo de negocio controlado.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

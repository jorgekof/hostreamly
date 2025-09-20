import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, Lock, Globe, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient as api } from '@/lib/api';
interface DRMConfig {
  enabled: boolean;
  level: 'basic' | 'standard' | 'premium';
  tokenExpiry: number; // minutes
  domainRestriction: boolean;
  allowedDomains: string[];
  geoRestriction: boolean;
  allowedCountries: string[];
  blockedCountries: string[];
  downloadPrevention: boolean;
  rightClickDisabled: boolean;
  devToolsBlocking: boolean;
  screenRecordingDetection: boolean;
  watermarkOverlay: boolean;
  sessionLimit: number;
  ipRestriction: boolean;
  maxIpsPerUser: number;
}

const defaultConfig: DRMConfig = {
  enabled: false,
  level: 'basic',
  tokenExpiry: 60,
  domainRestriction: false,
  allowedDomains: [],
  geoRestriction: false,
  allowedCountries: [],
  blockedCountries: [],
  downloadPrevention: true,
  rightClickDisabled: true,
  devToolsBlocking: false,
  screenRecordingDetection: false,
  watermarkOverlay: false,
  sessionLimit: 1,
  ipRestriction: false,
  maxIpsPerUser: 3
};

export const DRMSettings = () => {
  const [config, setConfig] = useState<DRMConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [testToken, setTestToken] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadDRMConfig();
  }, []);

  const loadDRMConfig = async () => {
    try {
    
        const data = null, error = null;

      if (data && !error) {
        setConfig({ ...defaultConfig, ...data.config });
      }
    } catch (error) {
      console.error('Error loading DRM config:', error);
    }
  };

  const saveDRMConfig = async () => {
    setLoading(true);
    try {
  
        const data = null, error = null;

      if (error) throw error;

      toast({
        title: "Configuración DRM guardada",
        description: "Los cambios se aplicarán a nuevos videos",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTestToken = async () => {
    try {


      if (error) throw error;
      setTestToken(data.token);
      
      toast({
        title: "Token DRM generado",
        description: "Token de prueba creado exitosamente",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al generar token",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const updateConfig = (key: keyof DRMConfig, value: string | boolean | string[]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addDomain = (domain: string) => {
    if (domain && !config.allowedDomains.includes(domain)) {
      updateConfig('allowedDomains', [...config.allowedDomains, domain]);
    }
  };

  const removeDomain = (domain: string) => {
    updateConfig('allowedDomains', config.allowedDomains.filter(d => d !== domain));
  };

  const getDRMLevelFeatures = (level: string) => {
    switch (level) {
      case 'basic':
        return ['Token de acceso', 'Restricción de dominio', 'Prevención de descarga'];
      case 'standard':
        return ['Todo lo básico', 'Restricción geográfica', 'Límite de sesiones', 'Bloqueo de clic derecho'];
      case 'premium':
        return ['Todo lo estándar', 'Detección de grabación', 'Bloqueo de DevTools', 'Restricción de IP', 'Marca de agua'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold">Protección DRM</h2>
            <p className="text-muted-foreground">Configura la protección de contenido para tus videos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? "Activo" : "Inactivo"}
          </Badge>
          <Button onClick={saveDRMConfig} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="access">Control de Acceso</TabsTrigger>
          <TabsTrigger value="protection">Protección</TabsTrigger>
          <TabsTrigger value="testing">Pruebas</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Habilitar DRM</Label>
                  <p className="text-sm text-muted-foreground">Activa la protección DRM para todos los videos</p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig('enabled', checked)}
                />
              </div>

              <div className="space-y-3">
                <Label>Nivel de Protección</Label>
                <Select value={config.level} onValueChange={(value) => updateConfig('level', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico - $0/mes</SelectItem>
                    <SelectItem value="standard">Estándar - $29/mes</SelectItem>
                    <SelectItem value="premium">Premium - $99/mes</SelectItem>
                  </SelectContent>
                </Select>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Características incluidas:</p>
                  <ul className="text-sm space-y-1">
                    {getDRMLevelFeatures(config.level).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Expiración de Token (minutos)</Label>
                <Input
                  type="number"
                  value={config.tokenExpiry}
                  onChange={(e) => updateConfig('tokenExpiry', parseInt(e.target.value))}
                  min="5"
                  max="1440"
                />
                <p className="text-xs text-muted-foreground">Tiempo antes de que expire el acceso al video</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Control de Acceso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Domain Restriction */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Restricción de Dominio</Label>
                    <p className="text-sm text-muted-foreground">Solo permite reproducción en dominios específicos</p>
                  </div>
                  <Switch
                    checked={config.domainRestriction}
                    onCheckedChange={(checked) => updateConfig('domainRestriction', checked)}
                  />
                </div>
                
                {config.domainRestriction && (
                  <div className="space-y-3">
                    <Label>Dominios Permitidos</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="ejemplo.com"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addDomain((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="ejemplo.com"]') as HTMLInputElement;
                          if (input?.value) {
                            addDomain(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Agregar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {config.allowedDomains.map((domain, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeDomain(domain)}>
                          {domain} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Session Limits */}
              <div className="space-y-3">
                <Label>Límite de Sesiones Simultáneas</Label>
                <Input
                  type="number"
                  value={config.sessionLimit}
                  onChange={(e) => updateConfig('sessionLimit', parseInt(e.target.value))}
                  min="1"
                  max="10"
                />
                <p className="text-xs text-muted-foreground">Número máximo de reproducciones simultáneas por usuario</p>
              </div>

              {/* IP Restriction */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Restricción de IP</Label>
                    <p className="text-sm text-muted-foreground">Limita el número de IPs por usuario</p>
                  </div>
                  <Switch
                    checked={config.ipRestriction}
                    onCheckedChange={(checked) => updateConfig('ipRestriction', checked)}
                    disabled={config.level === 'basic'}
                  />
                </div>
                
                {config.ipRestriction && config.level !== 'basic' && (
                  <div className="space-y-3">
                    <Label>Máximo IPs por Usuario</Label>
                    <Input
                      type="number"
                      value={config.maxIpsPerUser}
                      onChange={(e) => updateConfig('maxIpsPerUser', parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Protection Settings */}
        <TabsContent value="protection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Configuración de Protección
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Prevenir Descarga</Label>
                    <p className="text-sm text-muted-foreground">Bloquea la descarga directa</p>
                  </div>
                  <Switch
                    checked={config.downloadPrevention}
                    onCheckedChange={(checked) => updateConfig('downloadPrevention', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Deshabilitar Clic Derecho</Label>
                    <p className="text-sm text-muted-foreground">Previene menú contextual</p>
                  </div>
                  <Switch
                    checked={config.rightClickDisabled}
                    onCheckedChange={(checked) => updateConfig('rightClickDisabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Bloquear DevTools</Label>
                    <p className="text-sm text-muted-foreground">Detecta herramientas de desarrollo</p>
                  </div>
                  <Switch
                    checked={config.devToolsBlocking}
                    onCheckedChange={(checked) => updateConfig('devToolsBlocking', checked)}
                    disabled={config.level === 'basic'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Detección de Grabación</Label>
                    <p className="text-sm text-muted-foreground">Detecta software de grabación</p>
                  </div>
                  <Switch
                    checked={config.screenRecordingDetection}
                    onCheckedChange={(checked) => updateConfig('screenRecordingDetection', checked)}
                    disabled={config.level !== 'premium'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Marca de Agua</Label>
                    <p className="text-sm text-muted-foreground">Overlay de protección</p>
                  </div>
                  <Switch
                    checked={config.watermarkOverlay}
                    onCheckedChange={(checked) => updateConfig('watermarkOverlay', checked)}
                    disabled={config.level !== 'premium'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Pruebas de DRM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Button onClick={generateTestToken} className="w-full">
                  Generar Token de Prueba
                </Button>
                
                {testToken && (
                  <div className="space-y-3">
                    <Label>Token Generado</Label>
                    <Textarea
                      value={testToken}
                      readOnly
                      className="font-mono text-xs"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este token expira en {config.tokenExpiry} minutos
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Instrucciones de Prueba</h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Genera un token de prueba</li>
                  <li>Usa el token en tu reproductor de video</li>
                  <li>Verifica que las restricciones funcionen correctamente</li>
                  <li>Prueba desde diferentes dominios/IPs si está configurado</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

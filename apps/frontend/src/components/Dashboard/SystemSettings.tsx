import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings,
  Globe,
  Shield,
  Database,
  Zap,
  Mail,
  Bell,
  Server,
  HardDrive,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export const SystemSettings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Mi Plataforma de Video',
    siteDescription: 'Plataforma profesional de hosting de videos',
    defaultLanguage: 'es',
    timezone: 'Europe/Madrid',
    allowRegistrations: true,
    requireEmailVerification: true,
    maxFileSize: 5, // GB
    allowedFormats: ['mp4', 'mov', 'avi', 'mkv']
  });

  const [cdnSettings, setCdnSettings] = useState({
    provider: 'bunnycdn',
    primaryRegion: 'europe',
    enableGlobalCDN: true,
    compressionLevel: 'medium',
    adaptiveStreaming: true,
    hlsEnabled: true,
    dashEnabled: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    enableDRM: false,
    allowHotlinking: false,
    maxLoginAttempts: 3,
    sessionTimeout: 24, // hours
    enableCaptcha: true,
    twoFactorRequired: false
  });

  const [emailSettings, setEmailSettings] = useState({
    provider: 'sendgrid',
    fromEmail: 'noreply@miplataforma.com',
    fromName: 'Mi Plataforma',
    enableWelcomeEmails: true,
    enableNotifications: true,
    enableReports: true
  });

  const [storageSettings, setStorageSettings] = useState({
    provider: 'bunny',
    region: 'europe',
    autoCleanup: true,
    retentionDays: 365,
    enableBackups: true,
    backupFrequency: 'daily'
  });

  const systemStats = {
    totalUsers: 1247,
    totalVideos: 8934,
    totalStorage: 2.4, // TB
    monthlyBandwidth: 15.7, // TB
    uptime: 99.97,
    activeConnections: 145
  };

  const saveSettings = (category: string) => {
    toast.success(`Configuración de ${category} guardada correctamente`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Configuración del Sistema</h2>
          <p className="text-muted-foreground mt-1">
            Configuración avanzada de la plataforma
          </p>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Total</p>
                <p className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</p>
              </div>
              <Server className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Videos Total</p>
                <p className="text-2xl font-bold">{systemStats.totalVideos.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Almacenamiento</p>
                <p className="text-2xl font-bold">{systemStats.totalStorage}TB</p>
              </div>
              <HardDrive className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ancho de Banda</p>
                <p className="text-2xl font-bold">{systemStats.monthlyBandwidth}TB</p>
              </div>
              <Globe className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{systemStats.uptime}%</p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conexiones</p>
                <p className="text-2xl font-bold">{systemStats.activeConnections}</p>
              </div>
              <Activity className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="cdn">CDN & Video</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="storage">Almacenamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nombre del Sitio</Label>
                  <Input
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Idioma por Defecto</Label>
                  <Select
                    value={generalSettings.defaultLanguage}
                    onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, defaultLanguage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción del Sitio</Label>
                <Textarea
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Registros</Label>
                    <p className="text-sm text-muted-foreground">Los usuarios pueden crear cuentas nuevas</p>
                  </div>
                  <Switch
                    checked={generalSettings.allowRegistrations}
                    onCheckedChange={(checked) => 
                      setGeneralSettings(prev => ({ ...prev, allowRegistrations: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Verificación de Email</Label>
                    <p className="text-sm text-muted-foreground">Requerir verificación de email para nuevos usuarios</p>
                  </div>
                  <Switch
                    checked={generalSettings.requireEmailVerification}
                    onCheckedChange={(checked) => 
                      setGeneralSettings(prev => ({ ...prev, requireEmailVerification: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tamaño Máximo de Archivo (GB)</Label>
                <Input
                  type="number"
                  value={generalSettings.maxFileSize}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                />
              </div>

              <Button onClick={() => saveSettings('general')}>
                Guardar Configuración General
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cdn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configuración de CDN y Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Proveedor de CDN</Label>
                  <Select
                    value={cdnSettings.provider}
                    onValueChange={(value) => setCdnSettings(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bunnycdn">Bunny CDN</SelectItem>
                      <SelectItem value="cloudflare">Cloudflare</SelectItem>
                      <SelectItem value="aws">AWS CloudFront</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Región Primaria</Label>
                  <Select
                    value={cdnSettings.primaryRegion}
                    onValueChange={(value) => setCdnSettings(prev => ({ ...prev, primaryRegion: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe">Europa</SelectItem>
                      <SelectItem value="us-east">Estados Unidos - Este</SelectItem>
                      <SelectItem value="us-west">Estados Unidos - Oeste</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>CDN Global</Label>
                    <p className="text-sm text-muted-foreground">Distribuir contenido globalmente</p>
                  </div>
                  <Switch
                    checked={cdnSettings.enableGlobalCDN}
                    onCheckedChange={(checked) => 
                      setCdnSettings(prev => ({ ...prev, enableGlobalCDN: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Streaming Adaptativo</Label>
                    <p className="text-sm text-muted-foreground">Ajustar calidad según conexión</p>
                  </div>
                  <Switch
                    checked={cdnSettings.adaptiveStreaming}
                    onCheckedChange={(checked) => 
                      setCdnSettings(prev => ({ ...prev, adaptiveStreaming: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>HLS Habilitado</Label>
                    <p className="text-sm text-muted-foreground">HTTP Live Streaming para mejor compatibilidad</p>
                  </div>
                  <Switch
                    checked={cdnSettings.hlsEnabled}
                    onCheckedChange={(checked) => 
                      setCdnSettings(prev => ({ ...prev, hlsEnabled: checked }))
                    }
                  />
                </div>
              </div>

              <Button onClick={() => saveSettings('CDN')}>
                Guardar Configuración de CDN
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configuración de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Protección DRM</Label>
                    <p className="text-sm text-muted-foreground">Activar DRM para todos los videos</p>
                  </div>
                  <Switch
                    checked={securitySettings.enableDRM}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, enableDRM: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Hotlinking</Label>
                    <p className="text-sm text-muted-foreground">Permitir embeds desde otros dominios</p>
                  </div>
                  <Switch
                    checked={securitySettings.allowHotlinking}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, allowHotlinking: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>2FA Obligatorio</Label>
                    <p className="text-sm text-muted-foreground">Requerir autenticación de dos factores</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorRequired}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, twoFactorRequired: checked }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Máximo Intentos de Login</Label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Timeout de Sesión (horas)</Label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Button onClick={() => saveSettings('seguridad')}>
                Guardar Configuración de Seguridad
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Configuración de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Proveedor de Email</Label>
                  <Select
                    value={emailSettings.provider}
                    onValueChange={(value) => setEmailSettings(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="aws-ses">AWS SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Email Remitente</Label>
                  <Input
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Emails de Bienvenida</Label>
                    <p className="text-sm text-muted-foreground">Enviar email de bienvenida a nuevos usuarios</p>
                  </div>
                  <Switch
                    checked={emailSettings.enableWelcomeEmails}
                    onCheckedChange={(checked) => 
                      setEmailSettings(prev => ({ ...prev, enableWelcomeEmails: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reportes por Email</Label>
                    <p className="text-sm text-muted-foreground">Enviar reportes semanales automáticamente</p>
                  </div>
                  <Switch
                    checked={emailSettings.enableReports}
                    onCheckedChange={(checked) => 
                      setEmailSettings(prev => ({ ...prev, enableReports: checked }))
                    }
                  />
                </div>
              </div>

              <Button onClick={() => saveSettings('email')}>
                Guardar Configuración de Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Configuración de Almacenamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Proveedor de Almacenamiento</Label>
                  <Select
                    value={storageSettings.provider}
                    onValueChange={(value) => setStorageSettings(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bunny">Bunny Storage</SelectItem>
                      <SelectItem value="aws-s3">AWS S3</SelectItem>
                      <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frecuencia de Backup</Label>
                  <Select
                    value={storageSettings.backupFrequency}
                    onValueChange={(value) => setStorageSettings(prev => ({ ...prev, backupFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Limpieza Automática</Label>
                    <p className="text-sm text-muted-foreground">Eliminar archivos temporales automáticamente</p>
                  </div>
                  <Switch
                    checked={storageSettings.autoCleanup}
                    onCheckedChange={(checked) => 
                      setStorageSettings(prev => ({ ...prev, autoCleanup: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backups Habilitados</Label>
                    <p className="text-sm text-muted-foreground">Realizar backups automáticos</p>
                  </div>
                  <Switch
                    checked={storageSettings.enableBackups}
                    onCheckedChange={(checked) => 
                      setStorageSettings(prev => ({ ...prev, enableBackups: checked }))
                    }
                  />
                </div>
              </div>

              <Button onClick={() => saveSettings('almacenamiento')}>
                Guardar Configuración de Almacenamiento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

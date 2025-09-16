import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Settings, 
  Mail, 
  Database,
  Shield,
  Globe,
  Server,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Wifi,
  Users,
  Video,
  DollarSign,
  Zap,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Download,
  Upload,
  TestTube,
  Activity,
  Lock,
  Unlock,
  Bell,
  FileText,
  Cloud,
  Smartphone,
  Monitor,
  Palette,
  Languages
} from 'lucide-react';
import { toast } from 'sonner';

interface SMTPConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'none' | 'tls' | 'ssl';
  fromEmail: string;
  fromName: string;
  testEmail: string;
}

interface APIConfig {
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
  };
  authentication: {
    jwtSecret: string;
    jwtExpiration: number;
    refreshTokenExpiration: number;
    requireEmailVerification: boolean;
    enable2FA: boolean;
  };
  webhooks: {
    enabled: boolean;
    maxRetries: number;
    timeoutSeconds: number;
  };
}

interface StorageConfig {
  provider: 's3' | 'local' | 'bunny';
  s3: {
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
    endpoint?: string;
  };
}

interface LimitsConfig {
  users: {
    maxUsers: number;
    maxStoragePerUser: number;
    maxBandwidthPerUser: number;
    maxVideosPerUser: number;
    maxVideoSize: number;
    maxVideoDuration: number;
  };
  system: {
    maxTotalStorage: number;
    maxTotalBandwidth: number;
    maxConcurrentUploads: number;
    maxConcurrentStreams: number;
  };
  api: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
  };
}

interface SecurityConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableCaptcha: boolean;
  allowedFileTypes: string[];
  maxFileSize: number;
}

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  allowedIPs: string[];
  scheduledStart?: string;
  scheduledEnd?: string;
}

interface NotificationConfig {
  email: {
    enabled: boolean;
    templates: {
      welcome: string;
      passwordReset: string;
      paymentSuccess: string;
      paymentFailed: string;
    };
  };
  push: {
    enabled: boolean;
    vapidPublicKey: string;
    vapidPrivateKey: string;
  };
  slack: {
    enabled: boolean;
    webhookUrl: string;
    channels: {
      alerts: string;
      payments: string;
      users: string;
    };
  };
}

interface AgoraConfig {
  enabled: boolean;
  appId: string;
  appCertificate: string;
  customerKey: string;
  customerSecret: string;
  recordingRegion: 'US' | 'EU' | 'AP';
  recordingVendor: number;
  recordingBucket: string;
  recordingAccessKey: string;
  recordingSecretKey: string;
}

interface AppearanceConfig {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    darkMode: boolean;
  };
  branding: {
    logo: string;
    favicon: string;
    companyName: string;
  };
  customCSS: string;
}

interface SystemConfig {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    defaultLanguage: string;
    enableRegistration: boolean;
    enableGuestAccess: boolean;
  };
  smtp: SMTPConfig;
  api: APIConfig;
  storage: StorageConfig;
  limits: LimitsConfig;
  security: SecurityConfig;
  maintenance: MaintenanceConfig;
  notifications: NotificationConfig;
  appearance: AppearanceConfig;
  agora: AgoraConfig;
}

const SystemConfiguration = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [agoraStatus, setAgoraStatus] = useState<any>(null);
  const [testingAgora, setTestingAgora] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Mock configuration data
      const mockConfig: SystemConfig = {
        general: {
          siteName: 'Hostreamly',
          siteUrl: 'https://hostreamly.com',
          adminEmail: 'admin@hostreamly.com',
          timezone: 'UTC',
          defaultLanguage: 'es',
          enableRegistration: true,
          enableGuestAccess: false
        },
        smtp: {
          enabled: true,
          host: 'smtp.gmail.com',
          port: 587,
          username: 'noreply@hostreamly.com',
          password: '••••••••••••••••',
          encryption: 'tls',
          fromEmail: 'noreply@hostreamly.com',
          fromName: 'Hostreamly',
          testEmail: ''
        },
        api: {
          rateLimit: {
            enabled: true,
            requestsPerMinute: 100,
            requestsPerHour: 1000
          },
          cors: {
            enabled: true,
            allowedOrigins: ['https://hostreamly.com', 'https://app.hostreamly.com']
          },
          authentication: {
            jwtSecret: '••••••••••••••••••••••••••••••••',
            jwtExpiration: 3600,
            refreshTokenExpiration: 604800,
            requireEmailVerification: true,
            enable2FA: false
          },
          webhooks: {
            enabled: true,
            maxRetries: 3,
            timeoutSeconds: 30
          }
        },
        storage: {
          provider: 's3',
          s3: {
            bucket: 'hostreamly-media',
            region: 'eu-west-1',
            accessKey: 'AKIA••••••••••••••••',
            secretKey: '••••••••••••••••••••••••••••••••••••••••',
            endpoint: undefined
          }
        },
        limits: {
          users: {
            maxUsers: 10000,
            maxStoragePerUser: 100,
            maxBandwidthPerUser: 500,
            maxVideosPerUser: 1000,
            maxVideoSize: 2048,
            maxVideoDuration: 180
          },
          system: {
            maxTotalStorage: 10000,
            maxTotalBandwidth: 50000,
            maxConcurrentUploads: 50,
            maxConcurrentStreams: 1000
          },
          api: {
            maxRequestsPerMinute: 1000,
            maxRequestsPerHour: 10000,
            maxRequestsPerDay: 100000
          }
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
          },
          sessionTimeout: 3600,
          maxLoginAttempts: 5,
          lockoutDuration: 900,
          enableCaptcha: true,
          allowedFileTypes: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
          maxFileSize: 2048
        },
        maintenance: {
          enabled: false,
          message: 'El sitio está en mantenimiento. Volveremos pronto.',
          allowedIPs: ['127.0.0.1'],
          scheduledStart: undefined,
          scheduledEnd: undefined
        },
        notifications: {
          email: {
            enabled: true,
            templates: {
              welcome: 'Bienvenido a Hostreamly',
              passwordReset: 'Restablecer contraseña',
              paymentSuccess: 'Pago procesado exitosamente',
              paymentFailed: 'Error en el procesamiento del pago'
            }
          },
          push: {
            enabled: false,
            vapidPublicKey: '',
            vapidPrivateKey: ''
          },
          slack: {
            enabled: false,
            webhookUrl: '',
            channels: {
              alerts: '#alerts',
              payments: '#payments',
              users: '#users'
            }
          }
        },
        appearance: {
          theme: {
            primaryColor: '#3b82f6',
            secondaryColor: '#64748b',
            accentColor: '#06b6d4',
            darkMode: false
          },
          branding: {
            logo: '/logo.png',
            favicon: '/favicon.ico',
            companyName: 'Hostreamly'
          },
          customCSS: ''
        },
        agora: {
          enabled: false,
          appId: '',
          appCertificate: '',
          customerKey: '',
          customerSecret: '',
          recordingRegion: 'US',
          recordingVendor: 2,
          recordingBucket: '',
          recordingAccessKey: '',
          recordingSecretKey: ''
        }
      };
      
      setConfig(mockConfig);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configuración guardada exitosamente');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfiguration = async () => {
    if (!config?.smtp.testEmail) {
      toast.error('Ingresa un email de prueba');
      return;
    }

    setTestingEmail(true);
    try {
      // Mock email test
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Email de prueba enviado a ${config.smtp.testEmail}`);
    } catch (error) {
      console.error('Error testing email:', error);
      toast.error('Error al enviar email de prueba');
    } finally {
      setTestingEmail(false);
    }
  };

  const loadAgoraStatus = async () => {
    try {
      const response = await fetch('/api/system-config/agora/status');
      const data = await response.json();
      setAgoraStatus(data);
    } catch (error) {
      console.error('Error loading Agora status:', error);
    }
  };

  const saveAgoraConfiguration = async () => {
    if (!config?.agora) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/system-config/agora', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config.agora),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar configuración de Agora');
      }
      
      toast.success('Configuración de Agora guardada exitosamente');
      await loadAgoraStatus();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving Agora configuration:', error);
      toast.error('Error al guardar la configuración de Agora');
    } finally {
      setSaving(false);
    }
  };

  const testAgoraConnection = async () => {
    if (!config?.agora.appId || !config?.agora.appCertificate) {
      toast.error('Configura App ID y App Certificate primero');
      return;
    }

    setTestingAgora(true);
    try {
      const response = await fetch('/api/system-config/agora/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: config.agora.appId,
          appCertificate: config.agora.appCertificate,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al probar conexión');
      }
      
      toast.success('Conexión con Agora exitosa');
    } catch (error) {
      console.error('Error testing Agora connection:', error);
      toast.error('Error al probar la conexión con Agora');
    } finally {
      setTestingAgora(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'agora') {
      loadAgoraStatus();
    }
  }, [activeTab]);

  const toggleMaintenance = async () => {
    if (!config) return;

    const newMaintenanceState = !config.maintenance.enabled;
    
    setConfig(prev => prev ? {
      ...prev,
      maintenance: {
        ...prev.maintenance,
        enabled: newMaintenanceState
      }
    } : null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success(
        newMaintenanceState 
          ? 'Modo mantenimiento activado' 
          : 'Modo mantenimiento desactivado'
      );
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      toast.error('Error al cambiar modo mantenimiento');
      
      setConfig(prev => prev ? {
        ...prev,
        maintenance: {
          ...prev.maintenance,
          enabled: !newMaintenanceState
        }
      } : null);
    }
  };

  const updateConfig = (section: keyof SystemConfig, updates: any) => {
    setConfig(prev => prev ? {
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    } : null);
    setHasUnsavedChanges(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Configuración del Sistema</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona la configuración global de la plataforma
          </p>
        </div>
        
        <div className="flex gap-2">
          {config.maintenance.enabled && (
            <Badge variant="destructive" className="mr-2">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Mantenimiento Activo
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setIsMaintenanceDialogOpen(true)}
          >
            {config.maintenance.enabled ? (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Desactivar Mantenimiento
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Activar Mantenimiento
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={loadConfiguration}
            disabled={loading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Recargar
          </Button>
          
          <Button 
            onClick={saveConfiguration}
            disabled={saving || !hasUnsavedChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              Tienes cambios sin guardar. No olvides guardar la configuración.
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="storage">Almacenamiento</TabsTrigger>
          <TabsTrigger value="limits">Límites</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="agora">Agora</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Nombre del Sitio</Label>
                  <Input
                    id="siteName"
                    value={config.general.siteName}
                    onChange={(e) => updateConfig('general', { siteName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">URL del Sitio</Label>
                  <Input
                    id="siteUrl"
                    value={config.general.siteUrl}
                    onChange={(e) => updateConfig('general', { siteUrl: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Email del Administrador</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={config.general.adminEmail}
                    onChange={(e) => updateConfig('general', { adminEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select 
                    value={config.general.timezone} 
                    onValueChange={(value) => updateConfig('general', { timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/Madrid">Madrid</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Registro de Usuarios</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que nuevos usuarios se registren en la plataforma
                    </p>
                  </div>
                  <Switch
                    checked={config.general.enableRegistration}
                    onCheckedChange={(checked) => updateConfig('general', { enableRegistration: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Acceso de Invitados</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite el acceso sin registro a contenido público
                    </p>
                  </div>
                  <Switch
                    checked={config.general.enableGuestAccess}
                    onCheckedChange={(checked) => updateConfig('general', { enableGuestAccess: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Configuración SMTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Habilitar SMTP</Label>
                  <p className="text-sm text-muted-foreground">
                    Activa el envío de emails a través de SMTP
                  </p>
                </div>
                <Switch
                  checked={config.smtp.enabled}
                  onCheckedChange={(checked) => updateConfig('smtp', { enabled: checked })}
                />
              </div>
              
              {config.smtp.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">Servidor SMTP</Label>
                      <Input
                        id="smtpHost"
                        value={config.smtp.host}
                        onChange={(e) => updateConfig('smtp', { host: e.target.value })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">Puerto</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={config.smtp.port}
                        onChange={(e) => updateConfig('smtp', { port: parseInt(e.target.value) })}
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpUsername">Usuario</Label>
                      <Input
                        id="smtpUsername"
                        value={config.smtp.username}
                        onChange={(e) => updateConfig('smtp', { username: e.target.value })}
                        placeholder="usuario@ejemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPassword">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="smtpPassword"
                          type={showSecrets.smtpPassword ? 'text' : 'password'}
                          value={config.smtp.password}
                          onChange={(e) => updateConfig('smtp', { password: e.target.value })}
                          placeholder="••••••••••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowSecrets(prev => ({ ...prev, smtpPassword: !prev.smtpPassword }))}
                        >
                          {showSecrets.smtpPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="smtpEncryption">Encriptación</Label>
                      <Select 
                        value={config.smtp.encryption} 
                        onValueChange={(value: 'none' | 'tls' | 'ssl') => updateConfig('smtp', { encryption: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="fromEmail">Email Remitente</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={config.smtp.fromEmail}
                        onChange={(e) => updateConfig('smtp', { fromEmail: e.target.value })}
                        placeholder="noreply@ejemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromName">Nombre Remitente</Label>
                      <Input
                        id="fromName"
                        value={config.smtp.fromName}
                        onChange={(e) => updateConfig('smtp', { fromName: e.target.value })}
                        placeholder="Mi Empresa"
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <Label>Probar Configuración SMTP</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="email@ejemplo.com"
                        value={config.smtp.testEmail}
                        onChange={(e) => updateConfig('smtp', { testEmail: e.target.value })}
                      />
                      <Button 
                        onClick={testEmailConfiguration}
                        disabled={testingEmail || !config.smtp.testEmail}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        {testingEmail ? 'Enviando...' : 'Probar'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Configuración API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Límites de Velocidad</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Habilitar Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Limita el número de peticiones por usuario
                    </p>
                  </div>
                  <Switch
                    checked={config.api.rateLimit.enabled}
                    onCheckedChange={(checked) => updateConfig('api', { 
                      rateLimit: { ...config.api.rateLimit, enabled: checked }
                    })}
                  />
                </div>
                
                {config.api.rateLimit.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="requestsPerMinute">Peticiones por Minuto</Label>
                      <Input
                        id="requestsPerMinute"
                        type="number"
                        value={config.api.rateLimit.requestsPerMinute}
                        onChange={(e) => updateConfig('api', { 
                          rateLimit: { ...config.api.rateLimit, requestsPerMinute: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="requestsPerHour">Peticiones por Hora</Label>
                      <Input
                        id="requestsPerHour"
                        type="number"
                        value={config.api.rateLimit.requestsPerHour}
                        onChange={(e) => updateConfig('api', { 
                          rateLimit: { ...config.api.rateLimit, requestsPerHour: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">CORS</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Habilitar CORS</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite peticiones desde otros dominios
                    </p>
                  </div>
                  <Switch
                    checked={config.api.cors.enabled}
                    onCheckedChange={(checked) => updateConfig('api', { 
                      cors: { ...config.api.cors, enabled: checked }
                    })}
                  />
                </div>
                
                {config.api.cors.enabled && (
                  <div>
                    <Label htmlFor="allowedOrigins">Orígenes Permitidos</Label>
                    <Textarea
                      id="allowedOrigins"
                      value={config.api.cors.allowedOrigins.join('\n')}
                      onChange={(e) => updateConfig('api', { 
                        cors: { 
                          ...config.api.cors, 
                          allowedOrigins: e.target.value.split('\n').filter(Boolean)
                        }
                      })}
                      placeholder="https://ejemplo.com\nhttps://app.ejemplo.com"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Configuración de Almacenamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storageProvider">Proveedor de Almacenamiento</Label>
                <Select 
                  value={config.storage.provider} 
                  onValueChange={(value: 's3' | 'local' | 'bunny') => updateConfig('storage', { provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                    <SelectItem value="bunny">Bunny Storage</SelectItem>
                    <SelectItem value="local">Almacenamiento Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {config.storage.provider === 's3' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="s3Bucket">Bucket</Label>
                      <Input
                        id="s3Bucket"
                        value={config.storage.s3.bucket}
                        onChange={(e) => updateConfig('storage', { 
                          s3: { ...config.storage.s3, bucket: e.target.value }
                        })}
                        placeholder="mi-bucket"
                      />
                    </div>
                    <div>
                      <Label htmlFor="s3Region">Región</Label>
                      <Input
                        id="s3Region"
                        value={config.storage.s3.region}
                        onChange={(e) => updateConfig('storage', { 
                          s3: { ...config.storage.s3, region: e.target.value }
                        })}
                        placeholder="us-east-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="s3AccessKey">Access Key</Label>
                      <Input
                        id="s3AccessKey"
                        value={config.storage.s3.accessKey}
                        onChange={(e) => updateConfig('storage', { 
                          s3: { ...config.storage.s3, accessKey: e.target.value }
                        })}
                        placeholder="AKIA••••••••••••••••"
                      />
                    </div>
                    <div>
                      <Label htmlFor="s3SecretKey">Secret Key</Label>
                      <div className="relative">
                        <Input
                          id="s3SecretKey"
                          type={showSecrets.s3SecretKey ? 'text' : 'password'}
                          value={config.storage.s3.secretKey}
                          onChange={(e) => updateConfig('storage', { 
                            s3: { ...config.storage.s3, secretKey: e.target.value }
                          })}
                          placeholder="••••••••••••••••••••••••••••••••••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowSecrets(prev => ({ ...prev, s3SecretKey: !prev.s3SecretKey }))}
                        >
                          {showSecrets.s3SecretKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="s3Endpoint">Endpoint Personalizado (Opcional)</Label>
                    <Input
                      id="s3Endpoint"
                      value={config.storage.s3.endpoint || ''}
                      onChange={(e) => updateConfig('storage', { 
                        s3: { ...config.storage.s3, endpoint: e.target.value || undefined }
                      })}
                      placeholder="https://s3.ejemplo.com"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Límites del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Límites por Usuario</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxStoragePerUser">Almacenamiento Máximo (GB)</Label>
                    <Input
                      id="maxStoragePerUser"
                      type="number"
                      value={config.limits.users.maxStoragePerUser}
                      onChange={(e) => updateConfig('limits', { 
                        users: { ...config.limits.users, maxStoragePerUser: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxBandwidthPerUser">Ancho de Banda Máximo (GB/mes)</Label>
                    <Input
                      id="maxBandwidthPerUser"
                      type="number"
                      value={config.limits.users.maxBandwidthPerUser}
                      onChange={(e) => updateConfig('limits', { 
                        users: { ...config.limits.users, maxBandwidthPerUser: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxVideosPerUser">Videos Máximos</Label>
                    <Input
                      id="maxVideosPerUser"
                      type="number"
                      value={config.limits.users.maxVideosPerUser}
                      onChange={(e) => updateConfig('limits', { 
                        users: { ...config.limits.users, maxVideosPerUser: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxVideoSize">Tamaño Máximo de Video (MB)</Label>
                    <Input
                      id="maxVideoSize"
                      type="number"
                      value={config.limits.users.maxVideoSize}
                      onChange={(e) => updateConfig('limits', { 
                        users: { ...config.limits.users, maxVideoSize: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxVideoDuration">Duración Máxima (minutos)</Label>
                    <Input
                      id="maxVideoDuration"
                      type="number"
                      value={config.limits.users.maxVideoDuration}
                      onChange={(e) => updateConfig('limits', { 
                        users: { ...config.limits.users, maxVideoDuration: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Límites del Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxTotalStorage">Almacenamiento Total Máximo (GB)</Label>
                    <Input
                      id="maxTotalStorage"
                      type="number"
                      value={config.limits.system.maxTotalStorage}
                      onChange={(e) => updateConfig('limits', { 
                        system: { ...config.limits.system, maxTotalStorage: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTotalBandwidth">Ancho de Banda Total Máximo (GB/mes)</Label>
                    <Input
                      id="maxTotalBandwidth"
                      type="number"
                      value={config.limits.system.maxTotalBandwidth}
                      onChange={(e) => updateConfig('limits', { 
                        system: { ...config.limits.system, maxTotalBandwidth: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxConcurrentUploads">Subidas Concurrentes Máximas</Label>
                    <Input
                      id="maxConcurrentUploads"
                      type="number"
                      value={config.limits.system.maxConcurrentUploads}
                      onChange={(e) => updateConfig('limits', { 
                        system: { ...config.limits.system, maxConcurrentUploads: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxConcurrentStreams">Streams Concurrentes Máximos</Label>
                    <Input
                      id="maxConcurrentStreams"
                      type="number"
                      value={config.limits.system.maxConcurrentStreams}
                      onChange={(e) => updateConfig('limits', { 
                        system: { ...config.limits.system, maxConcurrentStreams: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>
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
                <h4 className="font-medium">Política de Contraseñas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minPasswordLength">Longitud Mínima</Label>
                    <Input
                      id="minPasswordLength"
                      type="number"
                      value={config.security.passwordPolicy.minLength}
                      onChange={(e) => updateConfig('security', { 
                        passwordPolicy: { ...config.security.passwordPolicy, minLength: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Requerir Mayúsculas</Label>
                    <Switch
                      checked={config.security.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) => updateConfig('security', { 
                        passwordPolicy: { ...config.security.passwordPolicy, requireUppercase: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Requerir Minúsculas</Label>
                    <Switch
                      checked={config.security.passwordPolicy.requireLowercase}
                      onCheckedChange={(checked) => updateConfig('security', { 
                        passwordPolicy: { ...config.security.passwordPolicy, requireLowercase: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Requerir Números</Label>
                    <Switch
                      checked={config.security.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => updateConfig('security', { 
                        passwordPolicy: { ...config.security.passwordPolicy, requireNumbers: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Requerir Caracteres Especiales</Label>
                    <Switch
                      checked={config.security.passwordPolicy.requireSpecialChars}
                      onCheckedChange={(checked) => updateConfig('security', { 
                        passwordPolicy: { ...config.security.passwordPolicy, requireSpecialChars: checked }
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Configuración de Sesiones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Timeout de Sesión (segundos)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={config.security.sessionTimeout}
                      onChange={(e) => updateConfig('security', { sessionTimeout: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLoginAttempts">Intentos de Login Máximos</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={config.security.maxLoginAttempts}
                      onChange={(e) => updateConfig('security', { maxLoginAttempts: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lockoutDuration">Duración de Bloqueo (segundos)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={config.security.lockoutDuration}
                      onChange={(e) => updateConfig('security', { lockoutDuration: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Habilitar CAPTCHA</Label>
                    <p className="text-sm text-muted-foreground">
                      Requiere CAPTCHA después de varios intentos fallidos
                    </p>
                  </div>
                  <Switch
                    checked={config.security.enableCaptcha}
                    onCheckedChange={(checked) => updateConfig('security', { enableCaptcha: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configuración de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notificaciones por Email</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Habilitar Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Envía notificaciones automáticas por email
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.email.enabled}
                    onCheckedChange={(checked) => updateConfig('notifications', { 
                      email: { ...config.notifications.email, enabled: checked }
                    })}
                  />
                </div>
                
                {config.notifications.email.enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="welcomeTemplate">Plantilla de Bienvenida</Label>
                        <Input
                          id="welcomeTemplate"
                          value={config.notifications.email.templates.welcome}
                          onChange={(e) => updateConfig('notifications', { 
                            email: { 
                              ...config.notifications.email, 
                              templates: { 
                                ...config.notifications.email.templates, 
                                welcome: e.target.value 
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="passwordResetTemplate">Plantilla de Restablecimiento</Label>
                        <Input
                          id="passwordResetTemplate"
                          value={config.notifications.email.templates.passwordReset}
                          onChange={(e) => updateConfig('notifications', { 
                            email: { 
                              ...config.notifications.email, 
                              templates: { 
                                ...config.notifications.email.templates, 
                                passwordReset: e.target.value 
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Integración con Slack</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Habilitar Notificaciones de Slack</Label>
                    <p className="text-sm text-muted-foreground">
                      Envía alertas del sistema a Slack
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.slack.enabled}
                    onCheckedChange={(checked) => updateConfig('notifications', { 
                      slack: { ...config.notifications.slack, enabled: checked }
                    })}
                  />
                </div>
                
                {config.notifications.slack.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="slackWebhookUrl">Webhook URL de Slack</Label>
                      <Input
                        id="slackWebhookUrl"
                        value={config.notifications.slack.webhookUrl}
                        onChange={(e) => updateConfig('notifications', { 
                          slack: { ...config.notifications.slack, webhookUrl: e.target.value }
                        })}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="alertsChannel">Canal de Alertas</Label>
                        <Input
                          id="alertsChannel"
                          value={config.notifications.slack.channels.alerts}
                          onChange={(e) => updateConfig('notifications', { 
                            slack: { 
                              ...config.notifications.slack, 
                              channels: { 
                                ...config.notifications.slack.channels, 
                                alerts: e.target.value 
                              }
                            }
                          })}
                          placeholder="#alerts"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentsChannel">Canal de Pagos</Label>
                        <Input
                          id="paymentsChannel"
                          value={config.notifications.slack.channels.payments}
                          onChange={(e) => updateConfig('notifications', { 
                            slack: { 
                              ...config.notifications.slack, 
                              channels: { 
                                ...config.notifications.slack.channels, 
                                payments: e.target.value 
                              }
                            }
                          })}
                          placeholder="#payments"
                        />
                      </div>
                      <div>
                        <Label htmlFor="usersChannel">Canal de Usuarios</Label>
                        <Input
                          id="usersChannel"
                          value={config.notifications.slack.channels.users}
                          onChange={(e) => updateConfig('notifications', { 
                            slack: { 
                              ...config.notifications.slack, 
                              channels: { 
                                ...config.notifications.slack.channels, 
                                users: e.target.value 
                              }
                            }
                          })}
                          placeholder="#users"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Configuración de Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Tema</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Color Primario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={config.appearance.theme.primaryColor}
                        onChange={(e) => updateConfig('appearance', { 
                          theme: { ...config.appearance.theme, primaryColor: e.target.value }
                        })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.appearance.theme.primaryColor}
                        onChange={(e) => updateConfig('appearance', { 
                          theme: { ...config.appearance.theme, primaryColor: e.target.value }
                        })}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Color Secundario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={config.appearance.theme.secondaryColor}
                        onChange={(e) => updateConfig('appearance', { 
                          theme: { ...config.appearance.theme, secondaryColor: e.target.value }
                        })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.appearance.theme.secondaryColor}
                        onChange={(e) => updateConfig('appearance', { 
                          theme: { ...config.appearance.theme, secondaryColor: e.target.value }
                        })}
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accentColor">Color de Acento</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={config.appearance.theme.accentColor}
                        onChange={(e) => updateConfig('appearance', { 
                          theme: { ...config.appearance.theme, accentColor: e.target.value }
                        })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.appearance.theme.accentColor}
                        onChange={(e) => updateConfig('appearance', { 
                          theme: { ...config.appearance.theme, accentColor: e.target.value }
                        })}
                        placeholder="#06b6d4"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Oscuro por Defecto</Label>
                    <p className="text-sm text-muted-foreground">
                      Activa el modo oscuro como tema predeterminado
                    </p>
                  </div>
                  <Switch
                    checked={config.appearance.theme.darkMode}
                    onCheckedChange={(checked) => updateConfig('appearance', { 
                      theme: { ...config.appearance.theme, darkMode: checked }
                    })}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Branding</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      value={config.appearance.branding.companyName}
                      onChange={(e) => updateConfig('appearance', { 
                        branding: { ...config.appearance.branding, companyName: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="logoUrl">URL del Logo</Label>
                    <Input
                      id="logoUrl"
                      value={config.appearance.branding.logo}
                      onChange={(e) => updateConfig('appearance', { 
                        branding: { ...config.appearance.branding, logo: e.target.value }
                      })}
                      placeholder="/logo.png"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">CSS Personalizado</h4>
                <div>
                  <Label htmlFor="customCSS">CSS Personalizado</Label>
                  <Textarea
                    id="customCSS"
                    value={config.appearance.customCSS}
                    onChange={(e) => updateConfig('appearance', { customCSS: e.target.value })}
                    placeholder="/* Agrega tu CSS personalizado aquí */"
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Este CSS se aplicará globalmente en toda la aplicación
                  </p>
                </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="maintenance" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Settings className="w-5 h-5" />
                 Modo Mantenimiento
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-center justify-between">
                 <div>
                   <Label>Activar Modo Mantenimiento</Label>
                   <p className="text-sm text-muted-foreground">
                     Bloquea el acceso a usuarios normales
                   </p>
                 </div>
                 <Switch
                   checked={config.maintenance.enabled}
                   onCheckedChange={toggleMaintenance}
                 />
               </div>

               {config.maintenance.enabled && (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                   <div className="flex items-center">
                     <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                     <p className="text-yellow-800 font-medium">
                       El modo mantenimiento está activo. Solo los administradores pueden acceder.
                     </p>
                   </div>
                 </div>
               )}

               <div>
                 <Label htmlFor="maintenanceMessage">Mensaje de Mantenimiento</Label>
                 <Textarea
                   id="maintenanceMessage"
                   value={config.maintenance.message}
                   onChange={(e) => updateConfig('maintenance', { message: e.target.value })}
                   placeholder="El sistema está en mantenimiento. Volveremos pronto."
                   rows={3}
                 />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="scheduledStart">Hora de Inicio (opcional)</Label>
                   <Input
                     id="scheduledStart"
                     type="datetime-local"
                     value={config.maintenance.scheduledStart || ''}
                     onChange={(e) => updateConfig('maintenance', { scheduledStart: e.target.value })}
                   />
                 </div>
                 <div>
                   <Label htmlFor="scheduledEnd">Hora de Fin (opcional)</Label>
                   <Input
                     id="scheduledEnd"
                     type="datetime-local"
                     value={config.maintenance.scheduledEnd || ''}
                     onChange={(e) => updateConfig('maintenance', { scheduledEnd: e.target.value })}
                   />
                 </div>
               </div>

               <div>
                 <Label htmlFor="allowedIPs">IPs Permitidas</Label>
                 <Textarea
                   id="allowedIPs"
                   value={config.maintenance.allowedIPs.join('\n')}
                   onChange={(e) => updateConfig('maintenance', {
                     allowedIPs: e.target.value.split('\n').filter(ip => ip.trim())
                   })}
                   placeholder="127.0.0.1\n192.168.1.100"
                   rows={3}
                 />
                 <p className="text-sm text-muted-foreground mt-1">
                   IPs que pueden acceder durante el mantenimiento (una por línea)
                 </p>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="agora">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Video className="w-5 h-5" />
                 Configuración de Agora
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-lg font-medium">Servicio de Live Streaming</h3>
                   <p className="text-sm text-muted-foreground">
                     Configurar las credenciales de Agora para transmisiones en vivo
                   </p>
                 </div>
                 <Switch
                   checked={config.agora.enabled}
                   onCheckedChange={(enabled) => updateConfig('agora', { enabled })}
                 />
               </div>

               {config.agora.enabled && (
                 <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <Label htmlFor="agoraAppId">App ID</Label>
                       <Input
                         id="agoraAppId"
                         value={config.agora.appId}
                         onChange={(e) => updateConfig('agora', { appId: e.target.value })}
                         placeholder="Ingresa tu Agora App ID"
                       />
                     </div>
                     <div>
                       <Label htmlFor="agoraAppCertificate">App Certificate</Label>
                       <Input
                         id="agoraAppCertificate"
                         type="password"
                         value={config.agora.appCertificate}
                         onChange={(e) => updateConfig('agora', { appCertificate: e.target.value })}
                         placeholder="Ingresa tu App Certificate"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <Label htmlFor="agoraCustomerKey">Customer Key</Label>
                       <Input
                         id="agoraCustomerKey"
                         value={config.agora.customerKey}
                         onChange={(e) => updateConfig('agora', { customerKey: e.target.value })}
                         placeholder="Ingresa tu Customer Key"
                       />
                     </div>
                     <div>
                       <Label htmlFor="agoraCustomerSecret">Customer Secret</Label>
                       <Input
                         id="agoraCustomerSecret"
                         type="password"
                         value={config.agora.customerSecret}
                         onChange={(e) => updateConfig('agora', { customerSecret: e.target.value })}
                         placeholder="Ingresa tu Customer Secret"
                       />
                     </div>
                   </div>

                   <Separator />

                   <div>
                     <h4 className="text-md font-medium mb-4">Configuración de Grabación</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="recordingRegion">Región de Grabación</Label>
                         <Select
                           value={config.agora.recordingRegion}
                           onValueChange={(value) => updateConfig('agora', { recordingRegion: value })}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Selecciona una región" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="US">US (Estados Unidos)</SelectItem>
                             <SelectItem value="EU">EU (Europa)</SelectItem>
                             <SelectItem value="AP">AP (Asia Pacífico)</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <Label htmlFor="recordingVendor">Proveedor de Almacenamiento</Label>
                         <Select
                           value={config.agora.recordingVendor.toString()}
                           onValueChange={(value) => updateConfig('agora', { recordingVendor: parseInt(value) })}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Selecciona un proveedor" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="1">Qiniu Cloud</SelectItem>
                             <SelectItem value="2">Amazon S3</SelectItem>
                             <SelectItem value="3">Alibaba Cloud OSS</SelectItem>
                             <SelectItem value="5">Microsoft Azure</SelectItem>
                             <SelectItem value="6">Google Cloud Storage</SelectItem>
                             <SelectItem value="7">Huawei Cloud OBS</SelectItem>
                             <SelectItem value="8">Baidu Cloud BOS</SelectItem>
                             <SelectItem value="9">Tencent Cloud COS</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                       <div>
                         <Label htmlFor="recordingBucket">Bucket/Container</Label>
                         <Input
                           id="recordingBucket"
                           value={config.agora.recordingBucket}
                           onChange={(e) => updateConfig('agora', { recordingBucket: e.target.value })}
                           placeholder="Nombre del bucket"
                         />
                       </div>
                       <div>
                         <Label htmlFor="recordingAccessKey">Access Key</Label>
                         <Input
                           id="recordingAccessKey"
                           value={config.agora.recordingAccessKey}
                           onChange={(e) => updateConfig('agora', { recordingAccessKey: e.target.value })}
                           placeholder="Access Key ID"
                         />
                       </div>
                     </div>

                     <div className="mt-4">
                       <Label htmlFor="recordingSecretKey">Secret Key</Label>
                       <Input
                         id="recordingSecretKey"
                         type="password"
                         value={config.agora.recordingSecretKey}
                         onChange={(e) => updateConfig('agora', { recordingSecretKey: e.target.value })}
                         placeholder="Secret Access Key"
                       />
                     </div>
                   </div>

                   <Separator />

                   {/* Estado de configuración */}
                   {agoraStatus && (
                     <div className="bg-muted p-4 rounded-lg">
                       <h4 className="text-md font-medium mb-2">Estado de Configuración</h4>
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           {agoraStatus.configured ? (
                             <CheckCircle className="w-4 h-4 text-green-500" />
                           ) : (
                             <XCircle className="w-4 h-4 text-red-500" />
                           )}
                           <span className="text-sm">
                             {agoraStatus.configured ? 'Configuración completa' : 'Configuración incompleta'}
                           </span>
                         </div>
                         {agoraStatus.limits && (
                           <div className="text-sm text-muted-foreground">
                             <p>Límites del plan empresarial:</p>
                             <ul className="list-disc list-inside ml-4">
                               <li>Streams concurrentes: {agoraStatus.limits.concurrentStreams}</li>
                               <li>Espectadores por stream: {agoraStatus.limits.viewersPerStream}</li>
                               <li>Horas mensuales: {agoraStatus.limits.monthlyHours}</li>
                             </ul>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                   {/* Botones de acción */}
                   <div className="flex gap-3">
                     <Button
                       onClick={saveAgoraConfiguration}
                       disabled={saving}
                       className="flex items-center gap-2"
                     >
                       <Save className="w-4 h-4" />
                       {saving ? 'Guardando...' : 'Guardar Configuración'}
                     </Button>
                     <Button
                       variant="outline"
                       onClick={testAgoraConnection}
                       disabled={testingAgora || !config.agora.appId || !config.agora.appCertificate}
                       className="flex items-center gap-2"
                     >
                       <TestTube className="w-4 h-4" />
                       {testingAgora ? 'Probando...' : 'Probar Conexión'}
                     </Button>
                   </div>

                   {/* Documentación */}
                   <div className="bg-blue-50 p-4 rounded-lg">
                     <h4 className="text-md font-medium mb-2 flex items-center gap-2">
                       <FileText className="w-4 h-4" />
                       Documentación
                     </h4>
                     <div className="text-sm text-blue-700 space-y-1">
                       <p>• <strong>App ID:</strong> Identificador único de tu aplicación Agora</p>
                       <p>• <strong>App Certificate:</strong> Certificado para generar tokens seguros</p>
                       <p>• <strong>Customer Key/Secret:</strong> Credenciales para APIs RESTful</p>
                       <p>• <strong>Grabación:</strong> Configuración para almacenar streams en la nube</p>
                     </div>
                   </div>

                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                     <div className="flex items-start">
                       <Video className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                       <div>
                         <p className="text-blue-800 font-medium mb-1">
                           Configuración de Live Streaming
                         </p>
                         <p className="text-blue-700 text-sm">
                           El live streaming está disponible únicamente para usuarios con plan Empresarial.
                           Límites: 50 horas mensuales, máximo 100 espectadores simultáneos.
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>

       <AlertDialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>
               {config.maintenance.enabled ? 'Desactivar' : 'Activar'} Modo Mantenimiento
             </AlertDialogTitle>
             <AlertDialogDescription>
               {config.maintenance.enabled 
                 ? 'Esto permitirá que todos los usuarios accedan nuevamente al sistema.'
                 : 'Esto bloqueará el acceso a todos los usuarios excepto administradores y IPs permitidas.'
               }
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction onClick={toggleMaintenance}>
               {config.maintenance.enabled ? 'Desactivar' : 'Activar'}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 };

 export default SystemConfiguration;
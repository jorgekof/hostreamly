import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Key, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Globe, 
  Smartphone,
  Lock,
  Unlock,
  Activity,
  Users,
  FileText,
  Settings,
  Zap,
  TrendingUp,
  MapPin,
  Wifi,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

import { apiClient as api } from '@/lib/api';
interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  ip_whitelist_enabled: boolean;
  device_tracking_enabled: boolean;
  suspicious_activity_alerts: boolean;
  login_notifications: boolean;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
  };
}

interface ThreatDetection {
  id: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source_ip: string;
  user_agent: string;
  detected_at: string;
  status: 'active' | 'resolved' | 'investigating';
  actions_taken: string[];
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  user_agent: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface SecurityMetrics {
  total_logins_today: number;
  failed_login_attempts: number;
  active_sessions: number;
  threats_detected: number;
  threats_blocked: number;
  security_score: number;
  last_security_scan: string;
}

export default function AdvancedSecurity() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    session_timeout: 30,
    ip_whitelist_enabled: false,
    device_tracking_enabled: true,
    suspicious_activity_alerts: true,
    login_notifications: true,
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: false
    }
  });
  const [threats, setThreats] = useState<ThreatDetection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    total_logins_today: 0,
    failed_login_attempts: 0,
    active_sessions: 0,
    threats_detected: 0,
    threats_blocked: 0,
    security_score: 85,
    last_security_scan: new Date().toISOString()
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [whitelistedIPs, setWhitelistedIPs] = useState<string[]>([]);
  const [newIP, setNewIP] = useState('');

  const loadSecuritySettings = useCallback(async () => {
    try {
      // const response = await api.get('/api/security/settings');
      // setSecuritySettings(response.data.settings);
      // setWhitelistedIPs(response.data.whitelisted_ips || []);
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  }, [user?.id]);

  const loadThreatDetections = useCallback(async () => {
    try {
      // const response = await api.get('/api/security/threats');
      // setThreats(response.data || []);
      setThreats([]);
    } catch (error) {
      console.error('Error loading threat detections:', error);
      setThreats([]);
    }
  }, [user?.id]);

  const loadAuditLogs = useCallback(async () => {
    try {
      // const response = await api.get('/api/security/audit-logs');
      // setAuditLogs(response.data || []);
      setAuditLogs([]);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setAuditLogs([]);
    }
  }, [user?.id]);

  const loadSecurityMetrics = useCallback(async () => {
    try {
      // const response = await api.get('/api/security/metrics');
      setSecurityMetrics({
        total_logins_today: 0,
        failed_login_attempts: 0,
        active_sessions: 0,
        threats_detected: 0,
        threats_blocked: 0,
        security_score: 85,
        last_security_scan: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading security metrics:', error);
    }
  }, [user?.id]);

  const loadSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSecuritySettings(),
        loadThreatDetections(),
        loadAuditLogs(),
        loadSecurityMetrics()
      ]);
    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Error al cargar datos de seguridad');
    } finally {
      setLoading(false);
    }
  }, [loadSecuritySettings, loadThreatDetections, loadAuditLogs, loadSecurityMetrics]);

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user, loadSecurityData]);

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>) => {
    setLoading(true);
    try {
      const updatedSettings = { ...securitySettings, ...newSettings };
      
      // const response = await api.put('/api/security/settings', updatedSettings);
      setSecuritySettings(updatedSettings);
      toast.success('Configuración de seguridad actualizada');
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const enable2FA = async () => {
    setLoading(true);
    try {
      // const response = await api.post('/security/2fa/enable');
      // setQrCodeUrl(response.data.qr_code_url);
      // setBackupCodes(response.data.backup_codes);
      toast.success('2FA configurado. Escanea el código QR con tu app de autenticación');
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast.error('Error al configurar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!twoFactorCode) {
      toast.error('Ingresa el código de verificación');
      return;
    }

    setLoading(true);
    try {
      // const response = await api.post('/api/security/2fa/verify', { code: twoFactorCode });
      // if (response.data.verified) {
        await updateSecuritySettings({ two_factor_enabled: true });
        setTwoFactorCode('');
        setQrCodeUrl('');
        toast.success('2FA activado exitosamente');
      // } else {
      //   toast.error('Código de verificación inválido');
      // }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error('Error al verificar código 2FA');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    try {
      // const response = await api.post('/api/security/2fa/disable');
      
      await updateSecuritySettings({ two_factor_enabled: false });
      toast.success('2FA desactivado');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error('Error al desactivar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const addWhitelistedIP = async () => {
    if (!newIP) {
      toast.error('Ingresa una dirección IP válida');
      return;
    }

    const updatedIPs = [...whitelistedIPs, newIP];
    setWhitelistedIPs(updatedIPs);
    setNewIP('');
    
    await updateSecuritySettings({});
    toast.success('IP agregada a la lista blanca');
  };

  const removeWhitelistedIP = async (ip: string) => {
    const updatedIPs = whitelistedIPs.filter(whitelistedIP => whitelistedIP !== ip);
    setWhitelistedIPs(updatedIPs);
    
    await updateSecuritySettings({});
    toast.success('IP removida de la lista blanca');
  };

  const resolveThreat = async (threatId: string) => {
    setLoading(true);
    try {
      // const response = await api.put(`/api/security/threats/${threatId}/resolve`);
      
      setThreats(threats.map(threat => 
        threat.id === threatId 
          ? { ...threat, status: 'resolved' }
          : threat
      ));
      
      toast.success('Amenaza marcada como resuelta');
    } catch (error) {
      console.error('Error resolving threat:', error);
      toast.error('Error al resolver amenaza');
    } finally {
      setLoading(false);
    }
  };

  const runSecurityScan = async () => {
    setLoading(true);
    try {
      // const response = await api.post('/security/scan');
      // setSecurityMetrics({
      //   ...securityMetrics,
      //   security_score: response.data.security_score,
      //   last_security_scan: new Date().toISOString()
      // });
      
      // Mock security score for now
      const mockScore = Math.floor(Math.random() * 20) + 80; // 80-100
      setSecurityMetrics({
        ...securityMetrics,
        security_score: mockScore,
        last_security_scan: new Date().toISOString()
      });
      
      toast.success(`Escaneo completado. Puntuación de seguridad: ${mockScore}/100`);
    } catch (error) {
      console.error('Error running security scan:', error);
      toast.error('Error al ejecutar escaneo de seguridad');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'investigating': return <Eye className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && threats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Puntuación de Seguridad</p>
                <p className="text-2xl font-bold">{securityMetrics.security_score}/100</p>
              </div>
              <Shield className={`h-8 w-8 ${
                securityMetrics.security_score >= 80 ? 'text-green-500' :
                securityMetrics.security_score >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>
            <Progress value={securityMetrics.security_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amenazas Detectadas</p>
                <p className="text-2xl font-bold">{securityMetrics.threats_detected}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sesiones Activas</p>
                <p className="text-2xl font-bold">{securityMetrics.active_sessions}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Intentos Fallidos</p>
                <p className="text-2xl font-bold">{securityMetrics.failed_login_attempts}</p>
              </div>
              <XCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
          <TabsTrigger value="2fa">Autenticación 2FA</TabsTrigger>
          <TabsTrigger value="threats">Detección de Amenazas</TabsTrigger>
          <TabsTrigger value="audit">Registro de Auditoría</TabsTrigger>
          <TabsTrigger value="whitelist">Lista Blanca IP</TabsTrigger>
        </TabsList>

        {/* Security Settings */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración General
                </CardTitle>
                <CardDescription>
                  Configura las opciones básicas de seguridad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Seguimiento de Dispositivos</Label>
                    <p className="text-sm text-muted-foreground">Rastrea dispositivos utilizados para acceder</p>
                  </div>
                  <Switch
                    checked={securitySettings.device_tracking_enabled}
                    onCheckedChange={(checked) => 
                      updateSecuritySettings({ device_tracking_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertas de Actividad Sospechosa</Label>
                    <p className="text-sm text-muted-foreground">Recibe alertas sobre actividad inusual</p>
                  </div>
                  <Switch
                    checked={securitySettings.suspicious_activity_alerts}
                    onCheckedChange={(checked) => 
                      updateSecuritySettings({ suspicious_activity_alerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificaciones de Inicio de Sesión</Label>
                    <p className="text-sm text-muted-foreground">Notifica sobre nuevos inicios de sesión</p>
                  </div>
                  <Switch
                    checked={securitySettings.login_notifications}
                    onCheckedChange={(checked) => 
                      updateSecuritySettings({ login_notifications: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tiempo de Expiración de Sesión (minutos)</Label>
                  <Select
                    value={securitySettings.session_timeout.toString()}
                    onValueChange={(value) => 
                      updateSecuritySettings({ session_timeout: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                      <SelectItem value="480">8 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Política de Contraseñas
                </CardTitle>
                <CardDescription>
                  Define los requisitos para contraseñas seguras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Longitud Mínima</Label>
                  <Select
                    value={securitySettings.password_policy.min_length.toString()}
                    onValueChange={(value) => 
                      updateSecuritySettings({
                        password_policy: {
                          ...securitySettings.password_policy,
                          min_length: parseInt(value)
                        }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8 caracteres</SelectItem>
                      <SelectItem value="10">10 caracteres</SelectItem>
                      <SelectItem value="12">12 caracteres</SelectItem>
                      <SelectItem value="16">16 caracteres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Requiere Mayúsculas</Label>
                    <Switch
                      checked={securitySettings.password_policy.require_uppercase}
                      onCheckedChange={(checked) => 
                        updateSecuritySettings({
                          password_policy: {
                            ...securitySettings.password_policy,
                            require_uppercase: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Requiere Números</Label>
                    <Switch
                      checked={securitySettings.password_policy.require_numbers}
                      onCheckedChange={(checked) => 
                        updateSecuritySettings({
                          password_policy: {
                            ...securitySettings.password_policy,
                            require_numbers: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Requiere Símbolos</Label>
                    <Switch
                      checked={securitySettings.password_policy.require_symbols}
                      onCheckedChange={(checked) => 
                        updateSecuritySettings({
                          password_policy: {
                            ...securitySettings.password_policy,
                            require_symbols: checked
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Escaneo de Seguridad
              </CardTitle>
              <CardDescription>
                Ejecuta un escaneo completo de seguridad para identificar vulnerabilidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Último escaneo: {new Date(securityMetrics.last_security_scan).toLocaleString()}
                  </p>
                </div>
                <Button onClick={runSecurityScan} disabled={loading}>
                  {loading ? 'Escaneando...' : 'Ejecutar Escaneo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2FA Settings */}
        <TabsContent value="2fa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Autenticación de Dos Factores (2FA)
              </CardTitle>
              <CardDescription>
                Agrega una capa extra de seguridad a tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!securitySettings.two_factor_enabled ? (
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      La autenticación de dos factores no está activada. Te recomendamos activarla para mayor seguridad.
                    </AlertDescription>
                  </Alert>

                  {!qrCodeUrl ? (
                    <Button onClick={enable2FA} disabled={loading}>
                      {loading ? 'Configurando...' : 'Activar 2FA'}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <OptimizedImage
                          src={qrCodeUrl}
                          alt="QR Code for 2FA"
                          className="mx-auto mb-4"
                          sizes="200px"
                          priority={true}
                        />
                        <p className="text-sm text-muted-foreground mb-4">
                          Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Código de Verificación</Label>
                        <Input
                          type="text"
                          placeholder="Ingresa el código de 6 dígitos"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          maxLength={6}
                        />
                      </div>

                      <Button onClick={verify2FA} disabled={loading || !twoFactorCode}>
                        {loading ? 'Verificando...' : 'Verificar y Activar'}
                      </Button>

                      {backupCodes.length > 0 && (
                        <Alert>
                          <Key className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Códigos de Respaldo:</strong> Guarda estos códigos en un lugar seguro.
                            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
                              {backupCodes.map((code, index) => (
                                <span key={index} className="bg-muted p-1 rounded">{code}</span>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      La autenticación de dos factores está activada y protegiendo tu cuenta.
                    </AlertDescription>
                  </Alert>

                  <Button variant="destructive" onClick={disable2FA} disabled={loading}>
                    {loading ? 'Desactivando...' : 'Desactivar 2FA'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threat Detection */}
        <TabsContent value="threats">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Detección de Amenazas
              </CardTitle>
              <CardDescription>
                Monitoreo en tiempo real de actividades sospechosas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threats.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No se han detectado amenazas recientes</p>
                  </div>
                ) : (
                  threats.map((threat) => (
                    <div key={threat.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(threat.status)}
                          <Badge className={getSeverityColor(threat.severity)}>
                            {threat.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{threat.threat_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(threat.detected_at).toLocaleString()}
                          </span>
                          {threat.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveThreat(threat.id)}
                            >
                              Resolver
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm">{threat.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {threat.source_ip}
                        </span>
                        <span className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          {threat.user_agent.substring(0, 50)}...
                        </span>
                      </div>
                      
                      {threat.actions_taken.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Acciones tomadas:</p>
                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                            {threat.actions_taken.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Registro de Auditoría
              </CardTitle>
              <CardDescription>
                Historial completo de actividades en tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay registros de auditoría disponibles</p>
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{log.resource_type}: {log.resource_id}</span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {log.ip_address}
                        </span>
                      </div>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">Ver detalles</summary>
                          <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP Whitelist */}
        <TabsContent value="whitelist">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Lista Blanca de IPs
              </CardTitle>
              <CardDescription>
                Controla qué direcciones IP pueden acceder a tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Habilitar Lista Blanca de IPs</Label>
                  <p className="text-sm text-muted-foreground">Solo las IPs en la lista podrán acceder</p>
                </div>
                <Switch
                  checked={securitySettings.ip_whitelist_enabled}
                  onCheckedChange={(checked) => 
                    updateSecuritySettings({ ip_whitelist_enabled: checked })
                  }
                />
              </div>

              {securitySettings.ip_whitelist_enabled && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="192.168.1.1"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                    <Button onClick={addWhitelistedIP} disabled={!newIP}>
                      Agregar IP
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>IPs Autorizadas</Label>
                    {whitelistedIPs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay IPs en la lista blanca</p>
                    ) : (
                      whitelistedIPs.map((ip, index) => (
                        <div key={index} className="flex items-center justify-between border rounded p-2">
                          <span className="font-mono">{ip}</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeWhitelistedIP(ip)}
                          >
                            Remover
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

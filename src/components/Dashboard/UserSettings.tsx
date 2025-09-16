import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  User, 
  CreditCard,
  Users,
  Bell,
  Shield,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import { usePlanLimits } from '@/hooks/usePlanLimits';

export const UserSettings = () => {
  const { limits, usage, planName } = usePlanLimits();
  const [profile, setProfile] = useState({
    name: 'Juan Pérez',
    email: 'juan@empresa.com',
    company: 'Mi Empresa',
    website: 'https://miempresa.com',
    bio: 'Director de Marketing Digital',
    phone: '+34 600 123 456',
    language: 'es',
    timezone: 'Europe/Madrid'
  });

  const [notifications, setNotifications] = useState({
    emailReports: true,
    weeklyDigest: true,
    systemUpdates: false,
    securityAlerts: true,
    storageAlerts: true,
    marketingEmails: false
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '24h',
    allowedIPs: '',
    apiKeyRotation: 'monthly'
  });

  // Use real subscription data from usePlanLimits
  const subscription = {
    plan: planName,
    status: 'active',
    nextBilling: '2024-02-15',
    usage: {
      storage: { used: usage.storage, limit: limits.storage },
      bandwidth: { used: usage.bandwidth, limit: limits.bandwidth },
      videos: { used: usage.videos, limit: limits.videos }
    }
  };

  const [teamMembers] = useState([
    { id: '1', name: 'Ana García', email: 'ana@empresa.com', role: 'Editor', status: 'active' },
    { id: '2', name: 'Carlos López', email: 'carlos@empresa.com', role: 'Viewer', status: 'active' },
    { id: '3', name: 'María Rodríguez', email: 'maria@empresa.com', role: 'Admin', status: 'pending' }
  ]);

  const saveProfile = () => {
    toast.success('Perfil actualizado correctamente');
  };

  const saveNotifications = () => {
    toast.success('Preferencias de notificaciones guardadas');
  };

  const saveSecurity = () => {
    toast.success('Configuración de seguridad actualizada');
  };

  const generateApiKey = () => {
    toast.success('Nueva API Key generada');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Sitio web</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}
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
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button onClick={saveProfile}>
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Plan Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{subscription.plan}</h3>
                    <p className="text-muted-foreground">$99/mes</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    {subscription.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Almacenamiento</span>
                      <span>
                        {subscription.usage.storage.used.toFixed(1)}GB / {
                          subscription.usage.storage.limit === -1 ? '∞' : `${subscription.usage.storage.limit}GB`
                        }
                      </span>
                    </div>
                    {subscription.usage.storage.limit !== -1 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min((subscription.usage.storage.used / subscription.usage.storage.limit) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ancho de banda</span>
                      <span>
                        {subscription.usage.bandwidth.used.toFixed(1)}TB / {
                          subscription.usage.bandwidth.limit === -1 ? '∞' : `${subscription.usage.bandwidth.limit}TB`
                        }
                      </span>
                    </div>
                    {subscription.usage.bandwidth.limit !== -1 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((subscription.usage.bandwidth.used / subscription.usage.bandwidth.limit) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Videos</span>
                      <span>
                        {subscription.usage.videos.used} / {
                          subscription.usage.videos.limit === -1 ? '∞' : subscription.usage.videos.limit
                        }
                      </span>
                    </div>
                    {subscription.usage.videos.limit !== -1 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((subscription.usage.videos.used / subscription.usage.videos.limit) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Próxima facturación: {subscription.nextBilling}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Cambiar Plan
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Ver Facturas
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Facturación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: '2024-01-15', amount: '$99.00', status: 'Pagada' },
                    { date: '2023-12-15', amount: '$99.00', status: 'Pagada' },
                    { date: '2023-11-15', amount: '$99.00', status: 'Pagada' }
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{invoice.amount}</p>
                        <p className="text-sm text-muted-foreground">{invoice.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{invoice.status}</Badge>
                        <Button variant="ghost" size="sm">
                          Descargar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Miembros del Equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input placeholder="Email del nuevo miembro" className="flex-1" />
                <Select defaultValue="viewer">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Invitar</Button>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <Badge variant={member.status === 'active' ? 'secondary' : 'outline'}>
                        {member.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Configurar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferencias de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reportes por email</Label>
                    <p className="text-sm text-muted-foreground">Recibe reportes semanales de analytics</p>
                  </div>
                  <Switch
                    checked={notifications.emailReports}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailReports: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Resumen semanal</Label>
                    <p className="text-sm text-muted-foreground">Resumen de actividad cada lunes</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, weeklyDigest: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Actualizaciones del sistema</Label>
                    <p className="text-sm text-muted-foreground">Notificaciones sobre nuevas funciones</p>
                  </div>
                  <Switch
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, systemUpdates: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertas de seguridad</Label>
                    <p className="text-sm text-muted-foreground">Notificaciones importantes de seguridad</p>
                  </div>
                  <Switch
                    checked={notifications.securityAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, securityAlerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertas de almacenamiento</Label>
                    <p className="text-sm text-muted-foreground">Cuando se agote el almacenamiento</p>
                  </div>
                  <Switch
                    checked={notifications.storageAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, storageAlerts: checked }))
                    }
                  />
                </div>
              </div>

              <Button onClick={saveNotifications}>
                Guardar Preferencias
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Configuración de Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticación de dos factores</Label>
                    <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad</p>
                  </div>
                  <Switch
                    checked={security.twoFactorEnabled}
                    onCheckedChange={(checked) => 
                      setSecurity(prev => ({ ...prev, twoFactorEnabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Timeout de sesión</Label>
                  <Select
                    value={security.sessionTimeout}
                    onValueChange={(value) => setSecurity(prev => ({ ...prev, sessionTimeout: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 hora</SelectItem>
                      <SelectItem value="8h">8 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                      <SelectItem value="7d">7 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>IPs permitidas (opcional)</Label>
                  <Textarea
                    placeholder="192.168.1.1, 10.0.0.1"
                    value={security.allowedIPs}
                    onChange={(e) => setSecurity(prev => ({ ...prev, allowedIPs: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button onClick={saveSecurity}>
                  Guardar Configuración
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">API Key Principal</span>
                    <Badge variant="secondary">Activa</Badge>
                  </div>
                  <code className="text-sm bg-muted p-2 rounded block mb-3">
                    vhp_xxxxxxxxxxxxxxxxxxxx
                  </code>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={generateApiKey}>
                      Regenerar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rotación automática</Label>
                  <Select
                    value={security.apiKeyRotation}
                    onValueChange={(value) => setSecurity(prev => ({ ...prev, apiKeyRotation: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full">
                  <Key className="w-4 h-4 mr-2" />
                  Crear Nueva API Key
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

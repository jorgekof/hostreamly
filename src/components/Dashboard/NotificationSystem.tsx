import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Mail,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Settings,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone,
  Globe,
  Code,
  Palette,
  Save,
  Copy,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';

// Interfaces
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  category: 'user' | 'system' | 'marketing' | 'transactional';
  type: 'welcome' | 'verification' | 'password_reset' | 'notification' | 'promotional' | 'alert' | 'reminder';
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'user_registration' | 'video_upload' | 'video_processed' | 'payment_received' | 'subscription_expired' | 'system_alert' | 'custom';
  channels: ('email' | 'push' | 'sms' | 'in_app')[];
  recipients: 'all_users' | 'specific_users' | 'user_groups' | 'admins' | 'moderators';
  conditions?: {
    userRole?: string[];
    userPlan?: string[];
    customFilter?: string;
  };
  emailTemplate?: string;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  createdAt: string;
  updatedAt: string;
}

interface NotificationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  channel: 'email' | 'push' | 'sms' | 'in_app';
  recipient: string;
  recipientType: 'user' | 'admin' | 'group';
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  metadata?: {
    templateId?: string;
    variables?: Record<string, any>;
    provider?: string;
  };
}

interface NotificationStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  activeTemplates: number;
  activeRules: number;
}

const NotificationSystem: React.FC = () => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Bienvenida de Usuario',
      subject: '¡Bienvenido a {{app_name}}!',
      description: 'Email de bienvenida para nuevos usuarios registrados',
      category: 'user',
      type: 'welcome',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">¡Bienvenido a {{app_name}}, {{user_name}}!</h1>
          <p>Gracias por unirte a nuestra plataforma. Estamos emocionados de tenerte con nosotros.</p>
          <p>Para comenzar, puedes:</p>
          <ul>
            <li>Subir tu primer video</li>
            <li>Personalizar tu perfil</li>
            <li>Explorar contenido de otros creadores</li>
          </ul>
          <a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Dashboard</a>
        </div>
      `,
      textContent: 'Bienvenido a {{app_name}}, {{user_name}}! Gracias por unirte a nuestra plataforma...',
      variables: ['app_name', 'user_name', 'user_email', 'dashboard_url'],
      isActive: true,
      isDefault: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-07T00:00:00Z',
      lastUsed: '2024-01-07T10:30:00Z',
      usageCount: 156,
    },
    {
      id: '2',
      name: 'Verificación de Email',
      subject: 'Verifica tu dirección de email',
      description: 'Email para verificar la dirección de correo del usuario',
      category: 'transactional',
      type: 'verification',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verifica tu email</h1>
          <p>Hola {{user_name}},</p>
          <p>Para completar tu registro, necesitamos verificar tu dirección de email.</p>
          <a href="{{verification_url}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verificar Email</a>
          <p><small>Este enlace expira en 24 horas.</small></p>
        </div>
      `,
      textContent: 'Verifica tu email haciendo clic en: {{verification_url}}',
      variables: ['user_name', 'user_email', 'verification_url'],
      isActive: true,
      isDefault: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
      lastUsed: '2024-01-07T11:15:00Z',
      usageCount: 89,
    },
    {
      id: '3',
      name: 'Video Procesado',
      subject: 'Tu video "{{video_title}}" está listo',
      description: 'Notificación cuando un video ha sido procesado exitosamente',
      category: 'system',
      type: 'notification',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">¡Tu video está listo!</h1>
          <p>Hola {{user_name}},</p>
          <p>Tu video "{{video_title}}" ha sido procesado exitosamente y ya está disponible para tus espectadores.</p>
          <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>{{video_title}}</h3>
            <p>Duración: {{video_duration}}</p>
            <p>Resolución: {{video_resolution}}</p>
          </div>
          <a href="{{video_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver Video</a>
        </div>
      `,
      textContent: 'Tu video "{{video_title}}" está listo. Ver en: {{video_url}}',
      variables: ['user_name', 'video_title', 'video_duration', 'video_resolution', 'video_url'],
      isActive: true,
      isDefault: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-06T00:00:00Z',
      lastUsed: '2024-01-07T09:45:00Z',
      usageCount: 234,
    },
  ]);

  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([
    {
      id: '1',
      name: 'Bienvenida Nuevos Usuarios',
      description: 'Enviar email de bienvenida a usuarios recién registrados',
      trigger: 'user_registration',
      channels: ['email'],
      recipients: 'specific_users',
      emailTemplate: '1',
      isActive: true,
      priority: 'medium',
      frequency: 'immediate',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-07T00:00:00Z',
    },
    {
      id: '2',
      name: 'Notificación Video Procesado',
      description: 'Notificar cuando un video ha sido procesado exitosamente',
      trigger: 'video_processed',
      channels: ['email', 'push'],
      recipients: 'specific_users',
      emailTemplate: '3',
      isActive: true,
      priority: 'high',
      frequency: 'immediate',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
    },
    {
      id: '3',
      name: 'Alertas del Sistema',
      description: 'Notificar a administradores sobre alertas críticas del sistema',
      trigger: 'system_alert',
      channels: ['email', 'sms'],
      recipients: 'admins',
      isActive: true,
      priority: 'critical',
      frequency: 'immediate',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ]);

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([
    {
      id: '1',
      ruleId: '1',
      ruleName: 'Bienvenida Nuevos Usuarios',
      channel: 'email',
      recipient: 'ana@email.com',
      recipientType: 'user',
      subject: '¡Bienvenido a Hostreamly!',
      content: 'Email de bienvenida enviado',
      status: 'delivered',
      sentAt: '2024-01-07T10:30:00Z',
      deliveredAt: '2024-01-07T10:31:00Z',
      metadata: {
        templateId: '1',
        variables: { user_name: 'Ana García', app_name: 'Hostreamly' },
        provider: 'SendGrid',
      },
    },
    {
      id: '2',
      ruleId: '2',
      ruleName: 'Notificación Video Procesado',
      channel: 'email',
      recipient: 'carlos@email.com',
      recipientType: 'user',
      subject: 'Tu video "Mi Primer Video" está listo',
      content: 'Notificación de video procesado',
      status: 'sent',
      sentAt: '2024-01-07T09:45:00Z',
      metadata: {
        templateId: '3',
        variables: { user_name: 'Carlos Mendez', video_title: 'Mi Primer Video' },
        provider: 'SendGrid',
      },
    },
    {
      id: '3',
      ruleId: '3',
      ruleName: 'Alertas del Sistema',
      channel: 'email',
      recipient: 'admin@hostreamly.com',
      recipientType: 'admin',
      subject: 'Alerta: Alto uso de CPU en servidor',
      content: 'Alerta crítica del sistema',
      status: 'failed',
      sentAt: '2024-01-07T08:15:00Z',
      errorMessage: 'SMTP connection timeout',
      metadata: {
        provider: 'SendGrid',
      },
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'template' | 'rule'; id: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Stats
  const notificationStats: NotificationStats = {
    totalSent: 1247,
    deliveryRate: 98.5,
    openRate: 24.3,
    clickRate: 3.7,
    bounceRate: 1.2,
    unsubscribeRate: 0.3,
    activeTemplates: emailTemplates.filter(t => t.isActive).length,
    activeRules: notificationRules.filter(r => r.isActive).length,
  };

  // Funciones
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      sent: 'default',
      delivered: 'default',
      failed: 'destructive',
      bounced: 'destructive',
    } as const;

    const labels = {
      pending: 'Pendiente',
      sent: 'Enviado',
      delivered: 'Entregado',
      failed: 'Fallido',
      bounced: 'Rebotado',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      critical: 'destructive',
    } as const;

    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica',
    };

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'default'}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      user: 'Usuario',
      system: 'Sistema',
      marketing: 'Marketing',
      transactional: 'Transaccional',
    };

    return labels[category as keyof typeof labels] || category;
  };

  const getChannelIcon = (channel: string) => {
    const icons = {
      email: Mail,
      push: Smartphone,
      sms: MessageSquare,
      in_app: Bell,
    };

    const Icon = icons[channel as keyof typeof icons] || Bell;
    return <Icon className="w-4 h-4" />;
  };

  const filteredTemplates = useMemo(() => {
    return emailTemplates.filter(template => {
      const categoryMatch = filterCategory === 'all' || template.category === filterCategory;
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'active' && template.isActive) ||
        (filterStatus === 'inactive' && !template.isActive);
      const searchMatch = searchTerm === '' || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return categoryMatch && statusMatch && searchMatch;
    });
  }, [emailTemplates, filterCategory, filterStatus, searchTerm]);

  const createTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: 'Nueva Plantilla',
      subject: 'Asunto del email',
      description: 'Descripción de la plantilla',
      category: 'user',
      type: 'notification',
      htmlContent: '<p>Contenido HTML aquí...</p>',
      textContent: 'Contenido de texto aquí...',
      variables: [],
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };
    
    setEmailTemplates([...emailTemplates, newTemplate]);
    setSelectedTemplate(newTemplate);
    setIsTemplateDialogOpen(true);
  };

  const createRule = () => {
    const newRule: NotificationRule = {
      id: Date.now().toString(),
      name: 'Nueva Regla',
      description: 'Descripción de la regla',
      trigger: 'custom',
      channels: ['email'],
      recipients: 'all_users',
      isActive: true,
      priority: 'medium',
      frequency: 'immediate',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setNotificationRules([...notificationRules, newRule]);
    setSelectedRule(newRule);
    setIsRuleDialogOpen(true);
  };

  const saveTemplate = (template: EmailTemplate) => {
    setEmailTemplates(templates => 
      templates.map(t => 
        t.id === template.id 
          ? { ...template, updatedAt: new Date().toISOString() }
          : t
      )
    );
    setIsTemplateDialogOpen(false);
  };

  const saveRule = (rule: NotificationRule) => {
    setNotificationRules(rules => 
      rules.map(r => 
        r.id === rule.id 
          ? { ...rule, updatedAt: new Date().toISOString() }
          : r
      )
    );
    setIsRuleDialogOpen(false);
  };

  const deleteItem = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'template') {
      setEmailTemplates(templates => templates.filter(t => t.id !== deleteTarget.id));
    } else {
      setNotificationRules(rules => rules.filter(r => r.id !== deleteTarget.id));
    }
    
    setIsDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const toggleTemplateStatus = (templateId: string) => {
    setEmailTemplates(templates => 
      templates.map(t => 
        t.id === templateId 
          ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const toggleRuleStatus = (ruleId: string) => {
    setNotificationRules(rules => 
      rules.map(r => 
        r.id === ruleId 
          ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const testTemplate = (templateId: string) => {
    // Simular envío de prueba
    console.log('Enviando email de prueba para plantilla:', templateId);
    // Aquí iría la lógica real de envío de prueba
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona plantillas de email, reglas de notificación y logs de envío
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Tasa de entrega: {notificationStats.deliveryRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Apertura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              Clicks: {notificationStats.clickRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plantillas Activas</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats.activeTemplates}</div>
            <p className="text-xs text-muted-foreground">
              de {emailTemplates.length} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reglas Activas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats.activeRules}</div>
            <p className="text-xs text-muted-foreground">
              de {notificationRules.length} totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="transactional">Transaccional</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={createTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>

          {/* Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Email</CardTitle>
              <CardDescription>
                Gestiona las plantillas de email para diferentes tipos de notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {template.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(template.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.isActive}
                            onCheckedChange={() => toggleTemplateStatus(template.id)}
                          />
                          <span className="text-sm">
                            {template.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {template.usageCount} veces
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(template.updatedAt).toLocaleDateString('es-ES')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setIsTemplateDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => testTemplate(template.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget({ type: 'template', id: template.id });
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Reglas de Notificación</h3>
              <p className="text-sm text-muted-foreground">
                Define cuándo y cómo se envían las notificaciones
              </p>
            </div>
            <Button onClick={createRule}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Regla
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Disparador</TableHead>
                    <TableHead>Canales</TableHead>
                    <TableHead>Destinatarios</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {rule.trigger.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {rule.channels.map((channel) => (
                            <div key={channel} className="flex items-center gap-1">
                              {getChannelIcon(channel)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {rule.recipients.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(rule.priority)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => toggleRuleStatus(rule.id)}
                          />
                          <span className="text-sm">
                            {rule.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRule(rule);
                              setIsRuleDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget({ type: 'rule', id: rule.id });
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Notificaciones</CardTitle>
              <CardDescription>
                Historial de todas las notificaciones enviadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regla</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Destinatario</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium">{log.ruleName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(log.channel)}
                          <span className="capitalize">{log.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.recipient}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {log.recipientType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.subject || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.sentAt).toLocaleString('es-ES')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>
                Ajusta las configuraciones generales del sistema de notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Configuración de Email</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">Servidor SMTP</Label>
                    <Input id="smtpHost" defaultValue="smtp.sendgrid.net" />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">Puerto</Label>
                    <Input id="smtpPort" type="number" defaultValue="587" />
                  </div>
                  <div>
                    <Label htmlFor="smtpUser">Usuario</Label>
                    <Input id="smtpUser" defaultValue="apikey" />
                  </div>
                  <div>
                    <Label htmlFor="smtpPass">Contraseña</Label>
                    <Input id="smtpPass" type="password" defaultValue="••••••••" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromEmail">Email remitente</Label>
                    <Input id="fromEmail" defaultValue="noreply@hostreamly.com" />
                  </div>
                  <div>
                    <Label htmlFor="fromName">Nombre remitente</Label>
                    <Input id="fromName" defaultValue="Hostreamly" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Límites y Restricciones</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dailyLimit">Límite diario de emails</Label>
                    <Input id="dailyLimit" type="number" defaultValue="10000" />
                  </div>
                  <div>
                    <Label htmlFor="hourlyLimit">Límite por hora</Label>
                    <Input id="hourlyLimit" type="number" defaultValue="1000" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Respetar lista de no suscripción</Label>
                      <p className="text-sm text-muted-foreground">
                        No enviar emails a usuarios que se han dado de baja
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reintentos automáticos</Label>
                      <p className="text-sm text-muted-foreground">
                        Reintentar envío en caso de fallo temporal
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notificaciones Push</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="vapidPublic">Clave VAPID Pública</Label>
                    <Input id="vapidPublic" defaultValue="BK..." />
                  </div>
                  <div>
                    <Label htmlFor="vapidPrivate">Clave VAPID Privada</Label>
                    <Input id="vapidPrivate" type="password" defaultValue="••••••••" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Habilitar notificaciones push</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir envío de notificaciones push a navegadores
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
            <DialogDescription>
              Configura el contenido y variables de la plantilla de email
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateName">Nombre</Label>
                  <Input
                    id="templateName"
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="templateCategory">Categoría</Label>
                  <Select
                    value={selectedTemplate.category}
                    onValueChange={(value) => setSelectedTemplate({
                      ...selectedTemplate,
                      category: value as any
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="transactional">Transaccional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="templateSubject">Asunto</Label>
                <Input
                  id="templateSubject"
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    subject: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="templateDescription">Descripción</Label>
                <Textarea
                  id="templateDescription"
                  value={selectedTemplate.description}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    description: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="templateHtml">Contenido HTML</Label>
                <Textarea
                  id="templateHtml"
                  value={selectedTemplate.htmlContent}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    htmlContent: e.target.value
                  })}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="templateText">Contenido de Texto</Label>
                <Textarea
                  id="templateText"
                  value={selectedTemplate.textContent}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    textContent: e.target.value
                  })}
                  rows={5}
                />
              </div>
              
              <div>
                <Label>Variables Disponibles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTemplate.variables.map((variable) => (
                    <Badge key={variable} variant="outline">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => selectedTemplate && saveTemplate(selectedTemplate)}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule?.id ? 'Editar Regla' : 'Nueva Regla'}
            </DialogTitle>
            <DialogDescription>
              Configura cuándo y cómo se envían las notificaciones
            </DialogDescription>
          </DialogHeader>
          
          {selectedRule && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ruleName">Nombre</Label>
                <Input
                  id="ruleName"
                  value={selectedRule.name}
                  onChange={(e) => setSelectedRule({
                    ...selectedRule,
                    name: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="ruleDescription">Descripción</Label>
                <Textarea
                  id="ruleDescription"
                  value={selectedRule.description}
                  onChange={(e) => setSelectedRule({
                    ...selectedRule,
                    description: e.target.value
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ruleTrigger">Disparador</Label>
                  <Select
                    value={selectedRule.trigger}
                    onValueChange={(value) => setSelectedRule({
                      ...selectedRule,
                      trigger: value as any
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_registration">Registro de Usuario</SelectItem>
                      <SelectItem value="video_upload">Subida de Video</SelectItem>
                      <SelectItem value="video_processed">Video Procesado</SelectItem>
                      <SelectItem value="payment_received">Pago Recibido</SelectItem>
                      <SelectItem value="subscription_expired">Suscripción Expirada</SelectItem>
                      <SelectItem value="system_alert">Alerta del Sistema</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rulePriority">Prioridad</Label>
                  <Select
                    value={selectedRule.priority}
                    onValueChange={(value) => setSelectedRule({
                      ...selectedRule,
                      priority: value as any
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Canales de Notificación</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['email', 'push', 'sms', 'in_app'].map((channel) => (
                    <div key={channel} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`channel-${channel}`}
                        checked={selectedRule.channels.includes(channel as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRule({
                              ...selectedRule,
                              channels: [...selectedRule.channels, channel as any]
                            });
                          } else {
                            setSelectedRule({
                              ...selectedRule,
                              channels: selectedRule.channels.filter(c => c !== channel)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`channel-${channel}`} className="capitalize">
                        {channel === 'in_app' ? 'In-App' : channel}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="ruleRecipients">Destinatarios</Label>
                <Select
                  value={selectedRule.recipients}
                  onValueChange={(value) => setSelectedRule({
                    ...selectedRule,
                    recipients: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">Todos los Usuarios</SelectItem>
                    <SelectItem value="specific_users">Usuarios Específicos</SelectItem>
                    <SelectItem value="user_groups">Grupos de Usuarios</SelectItem>
                    <SelectItem value="admins">Administradores</SelectItem>
                    <SelectItem value="moderators">Moderadores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedRule.channels.includes('email') && (
                <div>
                  <Label htmlFor="ruleTemplate">Plantilla de Email</Label>
                  <Select
                    value={selectedRule.emailTemplate || ''}
                    onValueChange={(value) => setSelectedRule({
                      ...selectedRule,
                      emailTemplate: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.filter(t => t.isActive).map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => selectedRule && saveRule(selectedRule)}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la {deleteTarget?.type === 'template' ? 'plantilla' : 'regla'} seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotificationSystem;
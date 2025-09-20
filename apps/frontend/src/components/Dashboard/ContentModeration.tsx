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
  Shield,
  AlertTriangle,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  User,
  Video,
  MessageSquare,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  UserX,
  Mail,
  Calendar,
  FileText,
  Settings,
} from 'lucide-react';

// Interfaces
interface Report {
  id: string;
  type: 'video' | 'user' | 'comment' | 'message';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'spam' | 'harassment' | 'inappropriate_content' | 'copyright' | 'violence' | 'hate_speech' | 'other';
  
  // Reporter info
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  
  // Reported content/user
  targetId: string;
  targetType: 'video' | 'user' | 'comment';
  targetTitle?: string;
  targetUser?: string;
  targetContent?: string;
  
  // Report details
  reason: string;
  description: string;
  evidence?: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  
  // Moderation
  assignedTo?: string;
  moderatorNotes?: string;
  action?: 'no_action' | 'warning' | 'content_removal' | 'user_suspension' | 'user_ban';
  actionDuration?: number;
  actionReason?: string;
}

interface ModerationAction {
  id: string;
  type: 'warning' | 'content_removal' | 'user_suspension' | 'user_ban' | 'account_restriction';
  targetId: string;
  targetType: 'user' | 'video' | 'comment';
  targetName: string;
  reason: string;
  duration?: number;
  moderatorId: string;
  moderatorName: string;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedToday: number;
  averageResolutionTime: number;
  topCategory: string;
  moderatorWorkload: number;
}

interface AutoModerationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'keyword' | 'ai_detection' | 'user_behavior' | 'content_analysis';
  category: 'spam' | 'harassment' | 'inappropriate_content' | 'violence' | 'hate_speech';
  action: 'flag' | 'auto_remove' | 'require_review' | 'user_warning';
  sensitivity: 'low' | 'medium' | 'high';
  keywords?: string[];
  threshold?: number;
  createdAt: string;
  updatedAt: string;
}

const ContentModeration: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      type: 'video',
      status: 'pending',
      priority: 'high',
      category: 'inappropriate_content',
      reporterId: 'user1',
      reporterName: 'Ana García',
      reporterEmail: 'ana@email.com',
      targetId: 'video123',
      targetType: 'video',
      targetTitle: 'Video de Ejemplo',
      targetUser: 'Carlos Mendez',
      reason: 'Contenido inapropiado',
      description: 'Este video contiene material que viola las políticas de la comunidad.',
      evidence: ['screenshot1.jpg', 'timestamp_2:30'],
      createdAt: '2024-01-07T10:30:00Z',
      updatedAt: '2024-01-07T10:30:00Z',
    },
    {
      id: '2',
      type: 'user',
      status: 'reviewing',
      priority: 'medium',
      category: 'harassment',
      reporterId: 'user2',
      reporterName: 'Sofia Rodriguez',
      reporterEmail: 'sofia@email.com',
      targetId: 'user456',
      targetType: 'user',
      targetUser: 'Usuario Problemático',
      reason: 'Acoso en comentarios',
      description: 'Este usuario ha estado enviando mensajes de acoso repetidamente.',
      createdAt: '2024-01-07T09:15:00Z',
      updatedAt: '2024-01-07T11:00:00Z',
      assignedTo: 'mod1',
    },
    {
      id: '3',
      type: 'comment',
      status: 'resolved',
      priority: 'low',
      category: 'spam',
      reporterId: 'user3',
      reporterName: 'Miguel Torres',
      reporterEmail: 'miguel@email.com',
      targetId: 'comment789',
      targetType: 'comment',
      targetContent: 'Spam comment content here...',
      reason: 'Comentario spam',
      description: 'Comentario repetitivo con enlaces sospechosos.',
      createdAt: '2024-01-06T14:20:00Z',
      updatedAt: '2024-01-07T08:45:00Z',
      resolvedAt: '2024-01-07T08:45:00Z',
      assignedTo: 'mod2',
      action: 'content_removal',
      actionReason: 'Contenido spam confirmado',
    },
  ]);

  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([
    {
      id: '1',
      type: 'user_suspension',
      targetId: 'user456',
      targetType: 'user',
      targetName: 'Usuario Problemático',
      reason: 'Acoso repetido a otros usuarios',
      duration: 7,
      moderatorId: 'mod1',
      moderatorName: 'Moderador Principal',
      createdAt: '2024-01-07T11:00:00Z',
      expiresAt: '2024-01-14T11:00:00Z',
      status: 'active',
    },
    {
      id: '2',
      type: 'content_removal',
      targetId: 'video123',
      targetType: 'video',
      targetName: 'Video de Ejemplo',
      reason: 'Contenido que viola políticas de la comunidad',
      moderatorId: 'mod2',
      moderatorName: 'Moderador Secundario',
      createdAt: '2024-01-07T10:45:00Z',
      status: 'active',
    },
  ]);

  const [autoModerationRules, setAutoModerationRules] = useState<AutoModerationRule[]>([
    {
      id: '1',
      name: 'Filtro de Palabras Ofensivas',
      description: 'Detecta y filtra palabras ofensivas en comentarios y títulos',
      enabled: true,
      type: 'keyword',
      category: 'hate_speech',
      action: 'require_review',
      sensitivity: 'high',
      keywords: ['palabra1', 'palabra2', 'palabra3'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-07T00:00:00Z',
    },
    {
      id: '2',
      name: 'Detección de Spam',
      description: 'Identifica patrones de spam en comentarios y mensajes',
      enabled: true,
      type: 'ai_detection',
      category: 'spam',
      action: 'auto_remove',
      sensitivity: 'medium',
      threshold: 0.8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
    },
    {
      id: '3',
      name: 'Comportamiento Sospechoso',
      description: 'Detecta usuarios con comportamiento anómalo',
      enabled: false,
      type: 'user_behavior',
      category: 'harassment',
      action: 'flag',
      sensitivity: 'low',
      threshold: 0.6,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ]);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Stats
  const moderationStats: ModerationStats = {
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    resolvedToday: reports.filter(r => 
      r.resolvedAt && 
      new Date(r.resolvedAt).toDateString() === new Date().toDateString()
    ).length,
    averageResolutionTime: 4.2,
    topCategory: 'inappropriate_content',
    moderatorWorkload: 12,
  };

  // Funciones
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'destructive',
      reviewing: 'secondary',
      resolved: 'default',
      dismissed: 'outline',
    } as const;

    const labels = {
      pending: 'Pendiente',
      reviewing: 'Revisando',
      resolved: 'Resuelto',
      dismissed: 'Desestimado',
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
      high: 'destructive',
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
      spam: 'Spam',
      harassment: 'Acoso',
      inappropriate_content: 'Contenido Inapropiado',
      copyright: 'Derechos de Autor',
      violence: 'Violencia',
      hate_speech: 'Discurso de Odio',
      other: 'Otro',
    };

    return labels[category as keyof typeof labels] || category;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      video: Video,
      user: User,
      comment: MessageSquare,
      message: Mail,
    };

    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const statusMatch = filterStatus === 'all' || report.status === filterStatus;
      const priorityMatch = filterPriority === 'all' || report.priority === filterPriority;
      const categoryMatch = filterCategory === 'all' || report.category === filterCategory;
      const searchMatch = searchTerm === '' || 
        report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.targetTitle && report.targetTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.targetUser && report.targetUser.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return statusMatch && priorityMatch && categoryMatch && searchMatch;
    });
  }, [reports, filterStatus, filterPriority, filterCategory, searchTerm]);

  const assignReport = (reportId: string, moderatorId: string) => {
    setReports(reports.map(report => 
      report.id === reportId 
        ? { ...report, assignedTo: moderatorId, status: 'reviewing', updatedAt: new Date().toISOString() }
        : report
    ));
  };

  const resolveReport = (reportId: string, action: string, reason: string) => {
    setReports(reports.map(report => 
      report.id === reportId 
        ? { 
            ...report, 
            status: 'resolved', 
            action: action as any,
            actionReason: reason,
            resolvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : report
    ));
  };

  const dismissReport = (reportId: string, reason: string) => {
    setReports(reports.map(report => 
      report.id === reportId 
        ? { 
            ...report, 
            status: 'dismissed', 
            moderatorNotes: reason,
            resolvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : report
    ));
  };

  const toggleAutoModerationRule = (ruleId: string) => {
    setAutoModerationRules(rules => 
      rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, enabled: !rule.enabled, updatedAt: new Date().toISOString() }
          : rule
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Moderación de Contenido</h1>
          <p className="text-muted-foreground">
            Gestiona reportes, acciones de moderación y reglas automáticas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reportes Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{moderationStats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              de {moderationStats.totalReports} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{moderationStats.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">
              Tiempo promedio: {moderationStats.averageResolutionTime}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoría Principal</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCategoryLabel(moderationStats.topCategory)}</div>
            <p className="text-xs text-muted-foreground">
              Más reportada esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carga de Trabajo</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationStats.moderatorWorkload}</div>
            <p className="text-xs text-muted-foreground">
              Casos por moderador
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="actions">Acciones</TabsTrigger>
          <TabsTrigger value="automation">Automatización</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar reportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="reviewing">Revisando</SelectItem>
                <SelectItem value="resolved">Resueltos</SelectItem>
                <SelectItem value="dismissed">Desestimados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Acoso</SelectItem>
                <SelectItem value="inappropriate_content">Contenido Inapropiado</SelectItem>
                <SelectItem value="copyright">Derechos de Autor</SelectItem>
                <SelectItem value="violence">Violencia</SelectItem>
                <SelectItem value="hate_speech">Discurso de Odio</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Reportes de Contenido</CardTitle>
              <CardDescription>
                Gestiona todos los reportes recibidos de la comunidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contenido/Usuario</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(report.type)}
                          <span className="capitalize">{report.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {report.targetTitle || report.targetUser || 'Contenido eliminado'}
                          </div>
                          {report.targetUser && report.targetTitle && (
                            <div className="text-sm text-muted-foreground">
                              por {report.targetUser}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.reporterName}</div>
                          <div className="text-sm text-muted-foreground">
                            {report.reporterEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(report.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(report.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(report.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setIsReportDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {report.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => assignReport(report.id, 'current_user')}
                            >
                              <User className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones de Moderación</CardTitle>
              <CardDescription>
                Historial de todas las acciones tomadas por los moderadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Acción</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Razón</TableHead>
                    <TableHead>Moderador</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moderationActions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <Badge variant={action.type === 'user_ban' ? 'destructive' : 'secondary'}>
                          {action.type === 'user_suspension' ? 'Suspensión' :
                           action.type === 'user_ban' ? 'Baneo' :
                           action.type === 'content_removal' ? 'Eliminación' :
                           action.type === 'warning' ? 'Advertencia' : action.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{action.targetName}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {action.targetType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {action.reason}
                      </TableCell>
                      <TableCell>{action.moderatorName}</TableCell>
                      <TableCell>
                        {new Date(action.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={action.status === 'active' ? 'default' : 'secondary'}>
                          {action.status === 'active' ? 'Activo' :
                           action.status === 'expired' ? 'Expirado' : 'Revocado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {action.status === 'active' && (
                          <Button variant="ghost" size="sm">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de Moderación Automática</CardTitle>
              <CardDescription>
                Configura reglas para detectar y manejar contenido problemático automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {autoModerationRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleAutoModerationRule(rule.id)}
                      />
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{getCategoryLabel(rule.category)}</Badge>
                      <Badge variant="secondary">
                        {rule.action === 'flag' ? 'Marcar' :
                         rule.action === 'auto_remove' ? 'Eliminar' :
                         rule.action === 'require_review' ? 'Revisar' : 'Advertir'}
                      </Badge>
                      <Badge variant="outline">
                        Sensibilidad: {rule.sensitivity === 'low' ? 'Baja' :
                                      rule.sensitivity === 'medium' ? 'Media' : 'Alta'}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Moderación</CardTitle>
              <CardDescription>
                Ajusta las políticas y configuraciones generales de moderación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Políticas de Contenido</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Moderación Previa</Label>
                      <p className="text-sm text-muted-foreground">
                        Revisar contenido antes de publicar
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-moderación Activa</Label>
                      <p className="text-sm text-muted-foreground">
                        Aplicar reglas automáticas en tiempo real
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificar Acciones</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar notificaciones de acciones de moderación
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Configuración de Reportes</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxReportsPerUser">Máximo reportes por usuario/día</Label>
                    <Input id="maxReportsPerUser" type="number" defaultValue="10" />
                  </div>
                  <div>
                    <Label htmlFor="autoEscalation">Auto-escalación después de</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tiempo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1 hora</SelectItem>
                        <SelectItem value="4h">4 horas</SelectItem>
                        <SelectItem value="24h">24 horas</SelectItem>
                        <SelectItem value="never">Nunca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Detail Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Reporte</DialogTitle>
            <DialogDescription>
              Información completa del reporte y acciones disponibles
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Reporte</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedReport.type)}
                    <span className="capitalize">{selectedReport.type}</span>
                  </div>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedReport.priority)}
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Razón del Reporte</Label>
                <p className="mt-1 text-sm">{selectedReport.reason}</p>
              </div>
              
              <div>
                <Label>Descripción</Label>
                <p className="mt-1 text-sm text-muted-foreground">{selectedReport.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reportado por</Label>
                  <p className="mt-1 text-sm">{selectedReport.reporterName}</p>
                  <p className="text-xs text-muted-foreground">{selectedReport.reporterEmail}</p>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedReport.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
              
              {selectedReport.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => {
                      assignReport(selectedReport.id, 'current_user');
                      setIsReportDialogOpen(false);
                    }}
                  >
                    Asignar a mí
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      dismissReport(selectedReport.id, 'Reporte sin fundamento');
                      setIsReportDialogOpen(false);
                    }}
                  >
                    Desestimar
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      resolveReport(selectedReport.id, 'content_removal', 'Contenido removido por violación de políticas');
                      setIsReportDialogOpen(false);
                    }}
                  >
                    Tomar Acción
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentModeration;
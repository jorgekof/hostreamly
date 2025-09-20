import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Settings, 
  CreditCard,
  Webhook,
  BarChart3,
  Shield,
  Database,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Crown,
  Receipt,
  UserCog,
  DollarSign,
  FileText,
  Flag,
  Bell,
  Ticket
} from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import UserManagement from './Dashboard/UserManagement';
import PlanManagement from './Dashboard/PlanManagement';
import WebhookManager from './Dashboard/WebhookManager';
import EnhancedUserManagement from './Dashboard/EnhancedUserManagement';
import EnhancedPlanManagement from './Dashboard/EnhancedPlanManagement';
import CouponManagement from './Dashboard/CouponManagement';
import BillingManagement from './Dashboard/BillingManagement';
import FinancialReports from './Dashboard/FinancialReports';
import SystemConfiguration from './Dashboard/SystemConfiguration';
import ContentModeration from './Dashboard/ContentModeration';
import NotificationSystem from './Dashboard/NotificationSystem';
import { DashboardSkeleton } from '@/components/skeletons/SkeletonLoaders';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalVideos: number;
  totalStorage: string;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

const AdminDashboard: React.FC = () => {
  const { isAdmin, loading } = useAdminCheck();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats] = useState<AdminStats>({
    totalUsers: 1247,
    activeUsers: 892,
    totalVideos: 15678,
    totalStorage: '2.4 TB',
    monthlyRevenue: 12450,
    systemHealth: 'healthy'
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground">
              No tienes permisos de administrador para acceder a esta sección.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSystemAction = (action: string) => {
    toast.info(`Función ${action} en desarrollo`, {
      description: 'Esta funcionalidad estará disponible próximamente'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestiona usuarios, planes, webhooks y configuraciones del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSystemAction('backup')}>
            <Database className="w-4 h-4 mr-2" />
            Backup Sistema
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSystemAction('maintenance')}>
            <Server className="w-4 h-4 mr-2" />
            Mantenimiento
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-11 min-w-max">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="enhanced-users">Usuarios Pro</TabsTrigger>
            <TabsTrigger value="plans">Planes</TabsTrigger>
            <TabsTrigger value="enhanced-plans">Planes Pro</TabsTrigger>
            <TabsTrigger value="coupons">Cupones</TabsTrigger>
            <TabsTrigger value="billing">Facturación</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
            <TabsTrigger value="moderation">Moderación</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers} activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVideos.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalStorage} almacenados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +12% vs mes anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
                {stats.systemHealth === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  <Badge 
                    variant={stats.systemHealth === 'healthy' ? 'default' : 'secondary'}
                    className={stats.systemHealth === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}
                  >
                    {stats.systemHealth === 'healthy' ? 'Saludable' : 'Advertencia'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos los servicios operativos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas de Administrador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('enhanced-users')}
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Usuarios Pro
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('enhanced-plans')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Planes Pro
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('coupons')}
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    Cupones
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('billing')}
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Facturación
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('reports')}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Reportes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('system')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Sistema
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Estado de Servicios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Backend</span>
                    <Badge className="bg-green-500">Operativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Base de Datos</span>
                    <Badge className="bg-green-500">Operativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CDN Bunny</span>
                    <Badge className="bg-green-500">Operativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Procesamiento Video</span>
                    <Badge className="bg-green-500">Operativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sistema de Webhooks</span>
                    <Badge className="bg-yellow-500">Mantenimiento</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* Enhanced Users Tab */}
        <TabsContent value="enhanced-users">
          <EnhancedUserManagement />
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <PlanManagement />
        </TabsContent>

        {/* Enhanced Plans Tab */}
        <TabsContent value="enhanced-plans">
          <EnhancedPlanManagement />
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons">
          <CouponManagement />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <BillingManagement />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation">
          <ContentModeration />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationSystem />
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <SystemConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
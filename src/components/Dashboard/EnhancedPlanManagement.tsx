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
  DialogTrigger,
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
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Users,
  DollarSign,
  Settings,
  Crown,
  Star,
  Zap,
  Shield,
  Clock,
  HardDrive,
  Wifi,
  Video,
  Upload,
  Download,
  Globe,
  Lock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Interfaces
interface PlanFeature {
  id: string;
  name: string;
  description: string;
  category: 'storage' | 'bandwidth' | 'streaming' | 'support' | 'analytics' | 'customization';
  type: 'boolean' | 'number' | 'text';
  value: boolean | number | string;
  unit?: string;
  unlimited?: boolean;
}

interface PlanLimit {
  id: string;
  name: string;
  value: number;
  unit: string;
  unlimited: boolean;
  category: 'storage' | 'bandwidth' | 'uploads' | 'streams' | 'users';
}

interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  discount?: number;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  visibility: 'public' | 'private' | 'invitation_only';
  category: 'basic' | 'premium' | 'enterprise';
  position: number;
  
  // Pricing
  pricing: PricingTier[];
  
  // Features
  features: PlanFeature[];
  
  // Limits
  limits: PlanLimit[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  subscribersCount: number;
  revenue: number;
  
  // Advanced settings
  trialDays?: number;
  setupFee?: number;
  cancellationPolicy: 'immediate' | 'end_of_period';
  upgradePolicy: 'immediate' | 'next_billing';
  downgradePolicy: 'immediate' | 'end_of_period';
  
  // Customization
  color: string;
  icon: string;
  badge?: string;
  
  // Restrictions
  maxSubscribers?: number;
  availableFrom?: string;
  availableUntil?: string;
  allowedCountries?: string[];
  restrictedCountries?: string[];
}

interface PlanStats {
  totalPlans: number;
  activePlans: number;
  totalSubscribers: number;
  totalRevenue: number;
  averageRevenue: number;
  conversionRate: number;
}

const EnhancedPlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: '1',
      name: 'Básico',
      description: 'Plan perfecto para comenzar tu aventura en streaming',
      status: 'active',
      visibility: 'public',
      category: 'basic',
      position: 1,
      pricing: [
        { id: '1', name: 'Mensual', price: 9.99, currency: 'EUR', interval: 'monthly' },
        { id: '2', name: 'Anual', price: 99.99, currency: 'EUR', interval: 'yearly', discount: 17 },
      ],
      features: [
        { id: '1', name: 'Streaming HD', description: 'Calidad hasta 1080p', category: 'streaming', type: 'boolean', value: true },
        { id: '2', name: 'Chat en vivo', description: 'Interacción con audiencia', category: 'streaming', type: 'boolean', value: true },
        { id: '3', name: 'Soporte básico', description: 'Email support', category: 'support', type: 'boolean', value: true },
        { id: '4', name: 'Analytics básicos', description: 'Estadísticas esenciales', category: 'analytics', type: 'boolean', value: true },
      ],
      limits: [
        { id: '1', name: 'Almacenamiento', value: 10, unit: 'GB', unlimited: false, category: 'storage' },
        { id: '2', name: 'Ancho de banda', value: 100, unit: 'GB/mes', unlimited: false, category: 'bandwidth' },
        { id: '3', name: 'Streams simultáneos', value: 1, unit: 'streams', unlimited: false, category: 'streams' },
        { id: '4', name: 'Subidas por mes', value: 50, unit: 'videos', unlimited: false, category: 'uploads' },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-07T00:00:00Z',
      subscribersCount: 1245,
      revenue: 12450,
      trialDays: 7,
      cancellationPolicy: 'end_of_period',
      upgradePolicy: 'immediate',
      downgradePolicy: 'end_of_period',
      color: '#3b82f6',
      icon: 'star',
    },
    {
      id: '2',
      name: 'Pro',
      description: 'Para creadores serios que buscan crecer su audiencia',
      status: 'active',
      visibility: 'public',
      category: 'premium',
      position: 2,
      pricing: [
        { id: '3', name: 'Mensual', price: 29.99, currency: 'EUR', interval: 'monthly' },
        { id: '4', name: 'Anual', price: 299.99, currency: 'EUR', interval: 'yearly', discount: 17 },
      ],
      features: [
        { id: '5', name: 'Streaming 4K', description: 'Calidad hasta 4K', category: 'streaming', type: 'boolean', value: true },
        { id: '6', name: 'Chat moderado', description: 'Herramientas de moderación', category: 'streaming', type: 'boolean', value: true },
        { id: '7', name: 'Soporte prioritario', description: 'Chat y email support', category: 'support', type: 'boolean', value: true },
        { id: '8', name: 'Analytics avanzados', description: 'Métricas detalladas', category: 'analytics', type: 'boolean', value: true },
        { id: '9', name: 'Personalización', description: 'Branding personalizado', category: 'customization', type: 'boolean', value: true },
      ],
      limits: [
        { id: '5', name: 'Almacenamiento', value: 100, unit: 'GB', unlimited: false, category: 'storage' },
        { id: '6', name: 'Ancho de banda', value: 1000, unit: 'GB/mes', unlimited: false, category: 'bandwidth' },
        { id: '7', name: 'Streams simultáneos', value: 3, unit: 'streams', unlimited: false, category: 'streams' },
        { id: '8', name: 'Subidas por mes', value: 200, unit: 'videos', unlimited: false, category: 'uploads' },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-07T00:00:00Z',
      subscribersCount: 856,
      revenue: 25680,
      trialDays: 14,
      cancellationPolicy: 'end_of_period',
      upgradePolicy: 'immediate',
      downgradePolicy: 'end_of_period',
      color: '#10b981',
      icon: 'crown',
      badge: 'Popular',
    },
    {
      id: '3',
      name: 'Enterprise',
      description: 'Solución completa para organizaciones y empresas',
      status: 'active',
      visibility: 'invitation_only',
      category: 'enterprise',
      position: 3,
      pricing: [
        { id: '5', name: 'Mensual', price: 99.99, currency: 'EUR', interval: 'monthly' },
        { id: '6', name: 'Anual', price: 999.99, currency: 'EUR', interval: 'yearly', discount: 17 },
      ],
      features: [
        { id: '10', name: 'Streaming ilimitado', description: 'Sin límites de calidad', category: 'streaming', type: 'boolean', value: true },
        { id: '11', name: 'API completa', description: 'Acceso total a la API', category: 'customization', type: 'boolean', value: true },
        { id: '12', name: 'Soporte dedicado', description: 'Account manager dedicado', category: 'support', type: 'boolean', value: true },
        { id: '13', name: 'Analytics empresariales', description: 'Reportes personalizados', category: 'analytics', type: 'boolean', value: true },
        { id: '14', name: 'White label', description: 'Marca completamente personalizada', category: 'customization', type: 'boolean', value: true },
      ],
      limits: [
        { id: '9', name: 'Almacenamiento', value: 0, unit: 'GB', unlimited: true, category: 'storage' },
        { id: '10', name: 'Ancho de banda', value: 0, unit: 'GB/mes', unlimited: true, category: 'bandwidth' },
        { id: '11', name: 'Streams simultáneos', value: 0, unit: 'streams', unlimited: true, category: 'streams' },
        { id: '12', name: 'Subidas por mes', value: 0, unit: 'videos', unlimited: true, category: 'uploads' },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-07T00:00:00Z',
      subscribersCount: 123,
      revenue: 12300,
      trialDays: 30,
      setupFee: 199.99,
      cancellationPolicy: 'end_of_period',
      upgradePolicy: 'next_billing',
      downgradePolicy: 'end_of_period',
      color: '#8b5cf6',
      icon: 'shield',
      maxSubscribers: 500,
    },
  ]);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Datos de ejemplo para estadísticas
  const planStats: PlanStats = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.status === 'active').length,
    totalSubscribers: plans.reduce((sum, p) => sum + p.subscribersCount, 0),
    totalRevenue: plans.reduce((sum, p) => sum + p.revenue, 0),
    averageRevenue: plans.reduce((sum, p) => sum + p.revenue, 0) / plans.length,
    conversionRate: 8.5,
  };

  // Funciones
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      draft: 'outline',
    } as const;

    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      draft: 'Borrador',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    const variants = {
      public: 'default',
      private: 'secondary',
      invitation_only: 'outline',
    } as const;

    const labels = {
      public: 'Público',
      private: 'Privado',
      invitation_only: 'Solo invitación',
    };

    return (
      <Badge variant={variants[visibility as keyof typeof variants] || 'default'}>
        {labels[visibility as keyof typeof labels] || visibility}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      basic: Star,
      premium: Crown,
      enterprise: Shield,
    };

    const Icon = icons[category as keyof typeof icons] || Star;
    return <Icon className="w-4 h-4" />;
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const statusMatch = filterStatus === 'all' || plan.status === filterStatus;
      const categoryMatch = filterCategory === 'all' || plan.category === filterCategory;
      return statusMatch && categoryMatch;
    });
  }, [plans, filterStatus, filterCategory]);

  const createPlan = () => {
    // Lógica para crear plan
    console.log('Creando nuevo plan...');
    setIsCreateDialogOpen(false);
  };

  const editPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsEditDialogOpen(true);
  };

  const duplicatePlan = (plan: Plan) => {
    const newPlan: Plan = {
      ...plan,
      id: Date.now().toString(),
      name: `${plan.name} (Copia)`,
      status: 'draft',
      subscribersCount: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPlans([...plans, newPlan]);
  };

  const deletePlan = (planId: string) => {
    setPlans(plans.filter(p => p.id !== planId));
    setIsDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const togglePlanStatus = (planId: string) => {
    setPlans(plans.map(plan => 
      plan.id === planId 
        ? { ...plan, status: plan.status === 'active' ? 'inactive' : 'active' }
        : plan
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Planes</h1>
          <p className="text-muted-foreground">
            Administra planes de suscripción, precios y características
          </p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Planes</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planStats.totalPlans}</div>
            <p className="text-xs text-muted-foreground">
              {planStats.activePlans} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscriptores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planStats.totalSubscribers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Conversión: {planStats.conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(planStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {formatCurrency(planStats.averageRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Más Popular</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pro</div>
            <p className="text-xs text-muted-foreground">
              {plans.find(p => p.name === 'Pro')?.subscribersCount} suscriptores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Planes de Suscripción</CardTitle>
          <CardDescription>
            Gestiona todos los planes disponibles en tu plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Suscriptores</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Visibilidad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: plan.color }}
                      >
                        {getCategoryIcon(plan.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plan.name}</span>
                          {plan.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {plan.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {plan.pricing.map((price) => (
                        <div key={price.id} className="text-sm">
                          <span className="font-medium">
                            {formatCurrency(price.price)}
                          </span>
                          <span className="text-muted-foreground">/{price.interval === 'monthly' ? 'mes' : 'año'}</span>
                          {price.discount && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              -{price.discount}%
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {plan.subscribersCount.toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      {formatCurrency(plan.revenue)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(plan.status)}
                  </TableCell>
                  <TableCell>
                    {getVisibilityBadge(plan.visibility)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editPlan(plan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicatePlan(plan)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlanStatus(plan.id)}
                      >
                        {plan.status === 'active' ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPlanToDelete(plan.id);
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

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Plan</DialogTitle>
            <DialogDescription>
              Configura un nuevo plan de suscripción con todas sus características
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="pricing">Precios</TabsTrigger>
              <TabsTrigger value="features">Características</TabsTrigger>
              <TabsTrigger value="limits">Límites</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planName">Nombre del Plan</Label>
                  <Input id="planName" placeholder="Ej: Plan Pro" />
                </div>
                <div>
                  <Label htmlFor="planCategory">Categoría</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="planDescription">Descripción</Label>
                <Textarea 
                  id="planDescription" 
                  placeholder="Describe las ventajas de este plan..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planColor">Color del Plan</Label>
                  <Input id="planColor" type="color" defaultValue="#3b82f6" />
                </div>
                <div>
                  <Label htmlFor="planVisibility">Visibilidad</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar visibilidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                      <SelectItem value="invitation_only">Solo invitación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="pricing" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Configuración de Precios</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyPrice">Precio Mensual (€)</Label>
                    <Input id="monthlyPrice" type="number" step="0.01" placeholder="29.99" />
                  </div>
                  <div>
                    <Label htmlFor="yearlyPrice">Precio Anual (€)</Label>
                    <Input id="yearlyPrice" type="number" step="0.01" placeholder="299.99" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trialDays">Días de Prueba</Label>
                    <Input id="trialDays" type="number" placeholder="14" />
                  </div>
                  <div>
                    <Label htmlFor="setupFee">Tarifa de Configuración (€)</Label>
                    <Input id="setupFee" type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Características del Plan</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Streaming HD</Label>
                      <p className="text-sm text-muted-foreground">Calidad hasta 1080p</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Streaming 4K</Label>
                      <p className="text-sm text-muted-foreground">Calidad hasta 4K</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Chat en Vivo</Label>
                      <p className="text-sm text-muted-foreground">Interacción con audiencia</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Analytics Avanzados</Label>
                      <p className="text-sm text-muted-foreground">Métricas detalladas</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Personalización</Label>
                      <p className="text-sm text-muted-foreground">Branding personalizado</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="limits" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Límites y Cuotas</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storageLimit">Almacenamiento (GB)</Label>
                    <Input id="storageLimit" type="number" placeholder="100" />
                  </div>
                  <div>
                    <Label htmlFor="bandwidthLimit">Ancho de Banda (GB/mes)</Label>
                    <Input id="bandwidthLimit" type="number" placeholder="1000" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="streamLimit">Streams Simultáneos</Label>
                    <Input id="streamLimit" type="number" placeholder="3" />
                  </div>
                  <div>
                    <Label htmlFor="uploadLimit">Subidas por Mes</Label>
                    <Input id="uploadLimit" type="number" placeholder="200" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Almacenamiento Ilimitado</Label>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Ancho de Banda Ilimitado</Label>
                    <Switch />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createPlan}>
              Crear Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El plan será eliminado permanentemente.
              Los suscriptores actuales mantendrán su acceso hasta que expire su suscripción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => planToDelete && deletePlan(planToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedPlanManagement;
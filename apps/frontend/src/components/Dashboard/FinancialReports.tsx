import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
} from 'lucide-react';

// Interfaces
interface RevenueData {
  date: string;
  subscriptions: number;
  ppv: number;
  ads: number;
  total: number;
}

interface UserMetrics {
  date: string;
  newUsers: number;
  activeUsers: number;
  churnRate: number;
  conversionRate: number;
}

interface FinancialSummary {
  totalRevenue: number;
  monthlyGrowth: number;
  arpu: number;
  ltv: number;
  churnRate: number;
  conversionRate: number;
  activeSubscriptions: number;
  totalTransactions: number;
}

interface TopCreator {
  id: string;
  name: string;
  avatar: string;
  revenue: number;
  subscribers: number;
  growth: number;
}

interface RevenueByPlan {
  plan: string;
  revenue: number;
  subscribers: number;
  color: string;
}

interface Transaction {
  id: string;
  date: string;
  user: string;
  type: 'subscription' | 'ppv' | 'refund';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  plan?: string;
}

const FinancialReports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState('overview');
  const [selectedPlan, setSelectedPlan] = useState('all');

  // Datos de ejemplo
  const revenueData: RevenueData[] = [
    { date: '2024-01-01', subscriptions: 12500, ppv: 3200, ads: 800, total: 16500 },
    { date: '2024-01-02', subscriptions: 13200, ppv: 3400, ads: 850, total: 17450 },
    { date: '2024-01-03', subscriptions: 12800, ppv: 3600, ads: 900, total: 17300 },
    { date: '2024-01-04', subscriptions: 14100, ppv: 3800, ads: 920, total: 18820 },
    { date: '2024-01-05', subscriptions: 15200, ppv: 4100, ads: 980, total: 20280 },
    { date: '2024-01-06', subscriptions: 14800, ppv: 3900, ads: 950, total: 19650 },
    { date: '2024-01-07', subscriptions: 16500, ppv: 4300, ads: 1100, total: 21900 },
  ];

  const userMetrics: UserMetrics[] = [
    { date: '2024-01-01', newUsers: 245, activeUsers: 12500, churnRate: 2.1, conversionRate: 8.5 },
    { date: '2024-01-02', newUsers: 289, activeUsers: 12650, churnRate: 2.0, conversionRate: 8.8 },
    { date: '2024-01-03', newUsers: 312, activeUsers: 12800, churnRate: 1.9, conversionRate: 9.1 },
    { date: '2024-01-04', newUsers: 278, activeUsers: 12950, churnRate: 2.2, conversionRate: 8.7 },
    { date: '2024-01-05', newUsers: 334, activeUsers: 13100, churnRate: 1.8, conversionRate: 9.3 },
    { date: '2024-01-06', newUsers: 298, activeUsers: 13200, churnRate: 2.0, conversionRate: 8.9 },
    { date: '2024-01-07', newUsers: 356, activeUsers: 13400, churnRate: 1.7, conversionRate: 9.5 },
  ];

  const financialSummary: FinancialSummary = {
    totalRevenue: 142800,
    monthlyGrowth: 12.5,
    arpu: 24.50,
    ltv: 180.75,
    churnRate: 1.9,
    conversionRate: 9.1,
    activeSubscriptions: 5834,
    totalTransactions: 8945,
  };

  const topCreators: TopCreator[] = [
    {
      id: '1',
      name: 'Ana García',
      avatar: '/avatars/ana.jpg',
      revenue: 8950,
      subscribers: 1245,
      growth: 15.2,
    },
    {
      id: '2',
      name: 'Carlos Mendez',
      avatar: '/avatars/carlos.jpg',
      revenue: 7650,
      subscribers: 1089,
      growth: 12.8,
    },
    {
      id: '3',
      name: 'Sofia Rodriguez',
      avatar: '/avatars/sofia.jpg',
      revenue: 6890,
      subscribers: 987,
      growth: 18.5,
    },
    {
      id: '4',
      name: 'Miguel Torres',
      avatar: '/avatars/miguel.jpg',
      revenue: 6234,
      subscribers: 876,
      growth: 9.3,
    },
    {
      id: '5',
      name: 'Laura Vega',
      avatar: '/avatars/laura.jpg',
      revenue: 5678,
      subscribers: 765,
      growth: 22.1,
    },
  ];

  const revenueByPlan: RevenueByPlan[] = [
    { plan: 'Básico', revenue: 45600, subscribers: 3800, color: '#3b82f6' },
    { plan: 'Pro', revenue: 67200, subscribers: 1680, color: '#10b981' },
    { plan: 'Premium', revenue: 30000, subscribers: 354, color: '#f59e0b' },
  ];

  const recentTransactions: Transaction[] = [
    {
      id: 'TXN-001',
      date: '2024-01-07 14:30',
      user: 'usuario@email.com',
      type: 'subscription',
      amount: 219.00,
      status: 'completed',
      plan: 'Pro',
    },
    {
      id: 'TXN-002',
      date: '2024-01-07 14:25',
      user: 'otro@email.com',
      type: 'ppv',
      amount: 25.00,
      status: 'completed',
    },
    {
      id: 'TXN-003',
      date: '2024-01-07 14:20',
      user: 'cliente@email.com',
      type: 'subscription',
      amount: 999.00,
      status: 'pending',
      plan: 'Premium',
    },
    {
      id: 'TXN-004',
      date: '2024-01-07 14:15',
      user: 'test@email.com',
      type: 'refund',
      amount: -19.99,
      status: 'completed',
      plan: 'Básico',
    },
  ];

  // Funciones
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status === 'completed' ? 'Completado' : 
         status === 'pending' ? 'Pendiente' : 'Fallido'}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      subscription: 'default',
      ppv: 'secondary',
      refund: 'destructive',
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {type === 'subscription' ? 'Suscripción' : 
         type === 'ppv' ? 'PPV' : 'Reembolso'}
      </Badge>
    );
  };

  const exportReport = () => {
    // Lógica para exportar reporte

  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reportes Financieros</h1>
          <p className="text-muted-foreground">
            Análisis detallado de ingresos y métricas de negocio
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              +{formatPercentage(financialSummary.monthlyGrowth)} vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.arpu)}</div>
            <p className="text-xs text-muted-foreground">
              Ingreso promedio por usuario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(financialSummary.conversionRate)}</div>
            <p className="text-xs text-muted-foreground">
              De visitantes a suscriptores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.activeSubscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Churn rate: {formatPercentage(financialSummary.churnRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="creators">Creadores</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Ingresos</CardTitle>
                <CardDescription>
                  Ingresos por fuente en los últimos 7 días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tickFormatter={(value) => `€${value}`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('es-ES')}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="subscriptions" 
                      stackId="1" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      name="Suscripciones"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ppv" 
                      stackId="1" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      name="PPV"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ads" 
                      stackId="1" 
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      name="Publicidad"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Plan</CardTitle>
                <CardDescription>
                  Distribución de ingresos por tipo de suscripción
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByPlan}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ plan, revenue }) => `${plan}: ${formatCurrency(revenue)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {revenueByPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Creators */}
          <Card>
            <CardHeader>
              <CardTitle>Top Creadores por Ingresos</CardTitle>
              <CardDescription>
                Creadores que más ingresos han generado este mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creador</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Suscriptores</TableHead>
                    <TableHead>Crecimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCreators.map((creator) => (
                    <TableRow key={creator.id}>
                      <TableCell className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {creator.name.charAt(0)}
                        </div>
                        <span className="font-medium">{creator.name}</span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(creator.revenue)}
                      </TableCell>
                      <TableCell>{creator.subscribers.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {creator.growth > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          <span className={creator.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(Math.abs(creator.growth))}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Detallado de Ingresos</CardTitle>
              <CardDescription>
                Desglose completo de todas las fuentes de ingresos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tickFormatter={(value) => `€${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('es-ES')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    name="Total"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="subscriptions" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Suscripciones"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ppv" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="PPV"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ads" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Publicidad"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Usuarios</CardTitle>
              <CardDescription>
                Análisis de crecimiento y comportamiento de usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => new Date(label).toLocaleDateString('es-ES')}
                  />
                  <Legend />
                  <Bar dataKey="newUsers" fill="#3b82f6" name="Nuevos Usuarios" />
                  <Bar dataKey="activeUsers" fill="#10b981" name="Usuarios Activos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Creadores</CardTitle>
              <CardDescription>
                Rendimiento y estadísticas de los creadores de contenido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creador</TableHead>
                    <TableHead>Ingresos del Mes</TableHead>
                    <TableHead>Suscriptores</TableHead>
                    <TableHead>Crecimiento</TableHead>
                    <TableHead>ARPU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCreators.map((creator) => (
                    <TableRow key={creator.id}>
                      <TableCell className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {creator.name.charAt(0)}
                        </div>
                        <span className="font-medium">{creator.name}</span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(creator.revenue)}
                      </TableCell>
                      <TableCell>{creator.subscribers.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {creator.growth > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          <span className={creator.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(Math.abs(creator.growth))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(creator.revenue / creator.subscribers)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>
                Historial detallado de todas las transacciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.id}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleString('es-ES')}
                      </TableCell>
                      <TableCell>{transaction.user}</TableCell>
                      <TableCell>
                        {getTypeBadge(transaction.type)}
                      </TableCell>
                      <TableCell className={`font-medium ${
                        transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {transaction.plan || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;
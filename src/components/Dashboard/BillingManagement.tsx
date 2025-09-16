import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  Download,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Receipt,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  planName: string;
  amount: number;
  tax: number;
  discount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: 'subscription' | 'one_time' | 'refund' | 'chargeback';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer' | 'crypto';
  gateway: 'stripe' | 'paypal' | 'square' | 'coinbase';
  gatewayTransactionId: string;
  invoiceId?: string;
  description: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

interface PaymentMethod {
  id: string;
  userId: string;
  type: 'credit_card' | 'bank_account' | 'paypal';
  isDefault: boolean;
  isActive: boolean;
  // Credit Card
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  // Bank Account
  bankName?: string;
  accountLast4?: string;
  // PayPal
  paypalEmail?: string;
  createdAt: string;
  updatedAt: string;
}

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageTransactionValue: number;
  churnRate: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
}

export const BillingManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Mock data - replace with API calls
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        userId: 'user1',
        userEmail: 'juan@example.com',
        userName: 'Juan Pérez',
        planName: 'Plan Professional',
        amount: 25.00,
        tax: 5.40,
        discount: 0,
        totalAmount: 35.39,
        currency: 'USD',
        status: 'paid',
        dueDate: '2024-02-15',
        paidDate: '2024-01-16',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T14:30:00Z',
        items: [
          {
            id: '1',
            description: 'Plan Professional - Mensual',
            quantity: 1,
            unitPrice: 25.00,
        totalPrice: 25.00
          }
        ],
        paymentMethod: 'Visa ****1234',
        transactionId: 'txn_123456789'
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        userId: 'user2',
        userEmail: 'ana@example.com',
        userName: 'Ana García',
        planName: 'Plan Enterprise',
        amount: 219.00,
        tax: 18.00,
        discount: 10.00,
        totalAmount: 107.99,
        currency: 'USD',
        status: 'overdue',
        dueDate: '2024-01-20',
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-20T09:00:00Z',
        items: [
          {
            id: '1',
            description: 'Plan Enterprise - Mensual',
            quantity: 1,
            unitPrice: 219.00,
        totalPrice: 219.00
          }
        ]
      },
      {
        id: '3',
        invoiceNumber: 'INV-2024-003',
        userId: 'user3',
        userEmail: 'carlos@example.com',
        userName: 'Carlos López',
        planName: 'Plan Starter',
        amount: 25.00,
        tax: 1.80,
        discount: 0,
        totalAmount: 11.79,
        currency: 'USD',
        status: 'sent',
        dueDate: '2024-02-25',
        createdAt: '2024-01-25T15:00:00Z',
        updatedAt: '2024-01-25T15:00:00Z',
        items: [
          {
            id: '1',
            description: 'Plan Starter - Mensual',
            quantity: 1,
            unitPrice: 25.00,
        totalPrice: 25.00
          }
        ]
      }
    ];

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        userId: 'user1',
        userEmail: 'juan@example.com',
        type: 'subscription',
        amount: 35.39,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'credit_card',
        gateway: 'stripe',
        gatewayTransactionId: 'pi_1234567890',
        invoiceId: '1',
        description: 'Plan Professional - Pago mensual',
        createdAt: '2024-01-16T14:30:00Z',
        processedAt: '2024-01-16T14:31:00Z'
      },
      {
        id: '2',
        userId: 'user4',
        userEmail: 'maria@example.com',
        type: 'one_time',
        amount: 50.00,
        currency: 'USD',
        status: 'failed',
        paymentMethod: 'credit_card',
        gateway: 'stripe',
        gatewayTransactionId: 'pi_0987654321',
        description: 'Compra de créditos adicionales',
        createdAt: '2024-01-20T10:15:00Z',
        failureReason: 'Tarjeta declinada - fondos insuficientes'
      },
      {
        id: '3',
        userId: 'user2',
        userEmail: 'ana@example.com',
        type: 'refund',
        amount: -25.00,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'credit_card',
        gateway: 'stripe',
        gatewayTransactionId: 're_1122334455',
        description: 'Reembolso parcial - Plan Enterprise',
        createdAt: '2024-01-18T16:45:00Z',
        processedAt: '2024-01-18T16:47:00Z'
      }
    ];

    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: '1',
        userId: 'user1',
        type: 'credit_card',
        isDefault: true,
        isActive: true,
        cardLast4: '1234',
        cardBrand: 'Visa',
        cardExpMonth: 12,
        cardExpYear: 2026,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        userId: 'user2',
        type: 'paypal',
        isDefault: true,
        isActive: true,
        paypalEmail: 'ana@example.com',
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-05T00:00:00Z'
      }
    ];

    const mockStats: BillingStats = {
      totalRevenue: 125847.50,
      monthlyRevenue: 15420.30,
      totalInvoices: 1247,
      paidInvoices: 1089,
      overdueInvoices: 23,
      totalTransactions: 2156,
      successfulTransactions: 1987,
      failedTransactions: 169,
      averageTransactionValue: 58.35,
      churnRate: 3.2,
      mrr: 15420.30,
      arr: 185043.60
    };

    setInvoices(mockInvoices);
    setTransactions(mockTransactions);
    setPaymentMethods(mockPaymentMethods);
    setStats(mockStats);
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.gatewayTransactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSendInvoice = async (invoiceId: string) => {
    setLoading(true);
    try {
      // API call to send invoice
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: 'sent' as const, updatedAt: new Date().toISOString() }
          : inv
      ));
      toast.success('Factura enviada exitosamente');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Error al enviar factura');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    setLoading(true);
    try {
      // API call to mark as paid
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { 
              ...inv, 
              status: 'paid' as const, 
              paidDate: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString() 
            }
          : inv
      ));
      toast.success('Factura marcada como pagada');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Error al marcar factura como pagada');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundTransaction = async (transactionId: string, amount: number) => {
    if (!confirm(`¿Estás seguro de que quieres reembolsar $${amount}?`)) return;

    setLoading(true);
    try {
      // API call to process refund
      const refundTransaction: Transaction = {
        id: Date.now().toString(),
        userId: 'user_refund',
        userEmail: 'refund@example.com',
        type: 'refund',
        amount: -amount,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'credit_card',
        gateway: 'stripe',
        gatewayTransactionId: `re_${Date.now()}`,
        description: `Reembolso de transacción ${transactionId}`,
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      };

      setTransactions(prev => [refundTransaction, ...prev]);
      toast.success('Reembolso procesado exitosamente');
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Error al procesar reembolso');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Borrador', icon: FileText },
      sent: { variant: 'outline' as const, label: 'Enviada', icon: Send },
      paid: { variant: 'default' as const, label: 'Pagada', icon: CheckCircle, className: 'bg-green-500' },
      overdue: { variant: 'destructive' as const, label: 'Vencida', icon: AlertCircle },
      cancelled: { variant: 'secondary' as const, label: 'Cancelada', icon: XCircle },
      pending: { variant: 'outline' as const, label: 'Pendiente', icon: Clock },
      completed: { variant: 'default' as const, label: 'Completada', icon: CheckCircle, className: 'bg-green-500' },
      failed: { variant: 'destructive' as const, label: 'Fallida', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={'className' in config ? config.className : ''}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!stats) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Facturación</h2>
          <p className="text-muted-foreground mt-1">
            Administra facturas, transacciones y métodos de pago
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Ingresos Totales</span>
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +12.5% vs mes anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">MRR</span>
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(stats.mrr)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +8.3% vs mes anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Facturas Pagadas</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {stats.paidInvoices}/{stats.totalInvoices}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.paidInvoices / stats.totalInvoices) * 100).toFixed(1)}% tasa de pago
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Facturas Vencidas</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.overdueInvoices}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.overdueInvoices / stats.totalInvoices) * 100).toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Transacciones Exitosas</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {stats.successfulTransactions}/{stats.totalTransactions}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.successfulTransactions / stats.totalTransactions) * 100).toFixed(1)}% tasa de éxito
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Tasa de Abandono</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.churnRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  -0.5% vs mes anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Valor Promedio</span>
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(stats.averageTransactionValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Por transacción
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Facturas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{invoice.userEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.userEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.amount < 0 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar facturas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="sent">Enviadas</SelectItem>
                    <SelectItem value="paid">Pagadas</SelectItem>
                    <SelectItem value="overdue">Vencidas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 90 días</SelectItem>
                    <SelectItem value="365">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Facturas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.userName}</p>
                          <p className="text-sm text-muted-foreground">{invoice.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.planName}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleSendInvoice(invoice.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marcar como Pagada
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Descargar PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar transacciones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="completed">Completadas</SelectItem>
                    <SelectItem value="failed">Fallidas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transacción</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.gatewayTransactionId}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-muted-foreground">{transaction.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.type === 'subscription' ? 'Suscripción' :
                           transaction.type === 'one_time' ? 'Único' :
                           transaction.type === 'refund' ? 'Reembolso' : 'Contracargo'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-medium ${
                        transaction.amount < 0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {transaction.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="capitalize">
                            {transaction.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            {transaction.status === 'completed' && transaction.amount > 0 && (
                              <DropdownMenuItem 
                                onClick={() => handleRefundTransaction(transaction.id, transaction.amount)}
                                className="text-red-600"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reembolsar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalles</TableHead>
                    <TableHead>Por Defecto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Agregado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>{method.userId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="capitalize">
                            {method.type.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {method.type === 'credit_card' && (
                          <span>{method.cardBrand} ****{method.cardLast4}</span>
                        )}
                        {method.type === 'paypal' && (
                          <span>{method.paypalEmail}</span>
                        )}
                        {method.type === 'bank_account' && (
                          <span>{method.bankName} ****{method.accountLast4}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {method.isDefault ? (
                          <Badge variant="default">Por Defecto</Badge>
                        ) : (
                          <Badge variant="outline">Secundario</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {method.isActive ? (
                          <Badge variant="default" className="bg-green-500">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(method.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Ingresos por Suscripciones</span>
                    <span className="font-bold">{formatCurrency(stats.mrr * 0.8)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ingresos por Pagos Únicos</span>
                    <span className="font-bold">{formatCurrency(stats.mrr * 0.15)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Otros Ingresos</span>
                    <span className="font-bold">{formatCurrency(stats.mrr * 0.05)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Mensual</span>
                    <span>{formatCurrency(stats.mrr)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Tasa de Conversión</span>
                    <span className="font-bold">12.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tiempo Promedio de Pago</span>
                    <span className="font-bold">2.3 días</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tasa de Reembolso</span>
                    <span className="font-bold">1.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>LTV Promedio</span>
                    <span className="font-bold">{formatCurrency(450)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Factura {selectedInvoice.invoiceNumber}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="font-medium">{selectedInvoice.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.userEmail}</p>
                </div>
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Vencimiento</Label>
                  <p>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
                {selectedInvoice.paidDate && (
                  <div>
                    <Label>Fecha de Pago</Label>
                    <p>{new Date(selectedInvoice.paidDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div>
                <Label>Artículos</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.amount)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento:</span>
                      <span>-{formatCurrency(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span>{formatCurrency(selectedInvoice.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label>Notas</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BillingManagement;
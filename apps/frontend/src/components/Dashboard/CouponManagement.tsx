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
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Copy,
  Gift,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'free_trial';
  value: number; // percentage or fixed amount
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usageCount: number;
  userLimit: number; // max uses per user
  validPlans: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  isPublic: boolean; // public coupons vs private/targeted
  targetUsers?: string[]; // specific users who can use this coupon
  createdAt: string;
  updatedAt: string;
}

interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  userEmail: string;
  orderId: string;
  discountAmount: number;
  usedAt: string;
}

const defaultCoupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  value: 10,
  usageLimit: 100,
  userLimit: 1,
  validPlans: [],
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  isActive: true,
  isPublic: true
};

export const CouponManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponUsages, setCouponUsages] = useState<CouponUsage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [newCoupon, setNewCoupon] = useState(defaultCoupon);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with API calls
  useEffect(() => {
    const mockCoupons: Coupon[] = [
      {
        id: '1',
        code: 'WELCOME50',
        name: 'Bienvenida 50%',
        description: 'Descuento de bienvenida para nuevos usuarios',
        type: 'percentage',
        value: 50,
        minOrderAmount: 10,
        maxDiscountAmount: 100,
        usageLimit: 1000,
        usageCount: 245,
        userLimit: 1,
        validPlans: ['starter', 'professional'],
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isActive: true,
        isPublic: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        code: 'UPGRADE25',
        name: 'Upgrade 25%',
        description: 'Descuento para usuarios que actualizan su plan',
        type: 'percentage',
        value: 25,
        usageLimit: 500,
        usageCount: 89,
        userLimit: 1,
        validPlans: ['professional', 'enterprise'],
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        isActive: true,
        isPublic: false,
        targetUsers: ['user1@example.com', 'user2@example.com'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T15:45:00Z'
      },
      {
        id: '3',
        code: 'FIXED20',
        name: 'Descuento Fijo $20',
        description: 'Descuento fijo de $20 en cualquier plan',
        type: 'fixed_amount',
        value: 20,
        minOrderAmount: 50,
        usageLimit: 200,
        usageCount: 156,
        userLimit: 2,
        validPlans: ['starter', 'professional', 'enterprise'],
        startDate: '2024-02-01',
        endDate: '2024-03-31',
        isActive: false,
        isPublic: true,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-03-31T23:59:59Z'
      }
    ];

    const mockUsages: CouponUsage[] = [
      {
        id: '1',
        couponId: '1',
        userId: 'user1',
        userEmail: 'juan@example.com',
        orderId: 'order_123',
        discountAmount: 25.50,
        usedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        couponId: '1',
        userId: 'user2',
        userEmail: 'ana@example.com',
        orderId: 'order_124',
        discountAmount: 15.00,
        usedAt: '2024-01-16T14:20:00Z'
      }
    ];

    setCoupons(mockCoupons);
    setCouponUsages(mockUsages);
  }, []);

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          coupon.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && coupon.isActive) ||
                         (statusFilter === 'inactive' && !coupon.isActive) ||
                         (statusFilter === 'expired' && new Date(coupon.endDate) < new Date());
    const matchesType = typeFilter === 'all' || coupon.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.name) {
      toast.error('Código y nombre son requeridos');
      return;
    }

    // Check if code already exists
    if (coupons.some(c => c.code.toLowerCase() === newCoupon.code.toLowerCase())) {
      toast.error('El código del cupón ya existe');
      return;
    }

    setLoading(true);
    try {
      const coupon: Coupon = {
        ...newCoupon,
        id: Date.now().toString(),
        code: newCoupon.code.toUpperCase(),
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCoupons(prev => [...prev, coupon]);
      setNewCoupon(defaultCoupon);
      setIsCreateModalOpen(false);
      toast.success('Cupón creado exitosamente');
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error('Error al crear cupón');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return;

    setLoading(true);
    try {
      setCoupons(prev => prev.map(c => 
        c.id === editingCoupon.id 
          ? { ...editingCoupon, updatedAt: new Date().toISOString() }
          : c
      ));
      setEditingCoupon(null);
      toast.success('Cupón actualizado exitosamente');
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast.error('Error al actualizar cupón');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cupón?')) return;

    setLoading(true);
    try {
      setCoupons(prev => prev.filter(c => c.id !== couponId));
      toast.success('Cupón eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Error al eliminar cupón');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (couponId: string, isActive: boolean) => {
    setLoading(true);
    try {
      setCoupons(prev => prev.map(c => 
        c.id === couponId 
          ? { ...c, isActive, updatedAt: new Date().toISOString() }
          : c
      ));
      toast.success(`Cupón ${isActive ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      toast.error('Error al cambiar estado del cupón');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Código copiado al portapapeles');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="w-4 h-4 text-green-500" />;
      case 'fixed_amount': return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'free_trial': return <Gift className="w-4 h-4 text-purple-500" />;
      default: return <Gift className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const endDate = new Date(coupon.endDate);
    const startDate = new Date(coupon.startDate);

    if (!coupon.isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (now > endDate) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (now < startDate) {
      return <Badge variant="outline">Programado</Badge>;
    }
    if (coupon.usageCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Agotado</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">Activo</Badge>;
  };

  const formatValue = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}%`;
      case 'fixed_amount':
        return `$${coupon.value}`;
      case 'free_trial':
        return `${coupon.value} días gratis`;
      default:
        return coupon.value.toString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Cupones</h2>
          <p className="text-muted-foreground mt-1">
            Crea y administra cupones de descuento y códigos promocionales
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cupón
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cupón</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coupon-code">Código del Cupón *</Label>
                  <Input
                    id="coupon-code"
                    placeholder="DESCUENTO50"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <Label htmlFor="coupon-name">Nombre *</Label>
                  <Input
                    id="coupon-name"
                    placeholder="Descuento de Bienvenida"
                    value={newCoupon.name}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="coupon-description">Descripción</Label>
                <Textarea
                  id="coupon-description"
                  placeholder="Descripción del cupón..."
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Discount Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coupon-type">Tipo de Descuento</Label>
                  <Select 
                    value={newCoupon.type} 
                    onValueChange={(value: 'percentage' | 'fixed_amount' | 'free_trial') => 
                      setNewCoupon(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje</SelectItem>
                      <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
                      <SelectItem value="free_trial">Prueba Gratuita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="coupon-value">
                    {newCoupon.type === 'percentage' ? 'Porcentaje (%)' : 
                     newCoupon.type === 'fixed_amount' ? 'Monto ($)' : 'Días Gratis'}
                  </Label>
                  <Input
                    id="coupon-value"
                    type="number"
                    min="0"
                    max={newCoupon.type === 'percentage' ? "100" : undefined}
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Advanced Options */}
              {newCoupon.type !== 'free_trial' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-order">Monto Mínimo de Orden ($)</Label>
                    <Input
                      id="min-order"
                      type="number"
                      min="0"
                      value={newCoupon.minOrderAmount || ''}
                      onChange={(e) => setNewCoupon(prev => ({ 
                        ...prev, 
                        minOrderAmount: parseFloat(e.target.value) || undefined 
                      }))}
                    />
                  </div>
                  {newCoupon.type === 'percentage' && (
                    <div>
                      <Label htmlFor="max-discount">Descuento Máximo ($)</Label>
                      <Input
                        id="max-discount"
                        type="number"
                        min="0"
                        value={newCoupon.maxDiscountAmount || ''}
                        onChange={(e) => setNewCoupon(prev => ({ 
                          ...prev, 
                          maxDiscountAmount: parseFloat(e.target.value) || undefined 
                        }))}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage-limit">Límite Total de Usos</Label>
                  <Input
                    id="usage-limit"
                    type="number"
                    min="1"
                    value={newCoupon.usageLimit}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, usageLimit: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="user-limit">Límite por Usuario</Label>
                  <Input
                    id="user-limit"
                    type="number"
                    min="1"
                    value={newCoupon.userLimit}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, userLimit: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Fecha de Inicio</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={newCoupon.startDate}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Fecha de Fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={newCoupon.endDate}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cupón Público</Label>
                    <p className="text-sm text-muted-foreground">
                      Los cupones públicos pueden ser usados por cualquier usuario
                    </p>
                  </div>
                  <Switch
                    checked={newCoupon.isPublic}
                    onCheckedChange={(checked) => setNewCoupon(prev => ({ ...prev, isPublic: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activar Inmediatamente</Label>
                    <p className="text-sm text-muted-foreground">
                      El cupón estará disponible para usar inmediatamente
                    </p>
                  </div>
                  <Switch
                    checked={newCoupon.isActive}
                    onCheckedChange={(checked) => setNewCoupon(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleCreateCoupon}
                  disabled={!newCoupon.code || !newCoupon.name || loading}
                  className="flex-1"
                >
                  {loading ? 'Creando...' : 'Crear Cupón'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNewCoupon(defaultCoupon);
                    setIsCreateModalOpen(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Cupones</span>
            </div>
            <p className="text-2xl font-bold mt-2">{coupons.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Cupones Activos</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {coupons.filter(c => c.isActive && new Date(c.endDate) > new Date()).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Usos Este Mes</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {couponUsages.filter(u => 
                new Date(u.usedAt).getMonth() === new Date().getMonth()
              ).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Descuento Total</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              ${couponUsages.reduce((sum, usage) => sum + usage.discountAmount, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar cupones..."
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
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="percentage">Porcentaje</SelectItem>
                <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
                <SelectItem value="free_trial">Prueba Gratuita</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cupones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Validez</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(coupon.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{coupon.name}</p>
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground">{coupon.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(coupon.type)}
                      <span className="capitalize">
                        {coupon.type === 'percentage' ? 'Porcentaje' :
                         coupon.type === 'fixed_amount' ? 'Monto Fijo' : 'Prueba Gratuita'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatValue(coupon)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{coupon.usageCount} / {coupon.usageLimit}</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(coupon.usageCount / coupon.usageLimit) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(coupon.startDate).toLocaleDateString()}</p>
                      <p className="text-muted-foreground">
                        hasta {new Date(coupon.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(coupon)}
                      <Switch
                        checked={coupon.isActive}
                        onCheckedChange={(checked) => handleToggleStatus(coupon.id, checked)}
                        disabled={loading}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCoupon(coupon)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyToClipboard(coupon.code)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Código
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCoupons.length === 0 && (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron cupones</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primer cupón para comenzar'}
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Cupón
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingCoupon && (
        <Dialog open={!!editingCoupon} onOpenChange={() => setEditingCoupon(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Cupón: {editingCoupon.code}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Similar form fields as create modal but with editingCoupon state */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-coupon-name">Nombre *</Label>
                  <Input
                    id="edit-coupon-name"
                    value={editingCoupon.name}
                    onChange={(e) => setEditingCoupon(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-coupon-value">
                    {editingCoupon.type === 'percentage' ? 'Porcentaje (%)' : 
                     editingCoupon.type === 'fixed_amount' ? 'Monto ($)' : 'Días Gratis'}
                  </Label>
                  <Input
                    id="edit-coupon-value"
                    type="number"
                    value={editingCoupon.value}
                    onChange={(e) => setEditingCoupon(prev => prev ? { ...prev, value: parseFloat(e.target.value) || 0 } : null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-coupon-description">Descripción</Label>
                <Textarea
                  id="edit-coupon-description"
                  value={editingCoupon.description}
                  onChange={(e) => setEditingCoupon(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleUpdateCoupon}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Cupón'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingCoupon(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CouponManagement;
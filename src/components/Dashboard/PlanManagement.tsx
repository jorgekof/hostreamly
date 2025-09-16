import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  description: string;
  storage: number; // GB
  bandwidth: number; // TB
  customPlayers: number;
  analytics: 'basic' | 'advanced' | 'enterprise';
  apiAccess: boolean;
  webhooks: boolean;
  whiteLabel: boolean;
  support: 'email' | 'priority' | '24/7';
  users: number;
  sla: boolean;
  active: boolean;
  popular: boolean;
  features: string[];
}

interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  validPlans: string[];
  startDate: string;
  endDate: string;
  maxUses: number;
  currentUses: number;
  active: boolean;
}

const defaultPlan: Omit<Plan, 'id'> = {
  name: '',
  price: 0,
  period: 'monthly',
  description: '',
  storage: 100,
  bandwidth: 1,
  customPlayers: 1,
  analytics: 'basic',
  apiAccess: false,
  webhooks: false,
  whiteLabel: false,
  support: 'email',
  users: 1,
  sla: false,
  active: true,
  popular: false,
  features: []
};

const defaultPromotion: Omit<Promotion, 'id'> = {
  code: '',
  name: '',
  description: '',
  discount: 0,
  discountType: 'percentage',
  validPlans: [],
  startDate: '',
  endDate: '',
  maxUses: 100,
  currentUses: 0,
  active: true
};

export const PlanManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: '1',
      name: 'Starter',
      price: 29,
      period: 'monthly',
      description: 'Perfect para comenzar con hosting de videos',
      storage: 100,
      bandwidth: 1,
      customPlayers: 1,
      analytics: 'basic',
      apiAccess: false,
      webhooks: false,
      whiteLabel: false,
      support: 'email',
      users: 1,
      sla: false,
      active: true,
      popular: false,
      features: ['100GB Almacenamiento', '1TB Ancho de banda', '20 horas de visualización mensual', 'Reproductor personalizable', 'Analíticas básicas', 'CDN global básico', 'Protección hotlink básica', 'Compresión automática', 'Soporte por email']
    },
    {
      id: '2',
      name: 'Professional',
      price: 219,
      period: 'monthly',
      description: 'Para empresas que necesitan más funcionalidades',
      storage: 1000,
      bandwidth: 10,
      customPlayers: 5,
      analytics: 'advanced',
      apiAccess: true,
      webhooks: true,
      whiteLabel: false,
      support: 'priority',
      users: 5,
      sla: false,
      active: true,
      popular: true,
      features: ['1TB Almacenamiento', '10TB Ancho de banda', '200 horas de visualización mensual', 'Live streaming no incluido', '5 Reproductores personalizados', 'Analíticas avanzadas', 'API completa', 'Webhooks', 'CDN optimizado con caché inteligente', 'DRM básico incluido', 'Rate limiting personalizable', 'Monitoreo de performance', 'Soporte prioritario', 'Hasta 5 usuarios', 'Cobro adicional: $0.05/GB excedente']
    },
    {
      id: '3',
      name: 'Enterprise',
      price: 999,
      period: 'monthly',
      description: 'Para grandes empresas con necesidades específicas de streaming 4K',
      storage: 3500,
      bandwidth: 35,
      customPlayers: 20,
      analytics: 'enterprise',
      apiAccess: true,
      webhooks: true,
      whiteLabel: true,
      support: '24/7',
      users: 15,
      sla: true,
      active: true,
      popular: false,
      features: ['3.5TB Almacenamiento', '35TB Ancho de banda', '500 horas de visualización mensual', '15 horas mensuales de live streaming 4K', '60 espectadores simultáneos máximo', '20 Reproductores personalizados', 'Analíticas empresariales', 'API completa', 'Webhooks avanzados', 'Marca blanca completa', 'CDN premium con edge computing', 'DRM avanzado (Widevine, PlayReady)', 'Rate limiting empresarial', 'Monitoreo 24/7', 'Soporte dedicado', 'Hasta 15 usuarios administradores', 'SLA 99.9%', 'Integración personalizada', 'Cobro adicional: $0.05/GB excedente']
    }
  ]);

  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: '1',
      code: 'NEWUSER50',
      name: 'Descuento Nuevos Usuarios',
      description: '50% descuento primer mes para nuevos usuarios',
      discount: 50,
      discountType: 'percentage',
      validPlans: ['1', '2'],
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      maxUses: 1000,
      currentUses: 234,
      active: true
    },
    {
      id: '2',
      code: 'UPGRADE25',
      name: 'Descuento Upgrade',
      description: '25% descuento al actualizar plan',
      discount: 25,
      discountType: 'percentage',
      validPlans: ['2', '3'],
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      maxUses: 500,
      currentUses: 123,
      active: true
    }
  ]);

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isCreatingPromotion, setIsCreatingPromotion] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const handleSavePlan = (plan: Plan) => {
    if (editingPlan) {
      setPlans(plans.map(p => p.id === plan.id ? plan : p));
      toast.success('Plan actualizado correctamente');
    } else {
      const newPlan = { ...plan, id: Date.now().toString() };
      setPlans([...plans, newPlan]);
      toast.success('Plan creado correctamente');
    }
    setEditingPlan(null);
    setIsCreatingPlan(false);
  };

  const handleDeletePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id));
    toast.success('Plan eliminado correctamente');
  };

  const handleSavePromotion = (promotion: Promotion) => {
    if (editingPromotion) {
      setPromotions(promotions.map(p => p.id === promotion.id ? promotion : p));
      toast.success('Promoción actualizada correctamente');
    } else {
      const newPromotion = { ...promotion, id: Date.now().toString() };
      setPromotions([...promotions, newPromotion]);
      toast.success('Promoción creada correctamente');
    }
    setEditingPromotion(null);
    setIsCreatingPromotion(false);
  };

  const handleDeletePromotion = (id: string) => {
    setPromotions(promotions.filter(p => p.id !== id));
    toast.success('Promoción eliminada correctamente');
  };

  const PlanForm = ({ plan, onSave, onCancel }: { 
    plan: Plan | null; 
    onSave: (plan: Plan) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState<Plan>(plan || { ...defaultPlan, id: '' });

    const addFeature = () => {
      if (newFeature.trim()) {
        setFormData({
          ...formData,
          features: [...formData.features, newFeature.trim()]
        });
        setNewFeature('');
      }
    };

    const removeFeature = (index: number) => {
      setFormData({
        ...formData,
        features: formData.features.filter((_, i) => i !== index)
      });
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nombre del Plan</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="price">Precio</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="storage">Almacenamiento (GB)</Label>
            <Input
              id="storage"
              type="number"
              value={formData.storage}
              onChange={(e) => setFormData({ ...formData, storage: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="bandwidth">Ancho de banda (TB)</Label>
            <Input
              id="bandwidth"
              type="number"
              value={formData.bandwidth}
              onChange={(e) => setFormData({ ...formData, bandwidth: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customPlayers">Reproductores Personalizados</Label>
            <Input
              id="customPlayers"
              type="number"
              value={formData.customPlayers === -1 ? '' : formData.customPlayers}
              placeholder="Ilimitado si está vacío"
              onChange={(e) => setFormData({ 
                ...formData, 
                customPlayers: e.target.value === '' ? -1 : Number(e.target.value) 
              })}
            />
          </div>
          <div>
            <Label htmlFor="users">Usuarios</Label>
            <Input
              id="users"
              type="number"
              value={formData.users === -1 ? '' : formData.users}
              placeholder="Ilimitado si está vacío"
              onChange={(e) => setFormData({ 
                ...formData, 
                users: e.target.value === '' ? -1 : Number(e.target.value) 
              })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="analytics">Analíticas</Label>
            <Select
              value={formData.analytics}
              onValueChange={(value: 'basic' | 'advanced' | 'enterprise') => 
                setFormData({ ...formData, analytics: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Básicas</SelectItem>
                <SelectItem value="advanced">Avanzadas</SelectItem>
                <SelectItem value="enterprise">Empresariales</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="support">Soporte</Label>
            <Select
              value={formData.support}
              onValueChange={(value: 'email' | 'priority' | '24/7') => 
                setFormData({ ...formData, support: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="priority">Prioritario</SelectItem>
                <SelectItem value="24/7">24/7</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="apiAccess"
              checked={formData.apiAccess}
              onCheckedChange={(checked) => setFormData({ ...formData, apiAccess: checked })}
            />
            <Label htmlFor="apiAccess">Acceso API</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="webhooks"
              checked={formData.webhooks}
              onCheckedChange={(checked) => setFormData({ ...formData, webhooks: checked })}
            />
            <Label htmlFor="webhooks">Webhooks</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="whiteLabel"
              checked={formData.whiteLabel}
              onCheckedChange={(checked) => setFormData({ ...formData, whiteLabel: checked })}
            />
            <Label htmlFor="whiteLabel">Marca Blanca</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="sla"
              checked={formData.sla}
              onCheckedChange={(checked) => setFormData({ ...formData, sla: checked })}
            />
            <Label htmlFor="sla">SLA Garantizado</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="popular"
              checked={formData.popular}
              onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })}
            />
            <Label htmlFor="popular">Plan Popular</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Plan Activo</Label>
          </div>
        </div>

        <div>
          <Label>Características</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Agregar nueva característica"
              onKeyPress={(e) => e.key === 'Enter' && addFeature()}
            />
            <Button onClick={addFeature} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {feature}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFeature(index)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onSave(formData)}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    );
  };

  const PromotionForm = ({ promotion, onSave, onCancel }: { 
    promotion: Promotion | null; 
    onSave: (promotion: Promotion) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState<Promotion>(promotion || { ...defaultPromotion, id: '' });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Código de Promoción</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="discount">Descuento</Label>
            <Input
              id="discount"
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="discountType">Tipo de Descuento</Label>
            <Select
              value={formData.discountType}
              onValueChange={(value: 'percentage' | 'fixed') => 
                setFormData({ ...formData, discountType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Porcentaje</SelectItem>
                <SelectItem value="fixed">Cantidad Fija</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Fecha de Inicio</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endDate">Fecha de Fin</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="maxUses">Usos Máximos</Label>
          <Input
            id="maxUses"
            type="number"
            value={formData.maxUses}
            onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label>Planes Válidos</Label>
          <div className="space-y-2">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`plan-${plan.id}`}
                  checked={formData.validPlans.includes(plan.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        validPlans: [...formData.validPlans, plan.id]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        validPlans: formData.validPlans.filter(id => id !== plan.id)
                      });
                    }
                  }}
                />
                <Label htmlFor={`plan-${plan.id}`}>{plan.name}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
          <Label htmlFor="active">Promoción Activa</Label>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onSave(formData)}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Planes</h2>
          <p className="text-muted-foreground">
            Administra planes de suscripción y promociones
          </p>
        </div>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Planes</TabsTrigger>
          <TabsTrigger value="promotions">Promociones</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Planes de Suscripción</h3>
            <Button onClick={() => setIsCreatingPlan(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plan
            </Button>
          </div>

          {isCreatingPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <PlanForm
                  plan={null}
                  onSave={handleSavePlan}
                  onCancel={() => setIsCreatingPlan(false)}
                />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {plan.popular && <Badge variant="secondary">Popular</Badge>}
                      {!plan.active && <Badge variant="destructive">Inactivo</Badge>}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period === 'monthly' ? 'mes' : 'año'}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPlan(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <strong>Almacenamiento:</strong> {plan.storage}GB
                    </div>
                    <div>
                      <strong>Ancho de banda:</strong> {plan.bandwidth}TB
                    </div>
                    <div>
                      <strong>Reproductores:</strong> {plan.customPlayers === -1 ? 'Ilimitados' : plan.customPlayers}
                    </div>
                    <div>
                      <strong>Usuarios:</strong> {plan.users === -1 ? 'Ilimitados' : plan.users}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {plan.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {editingPlan && (
            <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Plan: {editingPlan.name}</DialogTitle>
                </DialogHeader>
                <PlanForm
                  plan={editingPlan}
                  onSave={handleSavePlan}
                  onCancel={() => setEditingPlan(null)}
                />
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Promociones</h3>
            <Button onClick={() => setIsCreatingPromotion(true)}>
              <Tag className="h-4 w-4 mr-2" />
              Nueva Promoción
            </Button>
          </div>

          {isCreatingPromotion && (
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Promoción</CardTitle>
              </CardHeader>
              <CardContent>
                <PromotionForm
                  promotion={null}
                  onSave={handleSavePromotion}
                  onCancel={() => setIsCreatingPromotion(false)}
                />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {promotions.map((promotion) => (
              <Card key={promotion.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {promotion.name}
                      <Badge variant="outline">{promotion.code}</Badge>
                      {!promotion.active && <Badge variant="destructive">Inactiva</Badge>}
                    </CardTitle>
                    <CardDescription>{promotion.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {promotion.discount}{promotion.discountType === 'percentage' ? '%' : '$'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPromotion(promotion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePromotion(promotion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <strong>Válida desde:</strong> {promotion.startDate}
                    </div>
                    <div>
                      <strong>Válida hasta:</strong> {promotion.endDate}
                    </div>
                    <div>
                      <strong>Usos:</strong> {promotion.currentUses}/{promotion.maxUses}
                    </div>
                    <div>
                      <strong>Planes válidos:</strong> {promotion.validPlans.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {editingPromotion && (
            <Dialog open={!!editingPromotion} onOpenChange={() => setEditingPromotion(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Promoción: {editingPromotion.name}</DialogTitle>
                </DialogHeader>
                <PromotionForm
                  promotion={editingPromotion}
                  onSave={handleSavePromotion}
                  onCancel={() => setEditingPromotion(null)}
                />
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PLAN_PRICES = {
  free: 0,
  starter: 29,
  professional: 99,
  enterprise: 599 // Precio ajustado para sostenibilidad
};

const PLAN_FEATURES = {
  enterprise: {
    name: "Enterprise",
    price: 599,
    features: [
      "1 TB de almacenamiento (sostenible)",
      "10 TB de transferencia mensual (optimizado)", 
      "20 horas mensuales de live streaming (equilibrado)",
      "100 espectadores simultáneos máximo",
      "100 horas de visualización mensual",
      "5 usuarios máximo",
      "DRM avanzado",
      "Soporte 24/7 prioritario",
      "API personalizada",
      "Análisis empresariales",
      "CDN global premium",
      "SLA garantizado 99.9%",
      "Marca blanca completa"
    ]
  }
};

export default PlanManagement;

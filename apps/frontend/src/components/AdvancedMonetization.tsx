import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { 
  DollarSign, 
  CreditCard, 
  Play, 
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  Eye,
  Clock,
  Target,
  Zap,
  Star,
  Gift,
  Shield,
  Calendar,
  Percent,
  Globe,
  Video,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import api, { apiClient } from '@/lib/api';
interface Video {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  views: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  filename: string;
  file_size: number;
  status: string;
  thumbnail_url: string | null;
  video_url: string | null;
  cdn_url: string | null;
  embed_code: string | null;
  bitrate: number | null;
  codec: string | null;
  frame_rate: number | null;
  resolution: string | null;
  storage_path: string | null;
  processing_status: string | null;
  processing_progress: number | null;
}

interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  video_access_level: 'basic' | 'premium' | 'all';
  max_concurrent_streams: number;
  ad_free: boolean;
  download_enabled: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface AdCampaign {
  id: string;
  name: string;
  type: 'pre_roll' | 'mid_roll' | 'post_roll' | 'banner' | 'overlay';
  duration: number;
  targeting: {
    countries: string[];
    age_range: [number, number];
    interests: string[];
    device_types: string[];
  };
  budget: {
    daily: number;
    total: number;
    spent: number;
  };
  performance: {
    ctr: number;
  };
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface PayPerViewItem {
  id: string;
  video_id: string;
  price: number;
  rental_duration: number;
  preview_duration: number;
  discount_percentage: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  purchases: number;
  revenue: number;
  videos?: {
    title: string;
  };
}

interface MonetizationStats {
  total_revenue: number;
  subscription_revenue: number;
  ppv_revenue: number;
  ad_revenue: number;
  active_subscribers: number;
  total_purchases: number;
  average_revenue_per_user: number;
  conversion_rate: number;
}

const AdvancedMonetization: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [ppvItems, setPpvItems] = useState<PayPerViewItem[]>([]);
  const [stats, setStats] = useState<MonetizationStats>({
    total_revenue: 0,
    subscription_revenue: 0,
    ppv_revenue: 0,
    ad_revenue: 0,
    active_subscribers: 0,
    total_purchases: 0,
    average_revenue_per_user: 0,
    conversion_rate: 0
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [newSubscription, setNewSubscription] = useState({
    name: '',
    description: '',
    price: 25.00,
    billing_cycle: 'monthly' as 'monthly' | 'yearly',
    features: [''],
    video_access_level: 'basic' as 'basic' | 'premium' | 'all',
    max_concurrent_streams: 1,
    ad_free: false,
    download_enabled: false
  });

  const [newAdCampaign, setNewAdCampaign] = useState({
    name: '',
    type: 'pre_roll' as 'pre_roll' | 'mid_roll' | 'post_roll' | 'overlay' | 'banner',
    duration: 30,
    targeting: {
      countries: [''],
      age_range: [18, 65] as [number, number],
      interests: [''],
      device_types: ['desktop', 'mobile', 'tablet']
    },
    budget: {
      daily: 100,
      total: 1000
    }
  });

  const [newPpvItem, setNewPpvItem] = useState({
    video_id: '',
    price: 4.99,
    rental_duration: 48,
    preview_duration: 120,
    discount_percentage: 0,
    expires_at: ''
  });

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();

  const loadVideos = useCallback(async () => {
    try {
      if (!user) return;

      const response = await api.get('/videos');
      setVideos(response.data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
    }
  }, [user]);

  const loadSubscriptions = useCallback(async () => {
    try {
      if (!user) return;

      try {
        const response = await api.get('/subscriptions');
        const data = response.data;
      
        const mappedSubscriptions: Subscription[] = (data || []).map(plan => ({
          id: plan.id,
          name: plan.plan_name,
          description: `Plan ${plan.plan_name}`,
          price: 25.00,
          billing_cycle: 'monthly' as const,
          features: [],
          video_access_level: 'basic' as const,
          max_concurrent_streams: 1,
          ad_free: false,
          download_enabled: false,
          active: true,
          created_at: plan.created_at,
          updated_at: plan.updated_at,
          user_id: plan.user_id
        }));
        
        setSubscriptions(mappedSubscriptions);
      } catch (apiError) {
        console.warn('Subscriptions API not available, using empty data');
        setSubscriptions([]);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setSubscriptions([]);
    }
  }, [user]);

  const loadAdCampaigns = useCallback(async () => {
    try {
      if (!user) return;

      console.warn('ad_campaigns table not implemented, using mock data');
      setAdCampaigns([]);
    } catch (error) {
      console.error('Error loading ad campaigns:', error);
      setAdCampaigns([]);
    }
  }, [user]);

  const loadPpvItems = useCallback(async () => {
    try {
      if (!user) return;

      console.warn('ppv_items table not implemented, using mock data');
      setPpvItems([]);
    } catch (error) {
      console.error('Error loading PPV items:', error);
      setPpvItems([]);
    }
  }, [user]);

  const loadStats = useCallback(async () => {
    try {
      if (!user) return;

      // TODO: Implement API call when stats endpoint is available
      // const response = await api.get('/stats/monetization');
      console.log('Loading monetization stats for user:', user.id);
      
      setStats({
        total_revenue: 0,
        subscription_revenue: 0,
        ppv_revenue: 0,
        ad_revenue: 0,
        active_subscribers: 0,
        total_purchases: 0,
        average_revenue_per_user: 0,
        conversion_rate: 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        total_revenue: 0,
        subscription_revenue: 0,
        ppv_revenue: 0,
        ad_revenue: 0,
        active_subscribers: 0,
        total_purchases: 0,
        average_revenue_per_user: 0,
        conversion_rate: 0
      });
    }
  }, [user]);

  const loadData = useCallback(async () => {
    await Promise.all([
      loadVideos(),
      loadSubscriptions(),
      loadAdCampaigns(),
      loadPpvItems(),
      loadStats()
    ]);
  }, [loadVideos, loadSubscriptions, loadAdCampaigns, loadPpvItems, loadStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        loadStats();
      }, 30000);
    } else if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh, loadStats]);

  const createSubscription = async () => {
    if (!newSubscription.name || !newSubscription.description) {
      toast.error('Nombre y descripción son requeridos');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const response = await api.post('/subscriptions', {
        ...newSubscription,
        userId: user.id
      });

      toast.success('Plan de suscripción creado exitosamente');
      setNewSubscription({
        name: '',
        description: '',
        price: 25.00,
        billing_cycle: 'monthly',
        features: [''],
        video_access_level: 'basic',
        max_concurrent_streams: 1,
        ad_free: false,
        download_enabled: false
      });
      loadSubscriptions();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Error al crear plan de suscripción');
    } finally {
      setLoading(false);
    }
  };

  const createAdCampaign = async () => {
    if (!newAdCampaign.name) {
      toast.error('Nombre de campaña es requerido');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const response = await api.post('/ad-campaigns', {
        ...newAdCampaign,
        userId: user.id
      });

      toast.success('Campaña publicitaria creada exitosamente');
      setNewAdCampaign({
        name: '',
        type: 'pre_roll',
        duration: 30,
        targeting: {
          countries: [''],
          age_range: [18, 65],
          interests: [''],
          device_types: ['desktop', 'mobile', 'tablet']
        },
        budget: {
          daily: 100,
          total: 1000
        }
      });
      loadAdCampaigns();
    } catch (error) {
      console.error('Error creating ad campaign:', error);
      toast.error('Error al crear campaña publicitaria');
    } finally {
      setLoading(false);
    }
  };

  const createPpvItem = async () => {
    if (!newPpvItem.video_id) {
      toast.error('Selecciona un video');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const response = await api.post('/ppv-items', {
        ...newPpvItem,
        userId: user.id
      });

      toast.success('Item de pago por visión creado exitosamente');
      setNewPpvItem({
        video_id: '',
        price: 4.99,
        rental_duration: 48,
        preview_duration: 120,
        discount_percentage: 0,
        expires_at: ''
      });
      loadPpvItems();
    } catch (error) {
      console.error('Error creating PPV item:', error);
      toast.error('Error al crear item de pago por visión');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscriptionStatus = async (subscriptionId: string, active: boolean) => {
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const response = await api.patch(`/subscriptions/${subscriptionId}`, {
        active,
        userId: user.id
      });

      toast.success(`Suscripción ${active ? 'activada' : 'desactivada'}`);
      loadSubscriptions();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Error al cambiar estado de suscripción');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monetización Avanzada</h2>
          <p className="text-muted-foreground">
            Gestiona suscripciones, publicidad y pago por visión
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas de Monetización */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Ingresos Totales</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(stats.total_revenue)}</p>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Suscriptores Activos</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.active_subscribers}</p>
            <p className="text-xs text-muted-foreground">usuarios</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Compras PPV</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.total_purchases}</p>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">ARPU</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(stats.average_revenue_per_user)}</p>
            <p className="text-xs text-muted-foreground">por usuario</p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose de Ingresos */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Suscripciones</span>
                <span className="font-medium">{formatCurrency(stats.subscription_revenue)}</span>
              </div>
              <Progress 
                value={(stats.subscription_revenue / stats.total_revenue) * 100} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Pago por Visión</span>
                <span className="font-medium">{formatCurrency(stats.ppv_revenue)}</span>
              </div>
              <Progress 
                value={(stats.ppv_revenue / stats.total_revenue) * 100} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Publicidad</span>
                <span className="font-medium">{formatCurrency(stats.ad_revenue)}</span>
              </div>
              <Progress 
                value={(stats.ad_revenue / stats.total_revenue) * 100} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
          <TabsTrigger value="advertising">Publicidad</TabsTrigger>
          <TabsTrigger value="ppv">Pago por Visión</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crear Plan de Suscripción</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sub-name">Nombre del Plan</Label>
                    <Input
                      id="sub-name"
                      value={newSubscription.name}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Plan Premium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sub-price">Precio</Label>
                    <Input
                      id="sub-price"
                      type="number"
                      step="0.01"
                      value={newSubscription.price}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="sub-description">Descripción</Label>
                  <Textarea
                    id="sub-description"
                    value={newSubscription.description}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción del plan..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billing-cycle">Ciclo de Facturación</Label>
                    <Select 
                      value={newSubscription.billing_cycle} 
                      onValueChange={(value: 'monthly' | 'yearly') => 
                        setNewSubscription(prev => ({ ...prev, billing_cycle: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="access-level">Nivel de Acceso</Label>
                    <Select 
                      value={newSubscription.video_access_level} 
                      onValueChange={(value: 'basic' | 'premium' | 'all') => 
                        setNewSubscription(prev => ({ ...prev, video_access_level: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Básico</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="all">Todos los Videos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ad-free">Sin Publicidad</Label>
                    <Switch
                      id="ad-free"
                      checked={newSubscription.ad_free}
                      onCheckedChange={(checked) => 
                        setNewSubscription(prev => ({ ...prev, ad_free: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="download-enabled">Descargas Habilitadas</Label>
                    <Switch
                      id="download-enabled"
                      checked={newSubscription.download_enabled}
                      onCheckedChange={(checked) => 
                        setNewSubscription(prev => ({ ...prev, download_enabled: checked }))
                      }
                    />
                  </div>
                </div>
                
                <Button onClick={createSubscription} disabled={loading} className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Crear Plan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planes Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay planes de suscripción creados
                    </p>
                  ) : (
                    subscriptions.map((subscription) => (
                      <div key={subscription.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{subscription.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge className={subscription.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {subscription.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <Switch
                              checked={subscription.active}
                              onCheckedChange={(checked) => toggleSubscriptionStatus(subscription.id, checked)}
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{subscription.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>{formatCurrency(subscription.price)}/{subscription.billing_cycle === 'monthly' ? 'mes' : 'año'}</span>
                          <span>{subscription.video_access_level} • {subscription.max_concurrent_streams} stream(s)</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          {subscription.ad_free && (
                            <Badge variant="outline">Sin Ads</Badge>
                          )}
                          {subscription.download_enabled && (
                            <Badge variant="outline">Descargas</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advertising" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crear Campaña Publicitaria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign-name">Nombre de Campaña</Label>
                    <Input
                      id="campaign-name"
                      value={newAdCampaign.name}
                      onChange={(e) => setNewAdCampaign(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Campaña de Verano"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ad-type">Tipo de Anuncio</Label>
                    <Select 
                      value={newAdCampaign.type} 
                      onValueChange={(value: 'pre_roll' | 'mid_roll' | 'post_roll' | 'banner' | 'overlay') => 
                        setNewAdCampaign(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pre_roll">Pre-roll</SelectItem>
                        <SelectItem value="mid_roll">Mid-roll</SelectItem>
                        <SelectItem value="post_roll">Post-roll</SelectItem>
                        <SelectItem value="overlay">Overlay</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ad-duration">Duración (segundos)</Label>
                    <Input
                      id="ad-duration"
                      type="number"
                      value={newAdCampaign.duration}
                      onChange={(e) => setNewAdCampaign(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="daily-budget">Presupuesto Diario</Label>
                    <Input
                      id="daily-budget"
                      type="number"
                      step="0.01"
                      value={newAdCampaign.budget.daily}
                      onChange={(e) => setNewAdCampaign(prev => ({ 
                        ...prev, 
                        budget: { ...prev.budget, daily: parseFloat(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
                
                <Button onClick={createAdCampaign} disabled={loading} className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Crear Campaña
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campañas Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adCampaigns.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay campañas publicitarias
                    </p>
                  ) : (
                    adCampaigns.map((campaign) => (
                      <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{campaign.name}</h4>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="ml-2 capitalize">{campaign.type.replace('_', '-')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duración:</span>
                            <span className="ml-2">{campaign.duration}s</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Presupuesto:</span>
                            <span className="ml-2">{formatCurrency(campaign.budget.daily)}/día</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CTR:</span>
                            <span className="ml-2">{campaign.performance.ctr.toFixed(2)}%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Gastado</span>
                            <span>{formatCurrency(campaign.budget.spent)} / {formatCurrency(campaign.budget.total)}</span>
                          </div>
                          <Progress 
                            value={(campaign.budget.spent / campaign.budget.total) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ppv" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crear Item de Pago por Visión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ppv-video">Video</Label>
                  <Select 
                    value={newPpvItem.video_id} 
                    onValueChange={(value) => setNewPpvItem(prev => ({ ...prev, video_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar video" />
                    </SelectTrigger>
                    <SelectContent>
                      {videos.map((video) => (
                        <SelectItem key={video.id} value={video.id}>
                          {video.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ppv-price">Precio</Label>
                    <Input
                      id="ppv-price"
                      type="number"
                      step="0.01"
                      value={newPpvItem.price}
                      onChange={(e) => setNewPpvItem(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rental-duration">Duración de Alquiler (horas)</Label>
                    <Input
                      id="rental-duration"
                      type="number"
                      value={newPpvItem.rental_duration}
                      onChange={(e) => setNewPpvItem(prev => ({ ...prev, rental_duration: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preview-duration">Vista Previa (segundos)</Label>
                    <Input
                      id="preview-duration"
                      type="number"
                      value={newPpvItem.preview_duration}
                      onChange={(e) => setNewPpvItem(prev => ({ ...prev, preview_duration: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount">Descuento (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={newPpvItem.discount_percentage}
                      onChange={(e) => setNewPpvItem(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <Button onClick={createPpvItem} disabled={loading} className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Crear Item PPV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Items de Pago por Visión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ppvItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay items de pago por visión
                    </p>
                  ) : (
                    ppvItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{item.video_id}</h4>
                          <span className="font-bold text-green-600">{formatCurrency(item.price)}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Duración:</span>
                            <span className="ml-2">{item.rental_duration}h</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Vista Previa:</span>
                            <span className="ml-2">{item.preview_duration}s</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Compras:</span>
                            <span className="ml-2">{item.purchases}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ingresos:</span>
                            <span className="ml-2">{formatCurrency(item.revenue)}</span>
                          </div>
                        </div>
                        
                        {item.discount_percentage > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {item.discount_percentage}% descuento
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Modelo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium">Suscripciones</h4>
                      <p className="text-sm text-muted-foreground">{stats.active_subscribers} suscriptores activos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(stats.subscription_revenue)}</p>
                      <p className="text-xs text-muted-foreground">este mes</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium">Pago por Visión</h4>
                      <p className="text-sm text-muted-foreground">{stats.total_purchases} compras</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{formatCurrency(stats.ppv_revenue)}</p>
                      <p className="text-xs text-muted-foreground">este mes</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium">Publicidad</h4>
                      <p className="text-sm text-muted-foreground">{adCampaigns.filter(c => c.status === 'active').length} campañas activas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{formatCurrency(stats.ad_revenue)}</p>
                      <p className="text-xs text-muted-foreground">este mes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Clave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tasa de Conversión</span>
                    <span className="font-bold">{(stats.conversion_rate * 100).toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ARPU (Ingreso por Usuario)</span>
                    <span className="font-bold">{formatCurrency(stats.average_revenue_per_user)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Retención de Suscriptores</span>
                    <span className="font-bold">85%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Churn Rate</span>
                    <span className="font-bold text-red-600">15%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tiempo Promedio de Visualización</span>
                    <span className="font-bold">12:34</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedMonetization;

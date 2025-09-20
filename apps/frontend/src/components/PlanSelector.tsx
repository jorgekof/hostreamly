import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { apiClient as api } from '@/lib/api';
const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 25,
    icon: Star,
    color: 'text-blue-600 bg-blue-100',
    popular: false,
    features: [
      '100 GB almacenamiento Bunny',
      '1 TB transferencia mensual',
      '20 horas de visualización mensual',
      'Videos ilimitados (sin límite de subidas)',
      'Procesamiento JIT básico',
      '1 reproductor personalizado',
      'Analytics básicas',
      'CDN global básico',
      'Protección hotlink básica',
      'Compresión automática',
      'Soporte por email',
      'Cobro adicional: $0.05/GB excedente'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 219,
    icon: Zap,
    color: 'text-orange-600 bg-orange-100',
    popular: true,
    features: [
      '1 TB almacenamiento Bunny',
      '10 TB transferencia mensual',
      'Live streaming no incluido',
      '200 horas de visualización mensual',
      'Videos ilimitados (sin límite de subidas)',
      'Procesamiento JIT hasta 4K',
      '3 reproductores personalizados',
      'Analytics avanzadas',
      'API completa + webhooks',
      'CDN optimizado con caché inteligente',
      'DRM básico incluido',
      'Rate limiting personalizable',
      'Monitoreo de performance',
      'Soporte prioritario',
      'Hasta 3 usuarios',
      'Cobro adicional: $0.05/GB excedente'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    icon: Crown,
    color: 'text-purple-600 bg-purple-100',
    popular: false,
    features: [
      '3.5 TB almacenamiento',
      '35 TB transferencia mensual',
      '15 horas mensuales de live streaming 4K',
      'Máximo 60 espectadores simultáneos',
      '500 horas de visualización mensual',
      'Videos ilimitados (sin límite de subidas)',
      'Procesamiento JIT sin límites hasta 4K',
      '20 Reproductores personalizados',
      'Analytics empresariales personalizadas',
      'API completa + webhooks avanzados',
      'DRM premium (Widevine & FairPlay)',
      'CDN global premium',
      'Seguridad avanzada y 2FA',
      'Monitoreo y alertas en tiempo real',
      'Optimización automática de performance',
      'Geo-blocking y control de acceso',
      'Marca blanca completa',
      'Integración personalizada',
      'SLA garantizado 99.9%',
      'Soporte 24/7 + gerente cuentas',
      'Hasta 15 usuarios administradores',
      'Cobro adicional: $0.05/GB excedente'
    ]
  }
];

interface PlanSelectorProps {
  onPlanSelected?: () => void;
}

export const PlanSelector = ({ onPlanSelected }: PlanSelectorProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Check for existing subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setSubscriptionLoading(false);
        return;
      }

      try {
    
        const data = null, error = null;

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking subscription:', error);
        } else if (data) {
          setCurrentSubscription(data);
        }
      } catch (error) {
        console.error('Error in checkSubscription:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para seleccionar un plan');
      return;
    }

    // Check if user already has this plan
    if (currentSubscription?.subscription_tier === planId && currentSubscription?.subscribed) {
      toast.error('Ya tienes este plan activo. Usa el portal de cliente para gestionar tu suscripción.');
      return;
    }

    setLoading(true);

    try {
      // For demo purposes, we'll simulate the subscription creation
      // In production, this should redirect to Stripe Checkout
      toast.info('Redirigiendo a Stripe Checkout...');
      
      // Simulate successful payment and create subscription

        const data = null, error = null;

      if (error) throw error;

      toast.success(`¡Plan ${planId} activado exitosamente!`);
      onPlanSelected?.();
      
      // Reload the page to update the UI
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Error al activar el plan. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !currentSubscription) return;

    setLoading(true);
    try {
      // In production, this would redirect to Stripe Customer Portal
      toast.info('Redirigiendo al portal de cliente...');
      
      // For demo, we'll just show management options
      const action = confirm('¿Qué deseas hacer?\nOK = Cancelar suscripción\nCancelar = Actualizar plan');
      
      if (action) {
        // Cancel subscription

        const data = null, error = null;

        if (error) throw error;
        
        toast.success('Suscripción cancelada exitosamente');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.info('Para actualizar tu plan, selecciona uno nuevo a continuación');
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
      toast.error('Error al gestionar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando suscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {currentSubscription?.subscribed ? 'Gestiona tu Plan' : 'Selecciona tu Plan'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {currentSubscription?.subscribed 
              ? `Plan actual: ${currentSubscription.subscription_tier.charAt(0).toUpperCase() + currentSubscription.subscription_tier.slice(1)}`
              : 'Elige el plan que mejor se adapte a tus necesidades de hosting de video'
            }
          </p>
          {currentSubscription?.subscribed && (
            <div className="mt-6">
              <Button 
                onClick={handleManageSubscription}
                variant="outline"
                disabled={loading}
                className="mb-4"
              >
                {loading ? 'Procesando...' : 'Gestionar Suscripción'}
              </Button>
              <p className="text-sm text-muted-foreground">
                O selecciona un plan diferente para actualizar
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isCurrentPlan = currentSubscription?.subscription_tier === plan.id && currentSubscription?.subscribed;
            const isUpgrade = currentSubscription?.subscribed && 
              ((currentSubscription.subscription_tier === 'starter' && plan.id !== 'starter') ||
               (currentSubscription.subscription_tier === 'professional' && plan.id === 'enterprise'));
            const isDowngrade = currentSubscription?.subscribed && 
              ((currentSubscription.subscription_tier === 'enterprise' && plan.id !== 'enterprise') ||
               (currentSubscription.subscription_tier === 'professional' && plan.id === 'starter'));
            
            return (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
                {plan.popular && !isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Más Popular
                  </Badge>
                )}
                
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white">
                    Plan Actual
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${plan.color}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-base font-normal text-muted-foreground">/mes</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={isCurrentPlan ? "secondary" : plan.popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading || isCurrentPlan}
                  >
                    {loading ? 'Procesando...' : 
                     isCurrentPlan ? 'Plan Actual' :
                     isUpgrade ? `Actualizar a ${plan.name}` :
                     isDowngrade ? `Cambiar a ${plan.name}` :
                     'Seleccionar Plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            ¿Necesitas un plan personalizado? 
            <Button variant="link" className="p-0 ml-1 h-auto">
              Contáctanos
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

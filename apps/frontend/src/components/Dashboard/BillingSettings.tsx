import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Calculator
} from 'lucide-react';
import { useBillingPreferences } from '@/hooks/useBillingPreferences';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useBandwidthTracking } from '@/hooks/useBandwidthTracking';
import { useToast } from '@/hooks/use-toast';

import { apiClient as api } from '@/lib/api';
export const BillingSettings = () => {
  const { 
    preferences, 
    additionalCharges, 
    loading, 
    saving, 
    savePreferences, 
    calculateOverageCharges 
  } = useBillingPreferences();
  const { limits, usage } = usePlanLimits();
  const { getTotalBandwidthGB } = useBandwidthTracking();
  const { toast } = useToast();

  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Calculate current overages
  const currentBandwidthGB = getTotalBandwidthGB();
  const storageOverage = Math.max(0, usage.storage - (limits.storage === -1 ? Infinity : limits.storage));
  const bandwidthOverage = Math.max(0, currentBandwidthGB - (limits.bandwidth === -1 ? Infinity : limits.bandwidth));
  
  const currentOverageCosts = calculateOverageCharges(storageOverage, bandwidthOverage);

  const handleCreateOverageCharge = async () => {
    if (!storageOverage && !bandwidthOverage) {
      toast({
        title: "Error",
        description: "No hay sobrecargos para procesar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create Stripe payment session
  

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirigiendo a Stripe",
        description: "Se abrirá una nueva pestaña para completar el pago",
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "Error al crear la sesión de pago",
        variant: "destructive",
      });
    }
  };

  const handleSavePreferences = () => {
    savePreferences(localPreferences);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'failed': return 'Fallido';
      default: return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Configuración de Facturación</h2>
      </div>

      {/* Current Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Uso Actual y Sobrecargos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Almacenamiento</p>
              <p className="text-2xl font-bold">
                {usage.storage.toFixed(2)} GB
              </p>
              <p className="text-xs text-muted-foreground">
                de {limits.storage === -1 ? '∞' : limits.storage} GB
              </p>
              {storageOverage > 0 && (
                <Badge variant="destructive" className="mt-2">
                  +{storageOverage.toFixed(2)} GB extra
                </Badge>
              )}
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Transferencia (mes)</p>
              <p className="text-2xl font-bold">
                {currentBandwidthGB.toFixed(2)} GB
              </p>
              <p className="text-xs text-muted-foreground">
                de {limits.bandwidth === -1 ? '∞' : `${limits.bandwidth * 1024}`} GB
              </p>
              {bandwidthOverage > 0 && (
                <Badge variant="destructive" className="mt-2">
                  +{bandwidthOverage.toFixed(2)} GB extra
                </Badge>
              )}
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Costo Adicional Estimado</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(currentOverageCosts.totalCharge)}
              </p>
              <p className="text-xs text-muted-foreground">
                Este mes
              </p>
            </div>
          </div>

          {(storageOverage > 0 || bandwidthOverage > 0) && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Sobrecargo Detectado</h4>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Has excedido los límites de tu plan actual. Los cargos adicionales se aplicarán según tu configuración.
              </p>
              <div className="text-sm space-y-1 mb-4">
                {storageOverage > 0 && (
                  <p>• Almacenamiento: +{storageOverage.toFixed(2)} GB × {formatCurrency(preferences.storage_overage_price)}/GB = {formatCurrency(currentOverageCosts.storageCharge)}</p>
                )}
                {bandwidthOverage > 0 && (
                  <p>• Transferencia: +{bandwidthOverage.toFixed(2)} GB × {formatCurrency(preferences.bandwidth_overage_price)}/GB = {formatCurrency(currentOverageCosts.bandwidthCharge)}</p>
                )}
              </div>
              <Button 
                onClick={handleCreateOverageCharge}
                className="w-full"
                variant="outline"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar Sobrecargo ({formatCurrency(currentOverageCosts.totalCharge)})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Preferencias de Facturación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-charge">Cobro Automático de Sobrecargas</Label>
              <p className="text-sm text-muted-foreground">
                Permite cargos automáticos cuando excedas los límites del plan
              </p>
            </div>
            <Switch
              id="auto-charge"
              checked={localPreferences.auto_charge_enabled}
              onCheckedChange={(checked) =>
                setLocalPreferences(prev => ({ ...prev, auto_charge_enabled: checked }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storage-price">Precio por GB de Almacenamiento Extra</Label>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                <Input
                  id="storage-price"
                  type="number"
                  step="0.001"
                  min="0"
                  value={localPreferences.storage_overage_price}
                  onChange={(e) =>
                    setLocalPreferences(prev => ({ 
                      ...prev, 
                      storage_overage_price: parseFloat(e.target.value) || 0.05 
                    }))
                  }
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bandwidth-price">Precio por GB de Transferencia Extra</Label>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                <Input
                  id="bandwidth-price"
                  type="number"
                  step="0.001"
                  min="0"
                  value={localPreferences.bandwidth_overage_price}
                  onChange={(e) =>
                    setLocalPreferences(prev => ({ 
                      ...prev, 
                      bandwidth_overage_price: parseFloat(e.target.value) || 0.05 
                    }))
                  }
                  className="text-right"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-threshold">Umbral de Notificación (%)</Label>
            <p className="text-sm text-muted-foreground">
              Recibe alertas cuando uses este porcentaje de tus límites
            </p>
            <Input
              id="notification-threshold"
              type="number"
              min="0"
              max="100"
              value={localPreferences.notification_threshold * 100}
              onChange={(e) =>
                setLocalPreferences(prev => ({ 
                  ...prev, 
                  notification_threshold: (parseFloat(e.target.value) || 80) / 100 
                }))
              }
              className="w-24"
            />
          </div>

          <Button 
            onClick={handleSavePreferences} 
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </CardContent>
      </Card>

      {/* Additional Charges History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cargos Adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          {additionalCharges.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay cargos adicionales registrados
            </p>
          ) : (
            <div className="space-y-4">
              {additionalCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(charge.status)}
                      <span className="font-medium">
                        {new Date(charge.period_start).toLocaleDateString('es-ES')} - {new Date(charge.period_end).toLocaleDateString('es-ES')}
                      </span>
                      <Badge variant="outline">
                        {getStatusText(charge.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Almacenamiento: +{charge.storage_overage_gb} GB • 
                      Transferencia: +{charge.bandwidth_overage_gb} GB
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatCurrency(charge.total_charge)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(charge.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

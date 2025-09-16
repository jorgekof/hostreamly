import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useBandwidthTracking } from "@/hooks/useBandwidthTracking";
import { useBillingPreferences } from "@/hooks/useBillingPreferences";
import { Database, HardDrive, Video, Users, AlertTriangle, DollarSign } from "lucide-react";

export const UsageProgress = () => {
  const { 
    limits, 
    usage, 
    loading,
    getUsagePercentage, 
    isNearLimit, 
    isBandwidthNearLimit,
    calculateOverageCost,
    planName 
  } = usePlanLimits();
  const { getTotalBandwidthGB } = useBandwidthTracking();
  const { preferences, createAdditionalUsageCharge } = useBillingPreferences();

  // Calculate bandwidth usage
  const currentBandwidthGB = getTotalBandwidthGB();
  const bandwidthLimitGB = limits.bandwidth === -1 ? Infinity : limits.bandwidth * 1024; // Convert TB to GB
  const bandwidthPercentage = limits.bandwidth === -1 ? 0 : Math.min((currentBandwidthGB / bandwidthLimitGB) * 100, 100);

  // Calculate overages
  const storageOverageGB = Math.max(0, usage.storage - (limits.storage === -1 ? Infinity : limits.storage));
  const bandwidthOverageGB = Math.max(0, currentBandwidthGB - bandwidthLimitGB);
  const overageCosts = calculateOverageCost(storageOverageGB, bandwidthOverageGB);

  // Handle creating additional usage charge
  const handleCreateOverageCharge = async () => {
    if (storageOverageGB > 0 || bandwidthOverageGB > 0) {
      await createAdditionalUsageCharge(storageOverageGB, bandwidthOverageGB);
    }
  };

  const formatLimit = (value: number, unit: string): string => {
    return value === -1 ? 'Ilimitado' : `${value}${unit}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Cargando datos de uso...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    {
      icon: HardDrive,
      label: "Almacenamiento",
      value: usage.storage,
      limit: limits.storage,
      unit: "GB",
      percentage: getUsagePercentage('storage'),
      isNearLimit: isNearLimit('storage'),
      overage: storageOverageGB,
      overageCost: overageCosts.storage
    },
    {
      icon: Database,
      label: "Transferencia (mes)",
      value: currentBandwidthGB,
      limit: bandwidthLimitGB,
      unit: "GB",
      percentage: bandwidthPercentage,
      isNearLimit: isBandwidthNearLimit(currentBandwidthGB),
      overage: bandwidthOverageGB,
      overageCost: overageCosts.bandwidth
    },
    {
      icon: Video,
      label: "Videos",
      value: usage.videos,
      limit: limits.videos,
      unit: "",
      percentage: getUsagePercentage('videos'),
      isNearLimit: isNearLimit('videos'),
      overage: 0,
      overageCost: 0
    },
    {
      icon: Users,
      label: "Usuarios",
      value: usage.users,
      limit: limits.users,
      unit: "",
      percentage: getUsagePercentage('users'),
      isNearLimit: isNearLimit('users'),
      overage: 0,
      overageCost: 0
    }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Uso de Recursos</CardTitle>
        <Badge variant="secondary">{planName}</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const hasOverage = item.overage > 0;
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {item.value.toLocaleString()}{item.unit} / {formatLimit(item.limit, item.unit)}
                  </span>
                  {hasOverage ? (
                    <Badge variant="destructive" className="text-xs">
                      +{item.overage.toFixed(2)}{item.unit} extra
                    </Badge>
                  ) : item.isNearLimit && (
                    <Badge variant="destructive" className="text-xs">
                      Límite cercano
                    </Badge>
                  )}
                </div>
              </div>
              
              {item.limit !== -1 && (
                <Progress 
                  value={Math.min(item.percentage, 100)} 
                  className={`h-2 ${hasOverage || item.isNearLimit ? 'border-destructive' : ''}`}
                />
              )}

              {hasOverage && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Límite excedido: +{item.overage.toFixed(2)} {item.unit}
                      </p>
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Costo adicional: ${item.overageCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Total Overage Summary */}
        {(storageOverageGB > 0 || bandwidthOverageGB > 0) && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Costo Total Adicional</p>
                <p className="text-lg font-bold text-red-600">
                  ${overageCosts.total.toFixed(2)}
                </p>
              </div>
              {preferences.auto_charge_enabled ? (
                <Badge variant="secondary" className="text-green-600">
                  Cobro Automático Activado
                </Badge>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCreateOverageCharge}
                >
                  Crear Cargo
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {preferences.auto_charge_enabled 
                ? "Los cargos adicionales se facturarán automáticamente al final del mes."
                : "Puedes crear un cargo manual o activar el cobro automático en la configuración de facturación."
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

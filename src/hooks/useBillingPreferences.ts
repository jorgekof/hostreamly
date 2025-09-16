import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { apiClient as api } from '@/lib/api';
export interface BillingPreferences {
  id?: string;
  auto_charge_enabled: boolean;
  storage_overage_price: number;
  bandwidth_overage_price: number;
  notification_threshold: number;
}

export interface AdditionalUsageCharge {
  id: string;
  period_start: string;
  period_end: string;
  storage_overage_gb: number;
  bandwidth_overage_gb: number;
  storage_charge: number;
  bandwidth_charge: number;
  total_charge: number;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
}

export const useBillingPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<BillingPreferences>({
    auto_charge_enabled: false,
    storage_overage_price: 0.05,
    bandwidth_overage_price: 0.05,
    notification_threshold: 0.8
  });
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalUsageCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch billing preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // API call - implement with backend

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching billing preferences:', error);
          return;
        }

        if (data) {
          setPreferences({
            id: data.id,
            auto_charge_enabled: data.auto_charge_enabled,
            storage_overage_price: data.storage_overage_price,
            bandwidth_overage_price: data.bandwidth_overage_price,
            notification_threshold: data.notification_threshold
          });
        }
      } catch (error) {
        console.error('Error in fetchPreferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  // Fetch additional charges
  useEffect(() => {
    const fetchAdditionalCharges = async () => {
      if (!user) return;

      try {
        // API call - implement with backend

        if (error) {
          console.error('Error fetching additional charges:', error);
          return;
        }

        setAdditionalCharges((data || []) as AdditionalUsageCharge[]);
      } catch (error) {
        console.error('Error in fetchAdditionalCharges:', error);
      }
    };

    fetchAdditionalCharges();
  }, [user]);

  // Save billing preferences
  const savePreferences = async (newPreferences: Partial<BillingPreferences>) => {
    if (!user) return;

    setSaving(true);
    try {
      // API call - implement with backend

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...newPreferences }));
      toast.success('Configuración de facturación actualizada');
    } catch (error) {
      console.error('Error saving billing preferences:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  // Calculate overage charges
  const calculateOverageCharges = (storageOverageGB: number, bandwidthOverageGB: number) => {
    const storageCharge = storageOverageGB * preferences.storage_overage_price;
    const bandwidthCharge = bandwidthOverageGB * preferences.bandwidth_overage_price;
    const totalCharge = storageCharge + bandwidthCharge;

    return {
      storageCharge: Math.round(storageCharge * 100) / 100,
      bandwidthCharge: Math.round(bandwidthCharge * 100) / 100,
      totalCharge: Math.round(totalCharge * 100) / 100
    };
  };

  // Create additional usage charge record
  const createAdditionalUsageCharge = async (
    storageOverageGB: number, 
    bandwidthOverageGB: number
  ) => {
    if (!user) return;

    try {
      const charges = calculateOverageCharges(storageOverageGB, bandwidthOverageGB);
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // API call - implement with backend

      if (error) throw error;

      toast.success(`Cargo adicional creado: $${charges.totalCharge}`);
      
      // Refresh additional charges
      // API call - implement with backend
      
      setAdditionalCharges((data || []) as AdditionalUsageCharge[]);
    } catch (error) {
      console.error('Error creating additional usage charge:', error);
      toast.error('Error al crear el cargo adicional');
    }
  };

  return {
    preferences,
    additionalCharges,
    loading,
    saving,
    savePreferences,
    calculateOverageCharges,
    createAdditionalUsageCharge
  };
};

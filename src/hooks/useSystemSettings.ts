import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { apiClient as api } from '@/lib/api';
export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: unknown;
  description?: string;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      const data = response.data;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast.error('Error al cargar configuración del sistema');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: unknown) => {
    try {
      const response = await api.put(`/admin/settings/${key}`, { value });
      const data = response.data;
      setSettings(prev => prev.map(s => s.setting_key === key ? data : s));
      toast.success('Configuración actualizada exitosamente');
      return data;
    } catch (error) {
      console.error('Error updating system setting:', error);
      toast.error('Error al actualizar configuración');
      throw error;
    }
  };

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    getSetting,
    refetch: fetchSettings
  };
};

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
export interface BrandSettings {
  id?: string;
  logo_url?: string;
  brand_color: string;
  watermark_url?: string;
  watermark_position: string;
  custom_domain?: string;
  custom_css?: string;
  player_skin: string;
}

export const useBrandSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BrandSettings>({
    brand_color: '#3b82f6',
    watermark_position: 'bottom-right',
    player_skin: 'default'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await api.settings.get();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching brand settings:', error);
      toast.error('Error al cargar configuración de marca');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<BrandSettings>) => {
    try {
      const response = await api.settings.update(newSettings);

      if (response.data) {
        setSettings(response.data);
        toast.success('Configuración actualizada exitosamente');
        return response.data;
      }
    } catch (error) {
      console.error('Error updating brand settings:', error);
      toast.error('Error al actualizar configuración');
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings
  };
};

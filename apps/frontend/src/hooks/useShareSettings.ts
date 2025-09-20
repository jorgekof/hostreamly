import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
export interface ShareSettings {
  id?: string;
  default_privacy: 'private' | 'public' | 'unlisted';
  allow_embedding: boolean;
  require_password: boolean;
  enable_social_sharing: boolean;
  auto_generate_thumbnails: boolean;
  thumbnail_count: number;
}

export const useShareSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ShareSettings>({
    default_privacy: 'private',
    allow_embedding: false,
    require_password: false,
    enable_social_sharing: true,
    auto_generate_thumbnails: true,
    thumbnail_count: 3
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await api.settings.get();
      if (response.data) {
        setSettings({
          default_privacy: response.data.default_privacy as 'private' | 'public' | 'unlisted',
          allow_embedding: response.data.allow_embedding,
          require_password: response.data.require_password,
          enable_social_sharing: response.data.enable_social_sharing,
          auto_generate_thumbnails: response.data.auto_generate_thumbnails,
          thumbnail_count: response.data.thumbnail_count
        });
      }
    } catch (error) {
      console.error('Error fetching share settings:', error);
      toast.error('Error al cargar configuración de compartir');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<ShareSettings>) => {
    try {
      const response = await api.settings.update(newSettings);

      if (response.data) {
        setSettings({
          default_privacy: response.data.default_privacy as 'private' | 'public' | 'unlisted',
          allow_embedding: response.data.allow_embedding,
          require_password: response.data.require_password,
          enable_social_sharing: response.data.enable_social_sharing,
          auto_generate_thumbnails: response.data.auto_generate_thumbnails,
          thumbnail_count: response.data.thumbnail_count
        });
        toast.success('Configuración actualizada exitosamente');
        return response.data;
      }
    } catch (error) {
      console.error('Error updating share settings:', error);
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

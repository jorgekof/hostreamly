import { useState, useEffect, useCallback } from 'react';
import api, { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WhiteLabelConfig {
  id?: string;
  user_id?: string;
  company_name: string;
  company_logo_url?: string;
  company_favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  custom_domain?: string;
  domain_verified: boolean;
  custom_css?: string;
  email_templates?: {
    welcome?: string;
    reset_password?: string;
    verification?: string;
  };
  branding_settings: {
    hide_powered_by: boolean;
    custom_footer_text?: string;
    show_company_logo: boolean;
    custom_login_background?: string;
  };
  player_settings: {
    skin: string;
    controls_color: string;
    progress_color: string;
    watermark_enabled: boolean;
    watermark_position: string;
    watermark_opacity: number;
  };
  social_links?: {
    website?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
  };
  seo_settings?: {
    meta_title?: string;
    meta_description?: string;
    og_image_url?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface DomainVerification {
  id?: string;
  user_id?: string;
  domain: string;
  verification_token: string;
  dns_records: {
    type: string;
    name: string;
    value: string;
  }[];
  verified: boolean;
  verified_at?: string;
  last_check_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WhiteLabelTheme {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  css_template?: string;
  preview_image_url?: string;
  is_premium?: boolean;
  is_default?: boolean;
}

export interface WhiteLabelAsset {
  id?: string;
  user_id?: string;
  asset_type: 'logo' | 'favicon' | 'watermark' | 'background' | 'og_image';
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  created_at?: string;
  updated_at?: string;
}

const defaultConfig: WhiteLabelConfig = {
  company_name: '',
  primary_color: '#3b82f6',
  secondary_color: '#1d4ed8',
  accent_color: '#06b6d4',
  background_color: '#ffffff',
  text_color: '#1f2937',
  domain_verified: false,
  branding_settings: {
    hide_powered_by: false,
    show_company_logo: true
  },
  player_settings: {
    skin: 'default',
    controls_color: '#3b82f6',
    progress_color: '#06b6d4',
    watermark_enabled: false,
    watermark_position: 'bottom-right',
    watermark_opacity: 80
  }
};

export const useWhiteLabelConfig = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<WhiteLabelConfig>(defaultConfig);
  const [themes, setThemes] = useState<WhiteLabelTheme[]>([]);
  const [assets, setAssets] = useState<WhiteLabelAsset[]>([]);
  const [domainVerification, setDomainVerification] = useState<DomainVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch configuration
  const fetchConfig = useCallback(async () => {
    try {
      // TODO: Implement API call to fetch white label configuration
      // const response = await api.settings.getWhiteLabel();
      
      // Demo data for now
      const demoConfig: WhiteLabelConfig = {
        company_name: 'Mi Empresa',
        primary_color: '#3b82f6',
        secondary_color: '#475569',
        accent_color: '#f59e0b',
        background_color: '#ffffff',
        text_color: '#1f2937',
        domain_verified: false,
        branding_settings: {
          hide_powered_by: false,
          show_company_logo: true,
        },
        player_settings: {
          skin: 'default',
          controls_color: '#3b82f6',
          progress_color: '#f59e0b',
          watermark_enabled: false,
          watermark_position: 'bottom-right',
          watermark_opacity: 0.7,
        },
      };
      
      setConfig(demoConfig);
    } catch (error) {
      console.error('Error fetching white label config:', error);
      toast.error('Error al cargar configuración de marca blanca');
    }
  }, []);

  // Fetch themes
  const fetchThemes = useCallback(async () => {
    try {
      // TODO: Implement API call to fetch themes
      // const response = await api.settings.getThemes();
      
      // Demo themes for now
      const demoThemes: WhiteLabelTheme[] = [
        {
          id: '1',
          name: 'default',
          display_name: 'Tema por Defecto',
          color_scheme: {
            primary: '#3b82f6',
            secondary: '#475569',
            accent: '#f59e0b',
            background: '#ffffff',
            text: '#1f2937',
          },
          is_default: true,
        },
      ];
      
      setThemes(demoThemes);
    } catch (error) {
      console.error('Error fetching themes:', error);
      toast.error('Error al cargar temas');
    }
  }, []);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      // TODO: Implement API call to fetch assets
      // const response = await api.settings.getAssets();
      
      // Demo assets for now
      const demoAssets: WhiteLabelAsset[] = [];
      
      setAssets(demoAssets);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Error al cargar assets');
    }
  }, []);

  // Save configuration
  const saveConfig = async (newConfig: Partial<WhiteLabelConfig>) => {
    setSaving(true);
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const configData = {
        user_id: user.id,
        ...config,
        ...newConfig,
        updated_at: new Date().toISOString()
      };

      // TODO: Implement API call to save configuration
      // const response = await api.settings.updateWhiteLabel(configData);
      
      // For now, just update local state
      setConfig(configData);
      toast.success('Configuración guardada exitosamente');
      return configData;
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Apply theme
  const applyTheme = async (theme: WhiteLabelTheme) => {
    try {
      const themeConfig = {
        primary_color: theme.color_scheme.primary,
        secondary_color: theme.color_scheme.secondary,
        accent_color: theme.color_scheme.accent,
        background_color: theme.color_scheme.background,
        text_color: theme.color_scheme.text,
        custom_css: theme.css_template || ''
      };

      await saveConfig(themeConfig);
      toast.success(`Tema "${theme.display_name}" aplicado exitosamente`);
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Error al aplicar tema');
    }
  };

  // Upload asset
  const uploadAsset = async (file: File, assetType: WhiteLabelAsset['asset_type']) => {
    try {
      if (!user) throw new Error('Usuario no autenticado');

      // Upload file to storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetType', assetType);
      
      const response = await api.post('/white-label/upload-asset', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const publicUrl = response.data.fileUrl;

      // Save asset record
      const assetData: Omit<WhiteLabelAsset, 'id'> = {
        user_id: user.id,
        asset_type: assetType,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type
      };

      // TODO: Implement API call to save asset record
      // const response = await api.settings.createAsset(assetData);
      
      // For now, create a demo asset record
      const newAsset: WhiteLabelAsset = {
        id: Date.now().toString(),
        ...assetData,
        created_at: new Date().toISOString(),
      };
      
      // Update assets list
      setAssets(prev => [newAsset, ...prev]);
      
      // Update config with new asset URL
      const configUpdate: Partial<WhiteLabelConfig> = {};
      if (assetType === 'logo') {
        configUpdate.company_logo_url = publicUrl;
      } else if (assetType === 'favicon') {
        configUpdate.company_favicon_url = publicUrl;
      }
      
      if (Object.keys(configUpdate).length > 0) {
        await saveConfig(configUpdate);
      }

      toast.success(`${assetType} subido exitosamente`);
      return newAsset;
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast.error('Error al subir archivo');
      throw error;
    }
  };

  // Delete asset
  const deleteAsset = async (assetId: string) => {
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) throw new Error('Asset no encontrado');

      // Delete from storage
      const fileName = asset.file_url.split('/').pop();
      if (fileName) {
        // Storage functionality removed - implement with your preferred storage solution
      }

      // TODO: Implement API call to delete asset
      // await api.settings.deleteAsset(assetId);

      // Update assets list
      setAssets(prev => prev.filter(a => a.id !== assetId));
      
      toast.success('Asset eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Error al eliminar asset');
    }
  };

  // Setup custom domain
  const setupCustomDomain = async (domain: string) => {
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const verificationToken = crypto.randomUUID();
      
      const dnsRecords = [
        {
          type: 'CNAME',
          name: domain,
          value: 'hostreamly.com'
        },
        {
          type: 'TXT',
          name: `_hostreamly-verification.${domain}`,
          value: verificationToken
        }
      ];

      // TODO: Implement API call to setup domain verification
      // const response = await api.settings.setupDomain({ domain, verification_token: verificationToken, dns_records: dnsRecords });
      
      const domainData: DomainVerification = {
        id: Date.now().toString(),
        domain,
        verification_token: verificationToken,
        dns_records: dnsRecords,
        verified: false,
        created_at: new Date().toISOString(),
      };
      
      setDomainVerification(domainData);
      
      // Update config with custom domain
      await saveConfig({ custom_domain: domain });
      
      toast.success('Dominio personalizado configurado. Verifica los registros DNS.');
      return domainData;
    } catch (error) {
      console.error('Error setting up custom domain:', error);
      toast.error('Error al configurar dominio personalizado');
      throw error;
    }
  };

  // Verify custom domain
  const verifyCustomDomain = async (domain: string) => {
    try {
      // Simulate DNS verification (in real implementation, this would check actual DNS records)
      const isVerified = Math.random() > 0.5; // Simulate 50% success rate
      
      if (isVerified) {
        // TODO: Implement API call to update domain verification
        // await api.settings.verifyDomain(domain);

        await saveConfig({ domain_verified: true });
        
        if (domainVerification) {
          setDomainVerification({
            ...domainVerification,
            verified: true,
            verified_at: new Date().toISOString()
          });
        }
        
        toast.success('Dominio verificado exitosamente');
        return true;
      } else {
        toast.error('No se pudo verificar el dominio. Verifica los registros DNS.');
        return false;
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast.error('Error al verificar dominio');
      return false;
    }
  };

  // Generate CSS
  const generateCSS = () => {
    return `
      :root {
        --wl-primary: ${config.primary_color};
        --wl-secondary: ${config.secondary_color};
        --wl-accent: ${config.accent_color};
        --wl-background: ${config.background_color};
        --wl-text: ${config.text_color};
      }

      .brand-primary { background-color: var(--wl-primary); color: white; }
      .brand-secondary { background-color: var(--wl-secondary); color: white; }
      .brand-accent { background-color: var(--wl-accent); color: white; }
      .brand-text { color: var(--wl-text); }
      .brand-bg { background-color: var(--wl-background); }

      ${config.branding_settings?.hide_powered_by ? '.powered-by { display: none !important; }' : ''}
      ${config.custom_css || ''}
    `;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchConfig(),
        fetchThemes(),
        fetchAssets()
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchConfig, fetchThemes, fetchAssets]);

  return {
    config,
    themes,
    assets,
    domainVerification,
    loading,
    saving,
    saveConfig,
    applyTheme,
    uploadAsset,
    deleteAsset,
    setupCustomDomain,
    verifyCustomDomain,
    generateCSS,
    refetch: () => {
      fetchConfig();
      fetchAssets();
    }
  };
};

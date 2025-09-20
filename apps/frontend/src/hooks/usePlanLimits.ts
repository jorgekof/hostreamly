import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
export interface PlanLimits {
  storage: number; // GB
  bandwidth: number; // TB
  videos: number;
  maxDuration: number; // minutes
  customPlayers: number;
  analytics: 'basic' | 'advanced' | 'enterprise';
  apiAccess: boolean;
  webhooks: boolean;
  whiteLabel: boolean;
  support: 'email' | 'priority' | '24/7';
  users: number;
  sla: boolean;
  liveStreamingHours?: number; // optional for plans that don't support live streaming
  viewingHours?: number; // optional viewing hours per month
  maxConcurrentViewers?: number; // optional concurrent viewers limit
  overageRate?: number; // optional overage rate per GB
}

export interface UsageData {
  storage: number; // GB used
  bandwidth: number; // TB used
  videos: number;
  users: number;
}

const PLAN_CONFIGS: Record<string, PlanLimits> = {
  starter: {
    storage: 100, // 100 GB
    bandwidth: 1, // 1 TB
    videos: -1, // unlimited uploads
    maxDuration: -1, // unlimited
    customPlayers: 1,
    analytics: 'basic',
    apiAccess: false,
    webhooks: false,
    whiteLabel: false,
    support: 'email',
    users: 1,
    sla: false
  },
  professional: {
    storage: 1000, // 1 TB = 1000 GB
    bandwidth: 10, // 10 TB
    videos: -1, // unlimited uploads
    maxDuration: -1, // unlimited
    customPlayers: 5,
    analytics: 'advanced',
    apiAccess: true,
    webhooks: true,
    whiteLabel: false,
    support: 'priority',
    users: 5,
    sla: false,
    liveStreamingHours: 0, // Live streaming removed from Professional
    viewingHours: 200, // horas de visualización por mes
    maxConcurrentViewers: 0, // No concurrent viewers for live streaming
    overageRate: 0.05 // $0.05 por GB excedente
  },
  enterprise: {
    storage: 1000, // 1 TB = 1000 GB (reducido para sostenibilidad)
    bandwidth: 10, // 10 TB (reducido para sostenibilidad)
    videos: -1, // unlimited uploads
    maxDuration: -1, // unlimited
    customPlayers: 20,
    analytics: 'enterprise',
    apiAccess: true,
    webhooks: true,
    whiteLabel: true,
    support: '24/7',
    users: 5, // reducido de 10 a 5 para sostenibilidad
    sla: true,
    liveStreamingHours: 20, // reducido de 50 a 20 horas por mes para sostenibilidad
    viewingHours: 100, // reducido de 500 a 100 horas de visualización por mes
    maxConcurrentViewers: 100, // mantenido en 100 para equilibrio costo-beneficio
    overageRate: 0.05 // $0.05 por GB excedente
  }
};

export const usePlanLimits = () => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [limits, setLimits] = useState<PlanLimits>(PLAN_CONFIGS.starter);
  const [usage, setUsage] = useState<UsageData>({
    storage: 0,
    bandwidth: 0,
    videos: 0,
    users: 1
  });
  const [loading, setLoading] = useState(true);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch subscription data from API
        const response = await apiClient.auth.getProfile();
        const data = response.data;

        if (data?.subscribed && data?.subscription_tier) {
          const plan = data.subscription_tier.toLowerCase();
          setCurrentPlan(plan);
          setLimits(PLAN_CONFIGS[plan] || PLAN_CONFIGS.starter);
        } else {
          // No subscription found - user needs to select a plan
          setCurrentPlan('none');
          setLimits({
            storage: 0,
            bandwidth: 0,
            videos: 0,
            maxDuration: 0,
            customPlayers: 0,
            analytics: 'basic',
            apiAccess: false,
            webhooks: false,
            whiteLabel: false,
            support: 'email',
            users: 1,
            sla: false
          });
        }
      } catch (error) {
        console.error('Error in fetchSubscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  // Fetch current usage
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) return;

      try {
        // Get video count and total size from API
        const videosResponse = await apiClient.videos.getMyVideos();
        const videos = videosResponse.data;

        // Calculate storage usage (convert bytes to GB)
        const totalStorage = videos?.reduce((sum: number, video: any) => sum + (video.file_size || 0), 0) || 0;
        const storageGB = totalStorage / (1024 * 1024 * 1024);

        // Get user count (for team plans)
        const usersResponse = await apiClient.users.getAll();
        const userCount = usersResponse.data.length;

        setUsage({
          storage: Math.round(storageGB * 100) / 100,
          bandwidth: 0, // This would come from analytics in real implementation
          videos: videos?.length || 0,
          users: userCount || 1
        });
      } catch (error) {
        console.error('Error fetching usage:', error);
      }
    };

    fetchUsage();
  }, [user]);

  // Validation functions with realistic Video CDN integration
  const canUploadVideo = (fileSizeBytes: number, durationMinutes: number): { allowed: boolean; reason?: string } => {
    const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
    
    // Check storage limit - with Video CDN this is realistic
    if (limits.storage !== -1 && (usage.storage + fileSizeGB) > limits.storage) {
      return { 
        allowed: false, 
        reason: `Excederás el límite de almacenamiento (${limits.storage}GB). Actual: ${usage.storage.toFixed(2)}GB. ¿Activar cobro adicional por $0.05/GB?` 
      };
    }

    // With Video CDN, there are no duration limits - processing is just-in-time
    return { allowed: true };
  };

  // Check if user is approaching bandwidth limit
  const isBandwidthNearLimit = (currentBandwidthGB: number, threshold = 80): boolean => {
    if (limits.bandwidth === -1) return false; // Unlimited
    return (currentBandwidthGB / limits.bandwidth) * 100 >= threshold;
  };

  // Calculate potential overage costs
  const calculateOverageCost = (storageOverageGB: number, bandwidthOverageGB: number) => {
    const storagePrice = 0.05; // $0.05 per GB
    const bandwidthPrice = 0.05; // $0.05 per GB
    
    return {
      storage: storageOverageGB * storagePrice,
      bandwidth: bandwidthOverageGB * bandwidthPrice,
      total: (storageOverageGB * storagePrice) + (bandwidthOverageGB * bandwidthPrice)
    };
  };

  const canAccessFeature = (feature: keyof PlanLimits): boolean => {
    const featureValue = limits[feature];
    
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }
    
    return true;
  };

  const canAddUser = (): { allowed: boolean; reason?: string } => {
    if (limits.users === -1) return { allowed: true };
    
    if (usage.users >= limits.users) {
      return { 
        allowed: false, 
        reason: `Excede el límite de usuarios (${limits.users}). Actualiza tu plan.` 
      };
    }
    
    return { allowed: true };
  };

  const getUsagePercentage = (type: 'storage' | 'bandwidth' | 'videos' | 'users'): number => {
    const limit = limits[type];
    if (limit === -1) return 0; // Unlimited
    
    const used = usage[type];
    return Math.min((used / limit) * 100, 100);
  };

  const isNearLimit = (type: 'storage' | 'bandwidth' | 'videos' | 'users', threshold = 80): boolean => {
    return getUsagePercentage(type) >= threshold;
  };

  return {
    currentPlan,
    limits,
    usage,
    loading,
    canUploadVideo,
    canAccessFeature,
    canAddUser,
    getUsagePercentage,
    isNearLimit,
    isBandwidthNearLimit,
    calculateOverageCost,
    planName: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
  };
};

export const PLAN_LIMITS = {
  free: {
    storage: 5 * 1024 * 1024 * 1024, // 5GB
    bandwidth: 100 * 1024 * 1024 * 1024, // 100GB
    videos: -1, // unlimited uploads
    liveStreams: 0, // no live streaming
    liveStreamDuration: 0,
    concurrentViewers: 0,
    viewingHours: 5, // 5 hours monthly
    overageCostPerGB: 0.05
  },
  starter: {
    storage: 100 * 1024 * 1024 * 1024, // 100GB
    bandwidth: 1000 * 1024 * 1024 * 1024, // 1TB
    videos: -1, // unlimited uploads
    liveStreams: 0, // no live streaming
    liveStreamDuration: 0,
    concurrentViewers: 0,
    viewingHours: 20, // 20 hours monthly
    overageCostPerGB: 0.05
  },
  professional: {
    storage: 500 * 1024 * 1024 * 1024, // 500GB (reducido para sostenibilidad)
    bandwidth: 5000 * 1024 * 1024 * 1024, // 5TB (reducido para sostenibilidad)
    videos: -1, // unlimited uploads
    liveStreams: -1, // unlimited live streams
    liveStreamDuration: 10 * 60 * 60, // 10 hours monthly
    concurrentViewers: 50, // max 50 simultaneous viewers (reducido)
    viewingHours: 50, // 50 hours monthly
    maxUsers: 3, // max 3 users (reducido)
    overageCostPerGB: 0.05
  },
  enterprise: {
    storage: 1 * 1024 * 1024 * 1024 * 1024, // 1TB (ajustado para sostenibilidad)
    bandwidth: 10 * 1024 * 1024 * 1024 * 1024, // 10TB (ajustado para sostenibilidad)
    videos: -1, // unlimited uploads
    liveStreams: -1, // unlimited live streams
    liveStreamDuration: 20 * 60 * 60, // 20 horas mensuales (sostenible)
    concurrentViewers: 100, // max 100 simultaneous viewers (equilibrio costo-beneficio)
    viewingHours: 100, // 100 hours monthly (límite sostenible)
    maxUsers: 5, // max 5 users (sostenible)
    overageCostPerGB: 0.05
  }
};

import { useState, useEffect, useCallback } from 'react';
import api, { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Analytics {
  id: string;
  video_id: string;
  event_type: 'play' | 'pause' | 'seek' | 'complete';
  timestamp_position?: number;
  session_id?: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AnalyticsStats {
  total_views: number;
  total_watch_time: number;
  avg_view_duration: number;
  completion_rate: number;
  unique_viewers: number;
  top_videos: Array<{
    video_id: string;
    title: string;
    views: number;
    watch_time: number;
  }>;
  geographic_data: Array<{
    country: string;
    views: number;
  }>;
  device_data: Array<{
    device_type: string;
    views: number;
  }>;
}

export const useAnalyticsAPI = () => {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const trackEvent = async (eventData: {
    video_id: string;
    event_type: 'play' | 'pause' | 'seek' | 'complete';
    timestamp_position?: number;
    session_id?: string;
  }) => {
    try {
      // Generate session ID if not provided
      const sessionId = eventData.session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await api.post('/analytics/track', {
        video_id: eventData.video_id,
        event_type: eventData.event_type,
        timestamp_position: eventData.timestamp_position,
        session_id: sessionId,
        user_agent: navigator.userAgent
      });

      // If it's a play event, also increment the video views counter
      if (eventData.event_type === 'play') {
        await api.post(`/videos/${eventData.video_id}/increment-views`);
      }

    } catch (err: unknown) {
      console.error('Error tracking event:', err);
    }
  };

  const fetchAnalytics = useCallback(async (videoId?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (videoId) {
        params.append('video_id', videoId);
      }
      params.append('limit', '1000');

      const response = await api.get(`/analytics?${params.toString()}`);
      const analyticsData = response.data;

      // Transform data to match Analytics interface
      const transformedData: Analytics[] = (analyticsData || []).map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return {
          id: i.id as string,
          video_id: i.video_id as string,
          event_type: i.event_type as 'play' | 'pause' | 'seek' | 'complete',
          timestamp_position: i.timestamp_position as number,
          session_id: i.session_id as string,
          user_id: i.user_id as string,
          ip_address: i.ip_address ? String(i.ip_address) : undefined,
          user_agent: i.user_agent as string,
          created_at: i.created_at as string
        };
      });

      setAnalytics(transformedData);

      // Calculate aggregated stats
      await calculateStats(videoId);

    } catch (err: unknown) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const calculateStats = useCallback(async (videoId?: string) => {
    try {
      // Get analytics stats from backend
      const params = new URLSearchParams();
      if (videoId) {
        params.append('video_id', videoId);
      }

      const response = await api.get(`/analytics/stats?${params.toString()}`);
      const statsData = response.data;

      if (!statsData) return;

      // Use stats data from backend
      const calculatedStats: AnalyticsStats = {
        total_views: statsData.total_views || 0,
        total_watch_time: statsData.total_watch_time || 0,
        avg_view_duration: statsData.avg_view_duration || 0,
        completion_rate: statsData.completion_rate || 0,
        unique_viewers: statsData.unique_viewers || 0,
        top_videos: statsData.top_videos || [],
        geographic_data: statsData.geographic_data || [],
        device_data: statsData.device_data || []
      };

      setStats(calculatedStats);

    } catch (err: unknown) {
      console.error('Error calculating stats:', err);
    }
  }, [user]);

  // Auto-refresh analytics every 30 seconds when component is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchAnalytics]);

  return {
    analytics,
    stats,
    loading,
    error,
    trackEvent,
    fetchAnalytics,
    calculateStats
  };
};

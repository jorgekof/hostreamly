import { useState, useEffect, useCallback } from 'react';
import { apiClient as api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Video {
  id: string;
  title: string;
  description?: string;
  filename: string;
  file_size: number;
  duration?: number;
  views: number;
  status: string;
  processing_status: string;
  processing_progress: number;
  resolution?: string;
  frame_rate?: number;
  bitrate?: number;
  codec?: string;
  video_url?: string;
  thumbnail_url?: string;
  cdn_url?: string;
  embed_code?: string;
  storage_path?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ProcessingLog {
  id: string;
  video_id: string;
  stage: string;
  status: string;
  message?: string;
  progress: number;
  created_at: string;
}

export const useVideoAPI = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchVideos = useCallback(async () => {
    if (!user) {
      setVideos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.videos.getAll();
      setVideos(response.data.videos || []);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch videos';
      console.error('Error fetching videos:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getVideo = async (videoId: string): Promise<Video | null> => {
    try {
      const response = await api.videos.getById(videoId);
      return response.data.video;
    } catch (err: unknown) {
      console.error('Error fetching video:', err);
      return null;
    }
  };

  const getProcessingLogs = async (videoId: string): Promise<ProcessingLog[]> => {
    try {
      const response = await api.videos.getProcessingLogs(videoId);
      return response.data.logs || [];
    } catch (err: unknown) {
      console.error('Error fetching processing logs:', err);
      return [];
    }
  };

  const updateVideo = async (videoId: string, updates: Partial<Video>) => {
    try {
      const response = await api.videos.update(videoId, updates);
      const updatedVideo = response.data.video;

      // Update local state
      setVideos(prevVideos => 
        prevVideos.map(video => 
          video.id === videoId ? { ...video, ...updatedVideo } : video
        )
      );

      return updatedVideo;
    } catch (err: unknown) {
      console.error('Error updating video:', err);
      throw err;
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      await api.videos.delete(videoId);

      // Update local state
      setVideos(prevVideos => 
        prevVideos.filter(video => video.id !== videoId)
      );

      return true;
    } catch (err: unknown) {
      console.error('Error deleting video:', err);
      throw err;
    }
  };

  const incrementViews = async (videoId: string) => {
    try {
      await api.videos.incrementViews(videoId);

      // Update local state
      setVideos(prevVideos => 
        prevVideos.map(video => 
          video.id === videoId 
            ? { ...video, views: video.views + 1 }
            : video
        )
      );
    } catch (err: unknown) {
      console.error('Error incrementing views:', err);
    }
  };

  
  // For now, we'll rely on manual refresh and periodic polling if needed

  // Initial fetch
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    fetchVideos,
    getVideo,
    getProcessingLogs,
    updateVideo,
    deleteVideo,
    incrementViews,
    refetch: fetchVideos
  };
};

// Export the analytics API from separate file
export { useAnalyticsAPI } from './useAnalyticsAPI';
export { useWebhooks } from './useWebhooks';

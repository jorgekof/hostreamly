import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { apiClient as api } from '@/lib/api';
export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  context?: Record<string, unknown>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const useSystemLogs = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (limit = 100) => {
    try {
      const response = await api.get(`/admin/logs?limit=${limit}`);
      const data = response.data;
      setLogs((data || []).map(log => ({
        id: log.id,
        level: log.level as 'info' | 'warning' | 'error' | 'debug',
        message: log.message,
        context: log.context,
        user_id: log.user_id || undefined,
        ip_address: log.ip_address as string || undefined,
        user_agent: log.user_agent || undefined,
        created_at: log.created_at
      })));
    } catch (error) {
      console.error('Error fetching system logs:', error);
      toast.error('Error al cargar logs del sistema');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = async (level?: string, startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');
      
      if (level && level !== 'all') {
        params.append('level', level);
      }
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      
      if (endDate) {
        params.append('end_date', endDate);
      }

      const response = await api.get(`/admin/logs?${params.toString()}`);
      const data = response.data;
      
      setLogs((data || []).map(log => ({
        id: log.id,
        level: log.level as 'info' | 'warning' | 'error' | 'debug',
        message: log.message,
        context: log.context,
        user_id: log.user_id || undefined,
        ip_address: log.ip_address as string || undefined,
        user_agent: log.user_agent || undefined,
        created_at: log.created_at
      })));
    } catch (error) {
      console.error('Error filtering logs:', error);
      toast.error('Error al filtrar logs');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    loading,
    fetchLogs,
    filterLogs,
    refetch: fetchLogs
  };
};

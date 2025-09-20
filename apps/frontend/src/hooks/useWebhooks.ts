import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useWebhooks = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = async () => {
    try {
  
      const mockWebhooks: Webhook[] = [];
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Error al cargar webhooks');
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async (webhook: Omit<Webhook, 'id' | 'created_at' | 'updated_at'>) => {
    try {
  
      const newWebhook: Webhook = {
        id: 'webhook-' + Date.now(),
        ...webhook,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setWebhooks(prev => [newWebhook, ...prev]);
      toast.success('Webhook creado exitosamente (modo demo)');
      return newWebhook;
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Error al crear webhook');
      throw error;
    }
  };

  const updateWebhook = async (id: string, updates: Partial<Webhook>) => {
    try {
  
      setWebhooks(prev => prev.map(w => 
        w.id === id 
          ? { ...w, ...updates, updated_at: new Date().toISOString() }
          : w
      ));
      toast.success('Webhook actualizado exitosamente (modo demo)');
      return { id, ...updates };
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast.error('Error al actualizar webhook');
      throw error;
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
  
      setWebhooks(prev => prev.filter(w => w.id !== id));
      toast.success('Webhook eliminado exitosamente (modo demo)');
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Error al eliminar webhook');
      throw error;
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  return {
    webhooks,
    loading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    refetch: fetchWebhooks
  };
};

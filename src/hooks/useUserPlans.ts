import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import api, { apiClient } from '@/lib/api';
export interface UserPlan {
  id: string;
  user_id: string;
  plan_name: 'none' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  started_at: string;
  expires_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithPlan {
  id: string;
  email: string;
  full_name?: string;
  plan?: UserPlan;
}

export const useUserPlans = () => {
  const [users, setUsersWithPlans] = useState<UserWithPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsersWithPlans = async () => {
    try {
      const response = await api.get('/admin/users-with-plans');
      const usersWithPlans = response.data || [];
      setUsersWithPlans(usersWithPlans);
    } catch (error) {
      console.error('Error fetching users with plans:', error);
      toast.error('Error al cargar usuarios y planes');
    } finally {
      setLoading(false);
    }
  };

  const assignPlan = async (userId: string, planName: UserPlan['plan_name']) => {
    try {
      const response = await api.post(`/admin/users/${userId}/plan`, { plan_name: planName });
      const data = response.data;
      
      // Update local state
      setUsersWithPlans(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, plan: data as UserPlan }
          : user
      ));
      
      toast.success('Plan asignado exitosamente');
      return data;
    } catch (error) {
      console.error('Error assigning plan:', error);
      toast.error('Error al asignar plan');
      throw error;
    }
  };

  const updatePlanStatus = async (userId: string, status: UserPlan['status']) => {
    try {
      const response = await api.put(`/admin/users/${userId}/plan/status`, { status });
      const data = response.data;
      
      setUsersWithPlans(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, plan: data as UserPlan }
          : user
      ));
      
      toast.success('Estado del plan actualizado');
      return data;
    } catch (error) {
      console.error('Error updating plan status:', error);
      toast.error('Error al actualizar estado del plan');
      throw error;
    }
  };

  useEffect(() => {
    fetchUsersWithPlans();
  }, []);

  return {
    users,
    loading,
    assignPlan,
    updatePlanStatus,
    refetch: fetchUsersWithPlans
  };
};

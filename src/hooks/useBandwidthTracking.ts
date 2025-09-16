import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
export interface BandwidthUsage {
  date: string;
  bytes_transferred: number;
}

export const useBandwidthTracking = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<BandwidthUsage[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate total bandwidth usage for current month
  const getCurrentMonthUsage = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return usage
      .filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((total, item) => total + item.bytes_transferred, 0);
  };

  // Fetch bandwidth usage data
  useEffect(() => {
    const fetchBandwidthUsage = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Supabase call replaced - implement with API

        if (error) {
          console.error('Error fetching bandwidth usage:', error);
          return;
        }

        setUsage(data || []);
      } catch (error) {
        console.error('Error in fetchBandwidthUsage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBandwidthUsage();
  }, [user]);

  // Track new bandwidth usage
  const trackBandwidthUsage = async (bytesTransferred: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if there's already an entry for today
      // Supabase call replaced - implement with API

      if (fetchError) {
        console.error('Error fetching existing bandwidth usage:', fetchError);
        return;
      }

      if (existingData) {
        // Update existing entry
        // Supabase call replaced - implement with API

        if (updateError) {
          console.error('Error updating bandwidth usage:', updateError);
        }
      } else {
        // Create new entry
        // Supabase call replaced - implement with API

        if (insertError) {
          console.error('Error inserting bandwidth usage:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in trackBandwidthUsage:', error);
    }
  };

  const getTotalBandwidthGB = () => {
    const totalBytes = getCurrentMonthUsage();
    return Math.round((totalBytes / (1024 * 1024 * 1024)) * 100) / 100; // Convert to GB with 2 decimals
  };

  return {
    usage,
    loading,
    trackBandwidthUsage,
    getCurrentMonthUsage,
    getTotalBandwidthGB
  };
};

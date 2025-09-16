import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
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
        // API call to fetch bandwidth usage
        const response = await apiClient.analytics.getBandwidthUsage();
        const data = response.data;

        if (data) {
          setUsage(data);
        }
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
        try {
          const fetchResponse = await apiClient.analytics.getBandwidthUsageByDate(today);
          const existingData = fetchResponse.data;

          if (existingData) {
            // Update existing entry
            await apiClient.analytics.updateBandwidthUsage(today, {
              bytes_transferred: existingData.bytes_transferred + bytesTransferred
            });
          } else {
            // Create new entry
            await apiClient.analytics.createBandwidthUsage({
              date: today,
              bytes_transferred: bytesTransferred
            });
          }
        } catch (fetchError) {
          // If no existing entry found, create new one
          await apiClient.analytics.createBandwidthUsage({
            date: today,
            bytes_transferred: bytesTransferred
          });
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

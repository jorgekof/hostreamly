/**
 * BunnyVaultProvider
 * Context provider for BunnyVault SDK
 */

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BunnyVaultAPI } from '../api/BunnyVaultAPI';
import { VideoCache } from '../utils/VideoCache';
import { AnalyticsTracker } from '../utils/AnalyticsTracker';

import {
  BunnyVaultProviderProps,
  BunnyVaultContextValue,
  BunnyVaultAPIConfig,
  AnalyticsConfig,
  CacheConfig,
  OfflineConfig,
  BunnyVaultError,
} from '../types';
import {
  API_CONFIG,
  ANALYTICS_CONFIG,
  CACHE_CONFIG,
  OFFLINE_CONFIG,
  STORAGE_KEYS,
  ERROR_CODES,
} from '../constants';

// Create context
export const BunnyVaultContext = createContext<BunnyVaultContextValue | null>(null);

/**
 * BunnyVault Provider Component
 * Provides SDK context to child components
 */
export const BunnyVaultProvider: React.FC<BunnyVaultProviderProps> = ({
  children,
  config,
  analyticsConfig,
  cacheConfig,
  offlineConfig,
}) => {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [api, setApi] = useState<BunnyVaultAPI | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsTracker | null>(null);
  const [cache, setCache] = useState<VideoCache | null>(null);
  const [initError, setInitError] = useState<BunnyVaultError | null>(null);

  // Merged configurations
  const mergedConfig = useMemo((): BunnyVaultAPIConfig => ({
    ...API_CONFIG,
    ...config,
  }), [config]);

  const mergedAnalyticsConfig = useMemo((): AnalyticsConfig => ({
    ...ANALYTICS_CONFIG,
    ...analyticsConfig,
  }), [analyticsConfig]);

  const mergedCacheConfig = useMemo((): CacheConfig => ({
    ...CACHE_CONFIG,
    ...cacheConfig,
  }), [cacheConfig]);

  const mergedOfflineConfig = useMemo((): OfflineConfig => ({
    ...OFFLINE_CONFIG,
    ...offlineConfig,
  }), [offlineConfig]);

  /**
   * Initialize network state monitoring
   */
  const initializeNetworkMonitoring = useCallback(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsOnline(connected ?? false);
      
      // Log network state changes
      console.log('Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsOnline(connected ?? false);
    });

    return unsubscribe;
  }, []);

  /**
   * Initialize API client
   */
  const initializeAPI = useCallback(async (): Promise<BunnyVaultAPI> => {
    try {
      // Validate API configuration
      if (!mergedConfig.apiKey) {
        throw new BunnyVaultError(
          'API key is required',
          ERROR_CODES.CONFIGURATION_ERROR
        );
      }

      // Create API instance
      const apiInstance = new BunnyVaultAPI(mergedConfig);
      
      // Test API connection if online
      if (isOnline) {
        await apiInstance.testConnection();
      }
      
      return apiInstance;
    } catch (error) {
      console.error('Failed to initialize API:', error);
      throw new BunnyVaultError(
        'Failed to initialize API client',
        ERROR_CODES.INITIALIZATION_ERROR,
        error
      );
    }
  }, [mergedConfig, isOnline]);

  /**
   * Initialize cache system
   */
  const initializeCache = useCallback(async (): Promise<VideoCache> => {
    try {
      const cacheInstance = new VideoCache(mergedCacheConfig);
      await cacheInstance.initialize();
      return cacheInstance;
    } catch (error) {
      console.error('Failed to initialize cache:', error);
      throw new BunnyVaultError(
        'Failed to initialize cache system',
        ERROR_CODES.INITIALIZATION_ERROR,
        error
      );
    }
  }, [mergedCacheConfig]);

  /**
   * Initialize analytics tracker
   */
  const initializeAnalytics = useCallback(async (): Promise<AnalyticsTracker> => {
    try {
      const analyticsInstance = new AnalyticsTracker(mergedAnalyticsConfig);
      await analyticsInstance.initialize();
      return analyticsInstance;
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      throw new BunnyVaultError(
        'Failed to initialize analytics tracker',
        ERROR_CODES.INITIALIZATION_ERROR,
        error
      );
    }
  }, [mergedAnalyticsConfig]);

  /**
   * Save configuration to storage
   */
  const saveConfiguration = useCallback(async () => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.API_CONFIG, JSON.stringify(mergedConfig)],
        [STORAGE_KEYS.USER_PREFERENCES, JSON.stringify({
          analyticsConfig: mergedAnalyticsConfig,
          cacheConfig: mergedCacheConfig,
          offlineConfig: mergedOfflineConfig,
        })],
      ]);
    } catch (error) {
      console.warn('Failed to save configuration:', error);
    }
  }, [mergedConfig, mergedAnalyticsConfig, mergedCacheConfig, mergedOfflineConfig]);

  /**
   * Load saved configuration from storage
   */
  const loadSavedConfiguration = useCallback(async () => {
    try {
      const keys = [
        STORAGE_KEYS.API_CONFIG,
        STORAGE_KEYS.USER_PREFERENCES,
      ];
      
      const values = await AsyncStorage.multiGet(keys);
      const savedConfig = values[0][1] ? JSON.parse(values[0][1]) : null;
      const savedPreferences = values[1][1] ? JSON.parse(values[1][1]) : null;
      
      return {
        savedConfig,
        savedPreferences,
      };
    } catch (error) {
      console.warn('Failed to load saved configuration:', error);
      return {
        savedConfig: null,
        savedPreferences: null,
      };
    }
  }, []);

  /**
   * Initialize SDK
   */
  const initializeSDK = useCallback(async () => {
    try {
      setInitError(null);
      
      console.log('Initializing BunnyVault SDK...');
      
      // Load saved configuration
      await loadSavedConfiguration();
      
      // Initialize components in parallel
      const [apiInstance, cacheInstance, analyticsInstance] = await Promise.all([
        initializeAPI(),
        initializeCache(),
        initializeAnalytics(),
      ]);
      
      // Set instances
      setApi(apiInstance);
      setCache(cacheInstance);
      setAnalytics(analyticsInstance);
      
      // Save current configuration
      await saveConfiguration();
      
      // Mark as initialized
      setIsInitialized(true);
      
      console.log('BunnyVault SDK initialized successfully');
      
      // Track initialization event
      if (analyticsInstance && mergedAnalyticsConfig.enabled) {
        analyticsInstance.trackEvent({
          type: 'sdk_initialized',
          videoId: 'system',
          timestamp: Date.now(),
          data: {
            version: '1.0.0',
            platform: 'react-native',
            isOnline,
          },
        });
      }
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      setInitError(error instanceof BunnyVaultError ? error : new BunnyVaultError(
        'SDK initialization failed',
        ERROR_CODES.INITIALIZATION_ERROR,
        error
      ));
    }
  }, [
    loadSavedConfiguration,
    initializeAPI,
    initializeCache,
    initializeAnalytics,
    saveConfiguration,
    mergedAnalyticsConfig.enabled,
    isOnline,
  ]);

  /**
   * Cleanup SDK resources
   */
  const cleanupSDK = useCallback(async () => {
    try {
      console.log('Cleaning up BunnyVault SDK...');
      
      // Cleanup analytics
      if (analytics) {
        await analytics.flush();
        analytics.destroy();
      }
      
      // Cleanup cache
      if (cache) {
        await cache.cleanup();
      }
      
      // Reset state
      setApi(null);
      setCache(null);
      setAnalytics(null);
      setIsInitialized(false);
      
      console.log('BunnyVault SDK cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup SDK:', error);
    }
  }, [analytics, cache]);

  /**
   * Handle configuration changes
   */
  const handleConfigChange = useCallback(async () => {
    if (isInitialized) {
      console.log('Configuration changed, reinitializing SDK...');
      await cleanupSDK();
      await initializeSDK();
    }
  }, [isInitialized, cleanupSDK, initializeSDK]);

  // Initialize SDK on mount
  useEffect(() => {
    const networkUnsubscribe = initializeNetworkMonitoring();
    
    // Initialize SDK after a short delay to ensure network state is set
    const initTimer = setTimeout(() => {
      initializeSDK();
    }, 100);
    
    return () => {
      clearTimeout(initTimer);
      networkUnsubscribe();
      cleanupSDK();
    };
  }, []);

  // Handle configuration changes
  useEffect(() => {
    if (isInitialized) {
      handleConfigChange();
    }
  }, [mergedConfig.apiKey, mergedConfig.baseUrl]);

  // Handle network state changes
  useEffect(() => {
    if (analytics && isInitialized) {
      analytics.trackEvent({
        type: 'network_state_changed',
        videoId: 'system',
        timestamp: Date.now(),
        data: { isOnline },
      });
    }
  }, [isOnline, analytics, isInitialized]);

  // Context value
  const contextValue = useMemo((): BunnyVaultContextValue | null => {
    if (!isInitialized || !api || !cache || !analytics) {
      return null;
    }
    
    return {
      api,
      analytics,
      cache,
      config: mergedConfig,
      isOnline,
      isInitialized,
    };
  }, [isInitialized, api, cache, analytics, mergedConfig, isOnline]);

  // Show initialization error
  if (initError) {
    console.error('BunnyVault SDK initialization error:', initError);
    
    // You might want to render an error component here
    // For now, we'll just render children with null context
  }

  // Show loading state while initializing
  if (!isInitialized && !initError) {
    // You might want to render a loading component here
    // For now, we'll render children with null context
  }

  return (
    <BunnyVaultContext.Provider value={contextValue}>
      {children}
    </BunnyVaultContext.Provider>
  );
};

/**
 * Hook to check if SDK is ready
 */
export const useBunnyVaultReady = (): boolean => {
  const context = React.useContext(BunnyVaultContext);
  return context !== null && context.isInitialized;
};

/**
 * Hook to get initialization error
 */
export const useBunnyVaultError = (): BunnyVaultError | null => {
  // This would need to be implemented with additional state management
  // For now, return null
  return null;
};

/**
 * Higher-order component to ensure SDK is ready
 */
export const withBunnyVault = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const isReady = useBunnyVaultReady();
    const error = useBunnyVaultError();
    
    if (error) {
      // Render error component
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h3>BunnyVault SDK Error</h3>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      );
    }
    
    if (!isReady) {
      // Render loading component
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <p>Initializing BunnyVault SDK...</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default BunnyVaultProvider;
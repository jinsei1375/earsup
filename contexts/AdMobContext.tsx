// contexts/AdMobContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

interface AdMobContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

const AdMobContext = createContext<AdMobContextType | undefined>(undefined);

export const AdMobProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeAdMob = useCallback(async () => {
    if (isInitialized || isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Request tracking permissions first (but don't fail if this fails)
      try {
        const { status } = await requestTrackingPermissionsAsync();
        if (status === 'granted') {
          console.log('AdMob: Tracking permission granted');
        } else {
          console.log('AdMob: Tracking permission not granted, but continuing with initialization');
        }
      } catch (trackingError) {
        console.warn('AdMob: Failed to request tracking permissions, continuing anyway', trackingError);
      }

      // Initialize AdMob
      await mobileAds().initialize();
      setIsInitialized(true);
      console.log('AdMob: Successfully initialized');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown AdMob initialization error';
      setError(errorMessage);
      console.warn('AdMob: Initialization failed', err);
      // Don't throw - just mark as failed so the app can continue without ads
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading]);

  useEffect(() => {
    // Don't initialize AdMob in test environment
    if (__DEV__ && process.env.NODE_ENV === 'test') {
      console.log('AdMob: Skipping initialization in test environment');
      return;
    }

    // Delay initialization to ensure React Native is fully ready
    const timer = setTimeout(() => {
      initializeAdMob();
    }, 500); // Give more time for app initialization

    return () => clearTimeout(timer);
  }, [initializeAdMob]);

  return (
    <AdMobContext.Provider value={{ isInitialized, isLoading, error }}>
      {children}
    </AdMobContext.Provider>
  );
};

export const useAdMob = () => {
  const context = useContext(AdMobContext);
  if (context === undefined) {
    throw new Error('useAdMob must be used within an AdMobProvider');
  }
  return context;
};
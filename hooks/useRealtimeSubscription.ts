// hooks/useRealtimeSubscription.ts
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeConnectionState, RealtimeStatus } from '@/types';

interface SubscriptionConfig {
  channelName: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export const useRealtimeSubscription = (config: SubscriptionConfig) => {
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>({
    connected: false,
    retries: 0,
    lastUpdate: null,
  });

  const subscriptionRef = useRef<any>(null);
  const { channelName, onConnected, onDisconnected, onError } = config;

  const subscribe = (subscriptions: Array<{
    event: string;
    schema: string;
    table: string;
    filter?: string;
    callback: (payload: any) => void;
  }>) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const channel = supabase.channel(channelName);

    subscriptions.forEach(({ event, schema, table, filter, callback }) => {
      const config: any = { event, schema, table };
      if (filter) config.filter = filter;
      
      channel.on('postgres_changes', config, callback);
    });

    channel.subscribe((status: RealtimeStatus) => {
      const isConnected = status === 'SUBSCRIBED';
      
      setConnectionState(prev => ({
        ...prev,
        connected: isConnected,
        retries: isConnected ? 0 : prev.retries + 1,
        lastUpdate: new Date(),
      }));

      if (isConnected) {
        onConnected?.();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onDisconnected?.();
        onError?.(new Error(`Subscription error: ${status}`));
      }
    });

    subscriptionRef.current = channel;
  };

  const unsubscribe = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    connectionState,
    subscribe,
    unsubscribe,
  };
};
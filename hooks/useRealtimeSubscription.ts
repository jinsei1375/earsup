// hooks/useRealtimeSubscription.ts
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeConnectionState, RealtimeStatus } from '@/types';

interface SubscriptionConfig {
  channelName: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export const useRealtimeSubscription = (config: SubscriptionConfig) => {
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>({
    connected: false,
    retries: 0,
    lastUpdate: null,
  });

  const subscriptionRef = useRef<any>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSubscriptionsRef = useRef<Array<{
    event: string;
    schema: string;
    table: string;
    filter?: string;
    callback: (payload: any) => void;
  }> | null>(null);

  const {
    channelName,
    onConnected,
    onDisconnected,
    onError,
    maxRetries = 5,
    retryDelay = 2000,
  } = config;

  const subscribe = (
    subscriptions: Array<{
      event: string;
      schema: string;
      table: string;
      filter?: string;
      callback: (payload: any) => void;
    }>
  ) => {
    // 既存の購読を保存（再接続用）
    currentSubscriptionsRef.current = subscriptions;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // SDK 54対応のチャンネル設定
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: 'user_id',
        },
      },
    });

    subscriptions.forEach(({ event, schema, table, filter, callback }) => {
      const config: any = { event, schema, table };
      if (filter) config.filter = filter;

      channel.on('postgres_changes', config, callback);
    });

    channel.subscribe((status: RealtimeStatus) => {
      console.log(`[Realtime] ${channelName} status: ${status}`);

      const isConnected = status === 'SUBSCRIBED';

      setConnectionState((prev) => ({
        ...prev,
        connected: isConnected,
        retries: isConnected ? 0 : prev.retries,
        lastUpdate: new Date(),
      }));

      if (isConnected) {
        // 再接続成功時はリトライカウントをリセット
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        onConnected?.();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onDisconnected?.();

        // より詳細なエラー情報
        const errorMessage = `Realtime connection failed: ${status} for channel "${channelName}"`;
        console.warn(errorMessage);

        // SDK 54でのCHANNEL_ERRORを非致命的として扱う
        if (status === 'CHANNEL_ERROR') {
          onError?.(new Error(errorMessage));
          // 自動再接続を試行
          attemptReconnect();
        } else {
          onError?.(new Error(errorMessage));
        }
      }
    });

    subscriptionRef.current = channel;
  };

  const attemptReconnect = () => {
    if (!currentSubscriptionsRef.current) return;

    setConnectionState((prev) => {
      if (prev.retries >= maxRetries) {
        console.error(`[Realtime] Max retries (${maxRetries}) reached for ${channelName}`);
        return prev;
      }

      const newRetries = prev.retries + 1;
      console.log(
        `[Realtime] Attempting reconnection ${newRetries}/${maxRetries} for ${channelName}`
      );

      // 指数バックオフでリトライ
      const delay = retryDelay * Math.pow(2, newRetries - 1);
      retryTimeoutRef.current = setTimeout(() => {
        if (currentSubscriptionsRef.current) {
          subscribe(currentSubscriptionsRef.current);
        }
      }, delay);

      return {
        ...prev,
        retries: newRetries,
        lastUpdate: new Date(),
      };
    });
  };

  const unsubscribe = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    currentSubscriptionsRef.current = null;

    setConnectionState({
      connected: false,
      retries: 0,
      lastUpdate: new Date(),
    });
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

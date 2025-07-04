// hooks/useRoomData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { SupabaseService } from '@/services/supabaseService';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import type { Room, ParticipantWithNickname } from '@/types';

interface UseRoomDataOptions {
  roomId: string | null;
  userId: string | null;
  pollingInterval?: number;
  enableRealtime?: boolean;
}

export const useRoomData = (options: UseRoomDataOptions) => {
  const { roomId, userId, pollingInterval = 5000, enableRealtime = true } = options;

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithNickname[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { connectionState, subscribe, unsubscribe } = useRealtimeSubscription({
    channelName: `room-${roomId}`,
    onConnected: () => console.log(`Room realtime connected: ${roomId}`),
    onDisconnected: () => console.log(`Room realtime disconnected: ${roomId}`),
    onError: (error) => console.error('Room realtime error:', error),
  });

  const fetchRoomData = useCallback(
    async (force = false) => {
      if (!roomId) return;

      const now = Date.now();
      if (!force && now - lastFetchRef.current < 1000) {
        return; // Debounce rapid calls
      }
      lastFetchRef.current = now;

      // force時のみローディング表示（状態参照を削除）
      if (force) {
        setLoading(true);
      }

      try {
        setError(null);

        // Fetch room data
        const roomData = await SupabaseService.getRoomById(roomId);
        setRoom(roomData);
        setIsHost(roomData.host_user_id === userId);

        // Fetch participants
        const participantsData = await SupabaseService.getParticipantsWithNicknames(
          roomId,
          roomData.host_user_id
        );
        setParticipants(participantsData);
      } catch (err: any) {
        setError(err.message || 'ルーム情報の取得中にエラーが発生しました。');
        console.error('Room data fetch error:', err);
      } finally {
        if (force) {
          setLoading(false);
        }
      }
    },
    [roomId, userId]
  );

  const updateRoomStatus = useCallback(
    async (status: Room['status']) => {
      if (!roomId) return;

      try {
        await SupabaseService.updateRoomStatus(roomId, status);
        setRoom((prev) => (prev ? { ...prev, status } : null));
      } catch (err: any) {
        setError(err.message || 'ルームステータスの更新中にエラーが発生しました。');
        throw err;
      }
    },
    [roomId]
  );

  const deleteRoom = useCallback(async () => {
    if (!roomId) return;

    try {
      await SupabaseService.deleteRoom(roomId);
    } catch (err: any) {
      setError(err.message || 'ルームの削除中にエラーが発生しました。');
      throw err;
    }
  }, [roomId]);

  // 関数参照を安定させるためのRef
  const fetchRoomDataRef = useRef<((force?: boolean) => Promise<void>) | null>(null);
  fetchRoomDataRef.current = fetchRoomData;

  // Setup realtime subscriptions
  useEffect(() => {
    if (!roomId || !enableRealtime) return;

    // デバウンス用タイマー
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (fetchRoomDataRef.current) {
          fetchRoomDataRef.current(false);
        }
      }, 300);
    };

    const subscriptions = [
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
        callback: (payload: any) => {
          console.log('Room changed:', payload);
          debouncedFetch();
        },
      },
      {
        event: '*',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`,
        callback: (payload: any) => {
          console.log('Participants changed:', payload);
          debouncedFetch();
        },
      },
      {
        event: '*',
        schema: 'public',
        table: 'users',
        callback: () => {
          debouncedFetch();
        },
      },
    ];

    subscribe(subscriptions);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [roomId, enableRealtime]); // subscribe, unsubscribeを削除

  // Setup polling as backup
  useEffect(() => {
    if (!roomId) return;

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        if (fetchRoomDataRef.current) {
          fetchRoomDataRef.current(false);
        }
      }, pollingInterval);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [roomId, pollingInterval]);

  // Initial fetch
  useEffect(() => {
    if (roomId && fetchRoomDataRef.current) {
      fetchRoomDataRef.current(true);
    }
  }, [roomId]);

  return {
    room,
    participants,
    loading,
    error,
    isHost,
    connectionState,
    fetchRoomData,
    updateRoomStatus,
    deleteRoom,
    setError,
  };
};

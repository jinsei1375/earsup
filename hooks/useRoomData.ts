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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { connectionState, subscribe, unsubscribe } = useRealtimeSubscription({
    channelName: `room-${roomId}`,
    onConnected: () => console.log(`Room realtime connected: ${roomId}`),
    onDisconnected: () => console.log(`Room realtime disconnected: ${roomId}`),
    onError: (error) => console.error('Room realtime error:', error),
  });

  const fetchRoomData = useCallback(async (force = false) => {
    if (!roomId) return;

    const now = Date.now();
    if (!force && (now - lastFetchRef.current) < 1000) {
      return; // Debounce rapid calls
    }
    lastFetchRef.current = now;

    const shouldShowLoading = force && !loading && !room;
    if (shouldShowLoading) setLoading(true);

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
      if (shouldShowLoading) setLoading(false);
    }
  }, [roomId, userId, loading, room]);

  const updateRoomStatus = useCallback(async (status: Room['status']) => {
    if (!roomId) return;
    
    try {
      await SupabaseService.updateRoomStatus(roomId, status);
      setRoom(prev => prev ? { ...prev, status } : null);
    } catch (err: any) {
      setError(err.message || 'ルームステータスの更新中にエラーが発生しました。');
      throw err;
    }
  }, [roomId]);

  const deleteRoom = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await SupabaseService.deleteRoom(roomId);
    } catch (err: any) {
      setError(err.message || 'ルームの削除中にエラーが発生しました。');
      throw err;
    }
  }, [roomId]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!roomId || !enableRealtime) return;

    const subscriptions = [
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
        callback: (payload: any) => {
          console.log('Room changed:', payload);
          fetchRoomData(false);
        },
      },
      {
        event: '*',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`,
        callback: (payload: any) => {
          console.log('Participants changed:', payload);
          fetchRoomData(false);
        },
      },
      {
        event: '*',
        schema: 'public',
        table: 'users',
        callback: () => {
          fetchRoomData(false);
        },
      },
    ];

    subscribe(subscriptions);

    return () => {
      unsubscribe();
    };
  }, [roomId, enableRealtime, subscribe, unsubscribe, fetchRoomData]);

  // Setup polling as backup
  useEffect(() => {
    if (!roomId) return;

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        fetchRoomData(false);
      }, pollingInterval);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [roomId, pollingInterval, fetchRoomData]);

  // Initial fetch
  useEffect(() => {
    if (roomId) {
      fetchRoomData(true);
    }
  }, [roomId, fetchRoomData]);

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
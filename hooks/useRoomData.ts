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
  const [isInitialized, setIsInitialized] = useState(false); // 初期化完了フラグ

  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { connectionState, subscribe, unsubscribe } = useRealtimeSubscription({
    channelName: `room-${roomId}`,
    onConnected: () => {},
    onDisconnected: () => {},
    onError: () => {},
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

        // ルームが削除された場合の処理（ただし初期フェッチ時は除外）
        if (!roomData) {
          // 初期化完了後のみ削除として扱う
          if (isInitialized) {
            setRoom(null);
            setParticipants([]);
            setIsHost(false);
            setError('ルームが削除されました');
          }
          return;
        }

        setRoom(roomData);
        setIsHost(roomData.host_user_id === userId);

        // 初回フェッチ完了時に初期化フラグを設定
        if (force && !isInitialized) {
          setIsInitialized(true);
        }

        // Fetch participants
        const participantsData = await SupabaseService.getParticipantsWithNicknames(
          roomId,
          roomData.host_user_id
        );
        setParticipants(participantsData);
      } catch (err: any) {
        // ルームが見つからない場合は削除されたとみなす（初期化完了後のみ）
        const isRoomNotFoundError =
          err.message?.includes('見つかりません') ||
          err.message?.includes('not found') ||
          err.message?.includes('存在しません') ||
          err.message?.includes('JSON object requested, multiple (or no) rows returned') ||
          err.status === 404;

        if (isInitialized && isRoomNotFoundError) {
          setRoom(null);
          setParticipants([]);
          setIsHost(false);
          setError('ルームが削除されました');
        } else {
          setError(err.message || 'ルーム情報の取得中にエラーが発生しました。');
        }
      } finally {
        if (force) {
          setLoading(false);
        }
      }
    },
    [roomId, userId, isInitialized]
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

  const removeParticipant = useCallback(
    async (participantUserId: string) => {
      if (!roomId) return;

      try {
        await SupabaseService.removeParticipant(roomId, participantUserId);
        // リアルタイム更新で自動的に反映されるが、即座に更新
        await fetchRoomData(false);
      } catch (err: any) {
        setError(err.message || '参加者の削除中にエラーが発生しました。');
        throw err;
      }
    },
    [roomId, fetchRoomData]
  );

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
          // ルームが削除された場合（初期化完了後のみ）
          if (payload.eventType === 'DELETE' && isInitialized) {
            setRoom(null);
            setParticipants([]);
            setIsHost(false);
            setError('ルームが削除されました');
            return;
          }

          debouncedFetch();
        },
      },
      {
        event: '*',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`,
        callback: (payload: any) => {
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
  }, [roomId, enableRealtime, isInitialized]); // subscribe, unsubscribeを削除

  // Setup polling as backup
  useEffect(() => {
    if (!roomId) return;

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        if (fetchRoomDataRef.current) {
          fetchRoomDataRef.current(false);
        }
      }, 2000); // 2秒に短縮
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [roomId]); // pollingIntervalを削除（固定値2秒を使用しているため）

  // Initial fetch
  useEffect(() => {
    if (roomId && fetchRoomDataRef.current) {
      // roomIdが変更された時に初期化フラグをリセット
      setIsInitialized(false);
      fetchRoomDataRef.current(true);
    }
  }, [roomId]);

  return {
    room,
    participants,
    loading,
    error,
    isHost,
    isInitialized,
    connectionState,
    fetchRoomData,
    updateRoomStatus,
    deleteRoom,
    removeParticipant,
    setError,
  };
};

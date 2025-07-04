import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { SupabaseService } from '@/services/supabaseService';
import { useRoomData } from '@/hooks/useRoomData';
import { QuizModeSelector } from '@/components/quiz/QuizModeSelector';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import { RealtimeStatus } from '@/components/common/RealtimeStatus';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { generateRoomCode } from '@/utils/quizUtils';
import type { RoomScreenParams } from '@/types';

export default function RoomScreen() {
  const params = useLocalSearchParams() as RoomScreenParams;
  const { mode, roomId: paramRoomId } = params;
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);

  // Local state for room creation/joining
  const [code, setCode] = useState('');
  const [roomId, setRoomId] = useState<string | null>(paramRoomId || null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState<'first-come' | 'all-at-once'>('all-at-once');

  // Room data management
  const {
    room,
    participants,
    loading: roomLoading,
    error: roomError,
    isHost,
    connectionState,
    fetchRoomData,
    updateRoomStatus,
    deleteRoom,
    setError: setRoomError,
  } = useRoomData({
    roomId,
    userId,
    pollingInterval: 5000,
    enableRealtime: true,
  });

  const isCreateMode = mode === 'create';
  const isJoinMode = mode === 'join';
  const isWaitingMode = roomId !== null;

  // Auto-generate room code for create mode
  useEffect(() => {
    if (isCreateMode) {
      setCode(generateRoomCode());
    }
  }, [isCreateMode]);

  // Handle room status changes for participants
  useEffect(() => {
    if (room?.status === 'ready' && !isHost) {
      console.log('クイズ開始を検知: 参加者画面へ遷移します');
      router.push({
        pathname: '/quiz',
        params: { roomId, role: 'participant' },
      });
    }
  }, [room?.status, isHost, roomId, router]);

  const handleCreateRoom = async () => {
    if (!userId) return;
    setLocalLoading(true);
    setLocalError(null);

    try {
      const roomData = await SupabaseService.createRoom(code, userId, quizMode);
      setRoomId(roomData.id);
    } catch (err: any) {
      setLocalError(err.message || 'ルーム作成中にエラーが発生しました。');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!userId || !code.trim()) return;
    setLocalLoading(true);
    setLocalError(null);

    try {
      // Find room by code
      const roomData = await SupabaseService.findRoomByCode(code);
      if (!roomData) {
        setLocalError('指定された合言葉のルームが見つかりません。');
        return;
      }

      // Add participant
      await SupabaseService.addParticipant(roomData.id, userId);
      setRoomId(roomData.id);
    } catch (err: any) {
      setLocalError(err.message || 'ルーム参加中にエラーが発生しました。');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!room || !isHost) return;

    try {
      setLocalLoading(true);
      await updateRoomStatus('ready');

      // Navigate to quiz screen as host
      router.push({
        pathname: '/quiz',
        params: { roomId, role: 'host' },
      });
    } catch (err: any) {
      setLocalError(err.message || 'クイズ開始中にエラーが発生しました。');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancelRoom = async () => {
    if (!room || !isHost) return;

    try {
      await deleteRoom();
      router.push('/');
    } catch (err: any) {
      setLocalError(err.message || 'ルーム削除中にエラーが発生しました。');
    }
  };

  const loading = localLoading || roomLoading;
  const error = localError || roomError;

  // Waiting screen
  if (isWaitingMode) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-6">ルーム待機中</Text>
        <Text className="text-[32px] font-bold tracking-[4px] my-5">{room?.code || ''}</Text>

        <RealtimeStatus connectionState={connectionState} />

        <ParticipantsList
          participants={participants}
          hostUserId={room?.host_user_id}
          loading={loading}
          onRefresh={() => fetchRoomData(true)}
        />

        {isHost ? (
          <View className="flex-row mt-5">
            <Button title="クイズを開始" onPress={handleStartQuiz} disabled={loading} />
            <View className="w-4" />
            <Button
              title="ルームを中止"
              onPress={handleCancelRoom}
              disabled={loading}
              color="red"
            />
          </View>
        ) : (
          <Text className="mt-5 italic">ホストがクイズを開始するのを待っています...</Text>
        )}

        {loading && <LoadingSpinner />}
        <ErrorMessage message={error} />
      </View>
    );
  }

  // Room creation/joining screen
  return (
    <View className="flex-1 p-6 items-center justify-center">
      <Text className="text-xl font-bold mb-6">
        {isCreateMode ? 'ルームを作成' : 'ルームに参加'}
      </Text>

      {isCreateMode ? (
        <>
          <Text>合言葉</Text>
          <Text className="text-[32px] font-bold tracking-[4px] my-5">{code}</Text>

          <QuizModeSelector selectedMode={quizMode} onModeChange={setQuizMode} disabled={loading} />

          <Button title="ルームを作成" onPress={handleCreateRoom} disabled={loading} />
        </>
      ) : (
        <>
          <Text>合言葉を入力</Text>
          <TextInput
            className="w-full border border-gray-300 p-3 rounded-lg my-4 text-center text-2xl"
            placeholder="例: ABC123"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Button
            title="ルームに参加"
            onPress={handleJoinRoom}
            disabled={!code.trim() || loading}
          />
        </>
      )}

      {loading && <LoadingSpinner />}
      <ErrorMessage message={error} />
    </View>
  );
}

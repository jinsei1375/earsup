import React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { SupabaseService } from '@/services/supabaseService';
import { useRoomData } from '@/hooks/useRoomData';
import { QuizModeSelector } from '@/components/quiz/QuizModeSelector';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { generateRoomCode } from '@/utils/quizUtils';
import { Button } from '@/components/common/Button';
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
  const [quizMode, setQuizMode] = useState<'all-at-once-host' | 'all-at-once-auto'>(
    'all-at-once-host'
  );
  const [allowPartialPoints, setAllowPartialPoints] = useState(true); // デフォルトで惜しい判定を有効

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
    pollingInterval: 2000, // 2秒に短縮
    enableRealtime: true,
  });

  const isCreateMode = mode === 'create';
  const isJoinMode = mode === 'join';
  const isWaitingMode = roomId !== null;

  // プラットフォーム別の通知表示
  const showNotification = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
      // Web用の簡易通知表示（将来的にはtoastライブラリに置き換え可能）
      setLocalError(null); // エラーメッセージをクリア
      setTimeout(() => {
        setLocalError(`✅ ${message}`);
        setTimeout(() => setLocalError(null), 3000); // 3秒後に消去
      }, 100);
    } else {
      Alert.alert(title, message);
    }
  };

  // Auto-generate room code for create mode
  useEffect(() => {
    if (isCreateMode) {
      setCode(generateRoomCode());
    }
  }, [isCreateMode]);

  // Handle room status changes for participants
  useEffect(() => {
    if ((room?.status === 'ready' || room?.status === 'active') && !isHost) {
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
      const roomData = await SupabaseService.createRoom(code, userId, quizMode, allowPartialPoints);
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

    // Check if there are any participants (excluding host for host mode, all participants for auto mode)
    const isAutoMode = room.quiz_mode === 'all-at-once-auto';
    const relevantParticipants = isAutoMode
      ? participants // ホストなしモードでは全参加者
      : participants.filter((p) => p.id !== room.host_user_id); // ホストありモードではホスト以外

    if (relevantParticipants.length === 0) {
      const message = isAutoMode
        ? '参加者が1人以上いないとクイズを開始できません。'
        : '参加者が1人以上いないとクイズを開始できません。';
      setLocalError(message);
      return;
    }

    try {
      setLocalLoading(true);

      // ルームステータスを'ready'に更新（参加者遷移のトリガー）
      await updateRoomStatus('ready');

      // ホストの画面遷移
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

  const handleCancel = () => {
    router.replace('/');
  };

  const loading = localLoading || roomLoading;
  const error = localError || roomError;

  // Waiting screen
  if (isWaitingMode) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-6">ルーム待機中</Text>

        <Text className="mb-2 text-gray-600">合言葉をタップしてコピー</Text>
        <TouchableOpacity
          onPress={async () => {
            try {
              await Clipboard.setStringAsync(room?.code || '');
              showNotification('コピー完了', '合言葉がクリップボードにコピーされました');
            } catch (error) {
              console.error('Copy failed:', error);
              showNotification('エラー', 'コピーに失敗しました');
            }
          }}
          className="p-6 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 my-5 active:bg-blue-100"
          activeOpacity={0.8}
        >
          <Text className="text-[32px] font-bold tracking-[4px] text-blue-700 text-center">
            {room?.code || ''}
          </Text>
          <Text className="text-sm text-blue-600 text-center mt-2">📋 タップしてコピー</Text>
        </TouchableOpacity>

        <ParticipantsList
          participants={participants}
          hostUserId={room?.host_user_id}
          loading={loading}
          onRefresh={() => fetchRoomData(true)}
          quizMode={room?.quiz_mode}
        />

        {isHost ? (
          <View className="mt-5">
            {/* 参加者数チェックとメッセージ */}
            {(() => {
              const isAutoMode = room?.quiz_mode === 'all-at-once-auto';
              const relevantParticipants = isAutoMode
                ? participants // ホストなしモードでは全参加者
                : participants.filter((p) => p.id !== room?.host_user_id); // ホストありモードではホスト以外
              const canStartQuiz = relevantParticipants.length > 0;

              return (
                <>
                  {!canStartQuiz && (
                    <Text className="text-center text-gray-600 mb-3">
                      {isAutoMode ? '参加者が1人以上必要です' : '参加者が1人以上必要です'}
                    </Text>
                  )}

                  <View className="flex-row gap-4">
                    <Button
                      title="クイズを開始"
                      onPress={handleStartQuiz}
                      disabled={loading || !canStartQuiz}
                      variant="primary"
                      size="medium"
                    />
                    <Button
                      title="ルームを中止"
                      onPress={handleCancelRoom}
                      disabled={loading}
                      variant="danger"
                      size="medium"
                    />
                  </View>
                </>
              );
            })()}
          </View>
        ) : (
          <View className="mt-5 items-center">
            <Text className="italic mb-4">ホストがクイズを開始するのを待っています...</Text>
            <LoadingSpinner variant="sound-wave" color="#8B5CF6" size="large" />
          </View>
        )}

        {loading && <LoadingSpinner variant="default" color="#3B82F6" />}
        <ErrorMessage message={error} />

        {/* デバッグ情報 */}
        {process.env.NODE_ENV === 'development' && (
          <View className="mt-4 p-2 bg-gray-100 rounded">
            <Text className="text-xs text-gray-600">
              Debug - Room Status: {room?.status} | Connected:{' '}
              {connectionState.connected ? 'Yes' : 'No'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Room creation/joining screen
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center">
            <Text className="text-xl font-bold mb-6">
              {isCreateMode ? 'ルームを作成' : 'ルームに参加'}
            </Text>

            {isCreateMode ? (
              <>
                <Text className="mb-2">合言葉をタップしてコピー</Text>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await Clipboard.setStringAsync(code);
                      showNotification('コピー完了', '合言葉がクリップボードにコピーされました');
                    } catch (error) {
                      console.error('Copy failed:', error);
                      showNotification('エラー', 'コピーに失敗しました');
                    }
                  }}
                  className="p-6 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 my-5 active:bg-blue-100"
                  activeOpacity={0.8}
                >
                  <Text className="text-[32px] font-bold tracking-[4px] text-blue-700 text-center">
                    {code}
                  </Text>
                  <Text className="text-sm text-blue-600 text-center mt-2">
                    📋 タップしてコピー
                  </Text>
                </TouchableOpacity>

                <QuizModeSelector
                  selectedMode={quizMode}
                  onModeChange={(mode) => {
                    setQuizMode(mode);
                    // ホストなしモードの場合は惜しい判定を自動的に無効にする
                    if (mode === 'all-at-once-auto') {
                      setAllowPartialPoints(false);
                    }
                  }}
                  allowPartialPoints={allowPartialPoints}
                  onPartialPointsChange={setAllowPartialPoints}
                  disabled={loading}
                />

                <Button
                  title="ルームを作成"
                  onPress={handleCreateRoom}
                  disabled={loading}
                  variant="primary"
                  size="large"
                  fullWidth
                  className="mb-3"
                />

                <Button
                  title="中止してトップに戻る"
                  onPress={handleCancel}
                  disabled={loading}
                  variant="danger"
                  size="large"
                  fullWidth
                />
              </>
            ) : (
              <>
                <Text className="mb-4">合言葉を入力</Text>
                <TextInput
                  className="w-full border border-gray-300 p-4 rounded-lg mb-4 text-center text-2xl"
                  placeholder="例: ABC123"
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <Button
                  title="ルームに参加"
                  onPress={handleJoinRoom}
                  disabled={!code.trim() || loading}
                  variant="primary"
                  size="large"
                  fullWidth
                  className="mb-3"
                />

                <Button
                  title="中止してトップに戻る"
                  onPress={handleCancel}
                  disabled={loading}
                  variant="danger"
                  size="large"
                  fullWidth
                />
              </>
            )}

            {loading && <LoadingSpinner variant="default" color="#3B82F6" />}
            <ErrorMessage message={error} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// components/quiz/ParticipantQuizScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity } from 'react-native';
import { RealtimeStatus } from '@/components/common/RealtimeStatus';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { 
  canParticipantAnswer, 
  canParticipantBuzzIn, 
  isQuizActive, 
  isQuizEnded,
  speakText 
} from '@/utils/quizUtils';
import type { Room, RealtimeConnectionState } from '@/types';

interface ParticipantQuizScreenProps {
  room: Room | null;
  questionText: string;
  currentBuzzer: string | null;
  userId: string | null;
  connectionState: RealtimeConnectionState;
  loading: boolean;
  error: string | null;
  isCorrect: boolean | null;
  showResult: boolean;
  onBuzzIn: () => Promise<void>;
  onSubmitAnswer: (answer: string) => Promise<void>;
  onRefreshState: () => void;
}

export const ParticipantQuizScreen: React.FC<ParticipantQuizScreenProps> = ({
  room,
  questionText,
  currentBuzzer,
  userId,
  connectionState,
  loading,
  error,
  isCorrect,
  showResult,
  onBuzzIn,
  onSubmitAnswer,
  onRefreshState,
}) => {
  const [answer, setAnswer] = useState('');

  const quizMode = room?.quiz_mode || 'all-at-once';
  const isFirstComeMode = quizMode === 'first-come';
  const hasQuestion = !!questionText && isQuizActive(room?.status || '');
  const canBuzzIn = canParticipantBuzzIn(quizMode, currentBuzzer);
  const hasBuzzedIn = isFirstComeMode && currentBuzzer === userId;
  const otherHasBuzzed = isFirstComeMode && currentBuzzer && currentBuzzer !== userId;
  const canAnswer = canParticipantAnswer(quizMode, currentBuzzer, userId);

  // Auto-play question for participants
  useEffect(() => {
    if (questionText && hasQuestion) {
      console.log('参加者自動再生を開始します:', questionText);
      speakText(questionText, { rate: 0.9 });
    }
  }, [questionText, hasQuestion]);

  const handleSubmitAnswer = async () => {
    if (answer.trim()) {
      await onSubmitAnswer(answer.trim());
      setAnswer('');
    }
  };

  // Handle quiz ending
  if (isQuizEnded(room?.status || '')) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-green-600 font-bold text-lg mb-3">クイズが終了しました</Text>
        <Text className="mb-3">ホーム画面に移動しています...</Text>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  // Waiting for host to create question
  if (!hasQuestion) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-4">リスニングクイズ</Text>
        <RealtimeStatus connectionState={connectionState} showLastUpdate={false} />
        <Text>ホストが問題を作成中です...</Text>
        <Button
          title="状態を更新"
          onPress={onRefreshState}
        />
      </View>
    );
  }

  // Quiz is active
  return (
    <View className="flex-1 p-6 items-center justify-center">
      <Text className="text-xl font-bold mb-4">リスニングクイズ</Text>
      <RealtimeStatus connectionState={connectionState} showLastUpdate={false} />
      
      <Text className="text-lg font-bold text-green-500 my-4">問題が出題されました!</Text>

      {isFirstComeMode ? (
        // First-come mode
        <>
          {canBuzzIn ? (
            // Can buzz in
            <TouchableOpacity
              onPress={onBuzzIn}
              disabled={loading}
              className="bg-blue-500 p-6 rounded-full my-4"
            >
              <Text className="text-white text-center text-xl font-bold">押す!</Text>
            </TouchableOpacity>
          ) : hasBuzzedIn ? (
            // User has buzzed in
            <>
              <View className="bg-green-100 p-3 rounded-lg mb-4">
                <Text className="text-green-800 text-center">
                  あなたが回答権を獲得しました！
                </Text>
              </View>

              <TextInput
                className="border border-gray-300 p-3 rounded-lg my-4 w-full"
                placeholder="聞こえたフレーズを入力"
                value={answer}
                onChangeText={setAnswer}
                editable={!showResult}
              />

              <Button
                title="解答する"
                onPress={handleSubmitAnswer}
                disabled={!answer.trim() || showResult || loading}
              />
            </>
          ) : (
            // Someone else has buzzed in
            <View className="bg-red-100 p-3 rounded-lg">
              <Text className="text-red-800 text-center">他の参加者が回答中です</Text>
            </View>
          )}
        </>
      ) : !showResult ? (
        // All-at-once mode - hasn't answered yet
        <>
          <TextInput
            className="border border-gray-300 p-3 rounded-lg my-4 w-full"
            placeholder="聞こえたフレーズを入力"
            value={answer}
            onChangeText={setAnswer}
            editable={!showResult}
          />

          <Button
            title="解答する"
            onPress={handleSubmitAnswer}
            disabled={!answer.trim() || showResult || loading}
          />
        </>
      ) : (
        // All-at-once mode - has answered
        <View className="bg-blue-100 p-4 rounded-lg my-4">
          {isCorrect === null ? (
            // Waiting for judgment
            <>
              <Text className="text-center font-bold text-blue-800 mb-1">
                回答を提出しました
              </Text>
              <Text className="text-center text-blue-600">ホストの判定をお待ちください</Text>
            </>
          ) : isCorrect ? (
            // Correct
            <>
              <Text className="text-center font-bold text-green-800 mb-1">正解！</Text>
              <Text className="text-center text-green-600">
                あなたの回答が正解と判定されました
              </Text>
            </>
          ) : (
            // Incorrect
            <>
              <Text className="text-center font-bold text-red-800 mb-1">不正解</Text>
              <Text className="text-center text-red-600">
                あなたの回答が不正解と判定されました
              </Text>
              <Text className="text-center text-black mt-2">正解: {questionText}</Text>
            </>
          )}
        </View>
      )}

      {/* Result display for first-come mode */}
      {showResult && isFirstComeMode && (
        <View className="mt-6 items-center">
          <Text
            className={
              isCorrect
                ? 'text-green-600 font-bold text-lg'
                : 'text-red-600 font-bold text-lg'
            }
          >
            {isCorrect ? '✓ 正解！' : '✗ 不正解'}
          </Text>
          <Text className="mt-2">正解: {questionText}</Text>
        </View>
      )}

      {loading && <LoadingSpinner />}
      <ErrorMessage message={error} />
    </View>
  );
};
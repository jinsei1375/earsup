// components/quiz/ParticipantQuizScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { RealtimeStatus } from '@/components/common/RealtimeStatus';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import {
  canParticipantAnswer,
  canParticipantBuzzIn,
  isQuizActive,
  isQuizEnded,
} from '@/utils/quizUtils';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import type { Room, RealtimeConnectionState, ParticipantWithNickname, Answer } from '@/types';

interface ParticipantQuizScreenProps {
  room: Room | null;
  questionText: string;
  currentBuzzer: string | null;
  userId: string | null;
  participants: ParticipantWithNickname[];
  allRoomAnswers: Answer[]; // Changed to allRoomAnswers for cumulative stats
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
  participants,
  allRoomAnswers,
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
          variant="primary"
          size="small"
          className="mt-4"
        />
      </View>
    );
  }

  // Quiz is active
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="items-center pt-8">
            <Text className="text-xl font-bold mb-4">リスニングクイズ</Text>
            <RealtimeStatus connectionState={connectionState} showLastUpdate={false} />

            {/* 参加者リスト */}
            <ParticipantsList
              participants={participants}
              hostUserId={room?.host_user_id}
              loading={false}
              onRefresh={onRefreshState}
              answers={allRoomAnswers}
            />

            <Text className="text-lg font-bold text-green-500 my-4">問題が出題されました!</Text>

            {isFirstComeMode ? (
              // First-come mode
              <>
                {canBuzzIn ? (
                  // Can buzz in
                  <Button
                    title="押す!"
                    onPress={onBuzzIn}
                    disabled={loading}
                    variant="primary"
                    size="large"
                    fullWidth
                    className="my-4"
                  />
                ) : hasBuzzedIn ? (
                  // User has buzzed in
                  <>
                    <View className="bg-green-100 p-3 rounded-lg mb-4 w-full">
                      <Text className="text-green-800 text-center">
                        あなたが回答権を獲得しました！
                      </Text>
                    </View>

                    <View className="w-full mt-4 mb-6">
                      <TextInput
                        className="border border-gray-300 p-4 rounded-lg my-3 w-full text-lg"
                        placeholder="聞こえたフレーズを入力"
                        value={answer}
                        onChangeText={setAnswer}
                        editable={!showResult}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />

                      <Button
                        title="解答する"
                        onPress={handleSubmitAnswer}
                        disabled={!answer.trim() || showResult || loading}
                        variant="primary"
                        size="large"
                        fullWidth
                      />
                    </View>
                  </>
                ) : (
                  // Someone else has buzzed in
                  <View className="bg-red-100 p-3 rounded-lg w-full">
                    <Text className="text-red-800 text-center">他の参加者が回答中です</Text>
                  </View>
                )}
              </>
            ) : !showResult ? (
              // All-at-once mode - hasn't answered yet
              <View className="w-full mt-4 mb-6">
                <TextInput
                  className="border border-gray-300 p-4 rounded-lg my-3 w-full text-lg"
                  placeholder="聞こえたフレーズを入力"
                  value={answer}
                  onChangeText={setAnswer}
                  editable={!showResult}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />

                <Button
                  title="解答する"
                  onPress={handleSubmitAnswer}
                  disabled={!answer.trim() || showResult || loading}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              </View>
            ) : (
              // All-at-once mode - has answered
              <View className="bg-blue-100 p-4 rounded-lg my-4 w-full">
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
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

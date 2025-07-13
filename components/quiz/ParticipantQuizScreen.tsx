// components/quiz/ParticipantQuizScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
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
import { StampSelector } from '@/components/quiz/StampSelector';
import { AVAILABLE_STAMPS } from '@/components/quiz/StampSelector';
import type {
  Room,
  RealtimeConnectionState,
  ParticipantWithNickname,
  Answer,
  Stamp,
} from '@/types';

interface StampWithPosition {
  type: string;
  x: number;
  y: number;
}

interface ParticipantQuizScreenProps {
  room: Room | null;
  questionText: string;
  currentBuzzer: string | null;
  userId: string | null;
  participants: ParticipantWithNickname[];
  allRoomAnswers: Answer[]; // Changed to allRoomAnswers for cumulative stats
  judgmentTypes?: Record<string, 'correct' | 'partial' | 'incorrect'>; // 判定タイプ
  connectionState: RealtimeConnectionState;
  loading: boolean;
  error: string | null;
  isCorrect: boolean | null;
  showResult: boolean;
  onBuzzIn: () => Promise<void>;
  onSubmitAnswer: (answer: string) => Promise<void>;
  onRefreshState: () => void;
  // Stamp-related props
  // stamps: StampWithPosition[];
  // onSendStamp: (stamp: StampWithPosition) => void;
}

export const ParticipantQuizScreen: React.FC<ParticipantQuizScreenProps> = ({
  room,
  questionText,
  currentBuzzer,
  userId,
  participants,
  allRoomAnswers,
  judgmentTypes = {}, // デフォルトは空のオブジェクト
  connectionState,
  loading,
  error,
  isCorrect,
  showResult,
  onBuzzIn,
  onSubmitAnswer,
  onRefreshState,
  // stamps,
  // onSendStamp,
}) => {
  const [answer, setAnswer] = useState('');
  const [stampModalVisible, setStampModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const quizMode = room?.quiz_mode || 'all-at-once';
  const isFirstComeMode = quizMode === 'first-come';
  const hasQuestion = !!questionText && isQuizActive(room?.status || '');
  const canBuzzIn = canParticipantBuzzIn(quizMode, currentBuzzer);
  const hasBuzzedIn = isFirstComeMode && currentBuzzer === userId;
  const otherHasBuzzed = isFirstComeMode && currentBuzzer && currentBuzzer !== userId;
  const canAnswer = canParticipantAnswer(quizMode, currentBuzzer, userId); // 参加者自身の回答を取得して判定タイプを確認
  const userAnswer = allRoomAnswers.find((answer) => answer.user_id === userId);
  const allowPartialPoints = room?.allow_partial_points || false;
  const userJudgmentResult = userAnswer?.judge_result;

  // 判定結果の確認
  const isAnswerCorrect = userJudgmentResult === 'correct';
  const isPartialAnswer = allowPartialPoints && userJudgmentResult === 'partial';

  const handleSubmitAnswer = async () => {
    if (answer.trim()) {
      await onSubmitAnswer(answer.trim());
      setAnswer('');
    }
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.measureInWindow((x, y, width, height) => {
        const scrollToY = y - 150; // 画面中央より少し上に調整
        scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollToY), animated: true });
      });
    }, 300); // キーボードアニメーション後に実行
  };

  // スタンプを画面上にランダムな位置で表示
  // const renderStamps = () =>
  //   stamps.map((stamp, idx) => {
  //     const emoji = AVAILABLE_STAMPS.find((s) => s.type === stamp.type)?.emoji || '❓';
  //     return (
  //       <View
  //         key={idx}
  //         style={{
  //           position: 'absolute',
  //           left: stamp.x,
  //           top: stamp.y,
  //           zIndex: 100,
  //           pointerEvents: 'none',
  //         }}
  //       >
  //         <Text style={{ fontSize: 36 }}>{emoji}</Text>
  //       </View>
  //     );
  //   });

  // Handle quiz ending
  if (isQuizEnded(room?.status || '')) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-green-600 font-bold text-lg mb-3">クイズが終了しました</Text>
        <Text className="mb-3">ホーム画面に移動しています...</Text>
        <LoadingSpinner size="large" variant="pulse" color="#10B981" />
      </View>
    );
  }

  // Waiting for host to create question
  if (!hasQuestion) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-4">リスニングクイズ</Text>
        <Text className="mb-6">ホストが問題を作成中です...</Text>
        <LoadingSpinner size="large" variant="sound-wave" color="#3B82F6" className="mb-4" />
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-6"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-lg font-bold text-green-500 mb-4 text-center">
          聞こえたフレーズを入力してください
        </Text>

        {/* クイズコンテンツ - 優先表示 */}
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
                className="mb-4"
              />
            ) : hasBuzzedIn ? (
              // User has buzzed in
              <>
                <View className="bg-green-100 p-3 rounded-lg mb-4 w-full">
                  <Text className="text-green-800 text-center">あなたが回答権を獲得しました！</Text>
                </View>

                <View className="w-full mb-4">
                  <TextInput
                    ref={inputRef}
                    className="border border-gray-300 p-4 rounded-lg mb-3 w-full text-lg"
                    placeholder="聞こえたフレーズを入力"
                    value={answer}
                    onChangeText={setAnswer}
                    editable={!showResult}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    onFocus={handleInputFocus}
                    blurOnSubmit={false}
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
              <View className="bg-red-100 p-3 rounded-lg w-full mb-4">
                <Text className="text-red-800 text-center">他の参加者が回答中です</Text>
              </View>
            )}
          </>
        ) : !showResult ? (
          // All-at-once mode - hasn't answered yet
          <View className="w-full mb-4">
            <TextInput
              ref={inputRef}
              className="border border-gray-300 p-4 rounded-lg mb-3 w-full text-lg"
              placeholder="聞こえたフレーズを入力"
              value={answer}
              onChangeText={setAnswer}
              editable={!showResult}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              onFocus={handleInputFocus}
            />

            <Button
              title="回答する"
              onPress={handleSubmitAnswer}
              disabled={!answer.trim() || showResult || loading}
              variant="primary"
              size="large"
              fullWidth
            />
          </View>
        ) : (
          // All-at-once mode - has answered
          <View className="bg-blue-100 p-4 rounded-lg mb-4 w-full">
            {isCorrect === null ? (
              // Waiting for judgment
              <>
                <Text className="text-center font-bold text-blue-800 mb-1">回答を提出しました</Text>
                <Text className="text-center text-blue-600">ホストの判定をお待ちください</Text>
                <LoadingSpinner size="small" variant="dots" className="mt-2" />
              </>
            ) : isAnswerCorrect ? (
              // Correct
              <>
                <Text className="text-center font-bold text-green-500 mb-1">◯正解</Text>
                <Text className="text-center font-bold text-yellow-600 text-lg mb-2">
                  10ポイントGET！
                </Text>

                <Text className="text-center text-blue-600 mt-2">
                  あなたの回答: 「{userAnswer?.answer_text}」
                </Text>
              </>
            ) : isPartialAnswer ? (
              // Partial (惜しい)
              <>
                <Text className="text-center font-bold text-orange-500 mb-1">△惜しい</Text>
                <Text className="text-center font-bold text-yellow-600 text-lg mb-2">
                  5ポイントGET！
                </Text>
                <Text className="text-center text-blue-600 mt-2">
                  あなたの回答: 「{userAnswer?.answer_text}」
                </Text>
                <Text className="text-center text-black mt-2">正解: {questionText}</Text>
              </>
            ) : (
              // Incorrect
              <>
                <Text className="text-center font-bold text-red-500 mb-1">×不正解</Text>
                <Text className="text-center text-blue-600 mt-2">
                  あなたの回答: 「{userAnswer?.answer_text}」
                </Text>
                <Text className="text-center text-black mt-2">正解: {questionText}</Text>
              </>
            )}
          </View>
        )}

        {/* Result display for first-come mode */}
        {showResult && isFirstComeMode && (
          <View className="mb-4 items-center">
            <Text
              className={
                isAnswerCorrect
                  ? 'text-green-600 font-bold text-lg'
                  : isPartialAnswer
                  ? 'text-orange-600 font-bold text-lg'
                  : 'text-red-600 font-bold text-lg'
              }
            >
              {isAnswerCorrect ? '✓ 正解！' : isPartialAnswer ? '△ 惜しい！' : '✗ 不正解'}
            </Text>
            {(isAnswerCorrect || isPartialAnswer) && (
              <Text className="text-yellow-600 font-bold text-lg mt-1">
                {isAnswerCorrect ? '🎉 10ポイントGET！ 🎉' : '✨ 5ポイントGET！ ✨'}
              </Text>
            )}
            {userAnswer && (
              <Text className="text-blue-600 mt-2">あなたの回答: 「{userAnswer.answer_text}」</Text>
            )}
            <Text className="mt-2">正解: {questionText}</Text>
          </View>
        )}

        {/* 参加者リスト - コンパクト表示 */}
        <View className="mt-4">
          <View style={{ maxHeight: 300 }}>
            <ParticipantsList
              participants={participants}
              hostUserId={room?.host_user_id}
              loading={false}
              onRefresh={onRefreshState}
              answers={allRoomAnswers}
              judgmentTypes={judgmentTypes}
            />
          </View>
        </View>

        {loading && <LoadingSpinner variant="dots" color="#6366F1" />}
        <ErrorMessage message={error} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

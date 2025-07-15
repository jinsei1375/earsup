// components/quiz/HostQuizScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AnswersList } from './AnswersList';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { ExitRoomModal } from '@/components/common/ExitRoomModal';
import { getQuizModeDisplayName } from '@/utils/quizUtils';
import { speakText } from '@/utils/quizUtils';
import type { Answer, ParticipantWithNickname } from '@/types';

interface HostQuizScreenProps {
  questionText: string;
  answers: Answer[];
  allRoomAnswers: Answer[]; // 累積スコア用
  participants: ParticipantWithNickname[];
  hostUserId: string; // Added for participant stats
  quizMode: 'all-at-once-host' | 'all-at-once-auto';
  allowPartialPoints?: boolean; // 惜しい判定を許可するか
  judgmentTypes?: Record<string, 'correct' | 'partial' | 'incorrect'>; // 判定タイプ
  loading: boolean;
  error: string | null;
  onJudgeAnswer: (
    answerId: string,
    isCorrect: boolean,
    judgmentType?: 'correct' | 'partial' | 'incorrect'
  ) => Promise<void>;
  onRefreshAnswers: () => void;
  onEndQuiz: () => Promise<void>;
  onNextQuestion: () => Promise<void>;
}

export const HostQuizScreen: React.FC<HostQuizScreenProps> = ({
  questionText,
  answers,
  allRoomAnswers,
  participants,
  hostUserId,
  quizMode,
  allowPartialPoints = false, // デフォルトで無効
  judgmentTypes = {}, // デフォルトは空のオブジェクト
  loading,
  error,
  onJudgeAnswer,
  onRefreshAnswers,
  onEndQuiz,
  onNextQuestion,
}) => {
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const [showSilentModeWarning, setShowSilentModeWarning] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  const handlePlayQuestion = () => {
    if (!questionText) return;
    speakText(questionText, { rate: selectedSpeed });
  };

  const handleEndQuiz = () => {
    setShowExitModal(false);
    onEndQuiz();
  };

  // 全ての参加者の回答が判定されているかチェック
  const allAnswersJudged = (() => {
    // 参加者がいない場合は判定完了とみなさない
    if (participants.length === 0) {
      return false;
    }

    // 回答がない場合も判定完了とみなさない
    if (answers.length === 0) {
      return false;
    }

    // ホストありモードの場合：ホスト以外の参加者のみチェック
    if (quizMode === 'all-at-once-host') {
      const nonHostParticipants = participants.filter((p) => p.id !== hostUserId);

      // 非ホスト参加者がいない場合は判定完了とみなさない
      if (nonHostParticipants.length === 0) {
        return false;
      }

      // 非ホスト参加者の回答を取得
      const nonHostAnswers = answers.filter((answer) =>
        nonHostParticipants.some((p) => p.id === answer.user_id)
      );

      // 全ての非ホスト参加者が回答し、かつ全て判定済み
      const hasAllAnswers = nonHostAnswers.length === nonHostParticipants.length;
      const allJudged = nonHostAnswers.every((answer) => answer.judged === true);

      return hasAllAnswers && allJudged;
    }

    // ホストなしモードの場合：全参加者（ホスト含む）をチェック
    const allParticipantAnswers = answers.filter((answer) =>
      participants.some((p) => p.id === answer.user_id)
    );

    // 全ての参加者が回答し、かつ全て判定済み
    const hasAllAnswers = allParticipantAnswers.length === participants.length;
    const allJudged = allParticipantAnswers.every((answer) => answer.judged === true);

    return hasAllAnswers && allJudged;
  })();

  return (
    <ScrollView className="flex-1 p-6 pb-10" showsVerticalScrollIndicator={false}>
      {/* Quiz mode display */}
      <View className="flex-row items-center justify-center mb-4">
        <Text className="text-sm bg-blue-100 px-3 py-1 rounded-full">
          {getQuizModeDisplayName(quizMode)}
        </Text>
      </View>
      {/* Silent mode warning */}
      {showSilentModeWarning && (
        <View className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg w-full">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-yellow-800 text-sm font-bold mb-1">⚠️ 音声に関する注意</Text>
              <Text className="text-yellow-700 text-xs">
                音声が聞こえない場合は、デバイスのマナーモード（消音モード）を解除してください。
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowSilentModeWarning(false)}
              className="ml-2 p-2 rounded-lg border-2 border-transparent active:bg-yellow-200 items-center justify-center"
            >
              <Text className="text-yellow-600 text-lg font-bold">×</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* メイン操作エリア - 優先表示 */}
      <Text className="text-lg mb-4 text-center font-semibold">{questionText}</Text>

      {/* Speed selection */}
      <Text className="text-sm text-gray-600 mb-2">音声再生速度:</Text>
      <View className="flex-row flex-wrap justify-center mb-4">
        {[
          { speed: 0.75, label: '0.75x' },
          { speed: 0.9, label: '0.9x' },
          { speed: 1.0, label: '1.0x' },
          { speed: 1.1, label: '1.1x' },
          { speed: 1.25, label: '1.25x' },
        ].map(({ speed, label }) => (
          <TouchableOpacity
            key={speed}
            onPress={() => setSelectedSpeed(speed)}
            className={`px-4 py-3 m-1 rounded-lg border-2 items-center justify-center min-w-[60px] ${
              selectedSpeed === speed
                ? 'bg-blue-500 border-blue-500 active:bg-blue-600'
                : 'bg-transparent border-gray-300 active:bg-gray-50'
            }`}
          >
            <Text
              className={`text-center font-bold ${
                selectedSpeed === speed ? 'text-white' : 'text-gray-700'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Play button */}
      <Button
        title={`音声を再生する (${selectedSpeed}x)`}
        onPress={handlePlayQuestion}
        disabled={!questionText}
        variant="primary"
        size="large"
        fullWidth
        className="mb-4"
      />

      {/* Answers list */}
      <AnswersList
        answers={answers}
        isHost={true}
        isAllAtOnceMode={true}
        allowPartialPoints={allowPartialPoints}
        judgmentTypes={judgmentTypes}
        loading={loading}
        onJudgeAnswer={onJudgeAnswer}
        onRefresh={onRefreshAnswers}
      />

      <View className="h-[30px]" />

      {/* 次の問題へボタン（全ての回答が判定されている場合のみ表示） */}
      {allAnswersJudged && (
        <View className="mb-4">
          <Text className="text-center text-green-600 text-sm mb-2">
            ✅ 全ての参加者の判定が完了しました
          </Text>
          <Button
            title="次の問題へ"
            onPress={onNextQuestion}
            variant="primary"
            fullWidth
            disabled={loading}
          />
        </View>
      )}

      <Button
        title="クイズを終了する"
        onPress={() => setShowExitModal(true)}
        variant="danger"
        fullWidth
        disabled={loading}
        className="mb-4"
      />

      {/* 参加者リスト - コンパクト表示 */}
      <View className="my-4">
        <View style={{ maxHeight: 300 }}>
          <ParticipantsList
            participants={participants}
            hostUserId={hostUserId}
            loading={false}
            onRefresh={() => {}} // No refresh needed in host view
            answers={allRoomAnswers}
            judgmentTypes={judgmentTypes}
          />
        </View>
      </View>

      {loading && <LoadingSpinner variant="default" color="#3B82F6" />}
      <ErrorMessage message={error} />

      {/* クイズ終了確認モーダル */}
      <ExitRoomModal
        isVisible={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirmExit={handleEndQuiz}
        isHost={true}
      />
    </ScrollView>
  );
};

// components/quiz/HostQuizScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AnswersList } from './AnswersList';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { VoiceSettings } from '@/components/common/VoiceSettings';
import { ExitRoomModal } from '@/components/common/ExitRoomModal';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';
import { getQuizModeDisplayName, extractTrailingPunctuation } from '@/utils/quizUtils';
import { audioService } from '@/services/audioService';
import { useToast } from '@/contexts/ToastContext';
import type { Answer, ParticipantWithNickname, VoiceSettings as VoiceSettingsType } from '@/types';

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
  const { showError } = useToast();
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsType>({
    gender: 'male',
    speed: 1.0,
  });
  const [showSilentModeWarning, setShowSilentModeWarning] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  // 問題文から抽出した句読点
  const trailingPunctuation = extractTrailingPunctuation(questionText);

  // 現在の問題IDを推定（最新の回答から取得）
  const currentQuestionId = answers.length > 0 ? answers[0].question_id : null;

  // 現在の問題の回答をフィルタリング
  const currentQuestionAnswers = currentQuestionId
    ? answers.filter((answer) => answer.question_id === currentQuestionId)
    : [];

  const handlePlayQuestion = async () => {
    if (!questionText) return;

    try {
      await audioService.playText(questionText, voiceSettings);
    } catch (error) {
      console.error('音声再生エラー:', error);
      showError('エラー', '音声の再生に失敗しました。');
    }
  };

  const handleEndQuiz = () => {
    setShowExitModal(false);
    onEndQuiz();
  };

  // 全ての参加者の回答が判定されているかチェック (参加者画面と同じロジック)
  const allAnswersJudged = (() => {
    // 参加者がいない場合は判定完了とみなさない
    if (participants.length === 0) {
      return false;
    }

    // 回答がない場合も判定完了とみなさない
    if (currentQuestionAnswers.length === 0) {
      return false;
    }

    // ホストありモードの場合：ホスト以外の参加者のみチェック
    const relevantAnswers =
      quizMode === 'all-at-once-host'
        ? currentQuestionAnswers.filter((answer) => answer.user_id !== hostUserId)
        : currentQuestionAnswers;

    const participantsToJudge =
      quizMode === 'all-at-once-host'
        ? participants.filter((p) => p.id !== hostUserId)
        : participants;

    const judgedCount = relevantAnswers.filter((answer) => answer.judge_result !== null).length;
    const submittedCount = relevantAnswers.length;
    const totalToJudge = participantsToJudge.length;

    return submittedCount >= totalToJudge && judgedCount >= totalToJudge && totalToJudge > 0;
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
              <View className="flex-row items-center mb-1">
                <FeatureIcon name="warning" size={16} color={APP_COLORS.warning} />
                <Text className="text-yellow-800 text-sm font-bold ml-1">音声に関する注意</Text>
              </View>
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

      {/* Voice settings */}
      <VoiceSettings voiceSettings={voiceSettings} onSettingsChange={setVoiceSettings} />

      {/* Play button */}
      <Button
        title={`音声を再生する (${voiceSettings.speed}x)`}
        onPress={handlePlayQuestion}
        disabled={!questionText}
        variant="primary"
        size="large"
        fullWidth
        className="my-4"
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
            currentUserId={hostUserId} // ホストが現在のユーザー
            loading={false}
            onRefresh={() => {}} // No refresh needed in host view
            answers={allRoomAnswers}
            judgmentTypes={judgmentTypes}
            quizMode={quizMode}
            currentQuestionAnswers={currentQuestionAnswers}
            showCurrentAnswers={allAnswersJudged} // 全員の判定が完了した場合のみ表示
            trailingPunctuation={trailingPunctuation}
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

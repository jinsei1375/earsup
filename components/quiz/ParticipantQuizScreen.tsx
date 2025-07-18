// components/quiz/ParticipantQuizScreen.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { canParticipantAnswer, isQuizActive, isQuizEnded, speakText } from '@/utils/quizUtils';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import type { Room, RealtimeConnectionState, ParticipantWithNickname, Answer } from '@/types';

interface ParticipantQuizScreenProps {
  room: Room | null;
  questionText: string;
  userId: string | null;
  participants: ParticipantWithNickname[];
  allRoomAnswers: Answer[]; // Changed to allRoomAnswers for cumulative stats
  judgmentTypes?: Record<string, 'correct' | 'partial' | 'incorrect'>; // 判定タイプ
  connectionState: RealtimeConnectionState;
  loading: boolean;
  error: string | null;
  isCorrect: boolean | null;
  showResult: boolean;
  onSubmitAnswer: (answer: string) => Promise<void>;
  onRefreshState: () => void;
  onNextQuestion?: () => Promise<void>; // ホストなしモード用の次の問題へボタン
}

export const ParticipantQuizScreen: React.FC<ParticipantQuizScreenProps> = ({
  room,
  questionText,
  userId,
  participants,
  allRoomAnswers,
  judgmentTypes = {}, // デフォルトは空のオブジェクト
  connectionState,
  loading,
  error,
  isCorrect,
  showResult,
  onSubmitAnswer,
  onRefreshState,
  onNextQuestion,
}) => {
  const [answer, setAnswer] = useState('');
  const [playCount, setPlayCount] = useState(0); // 音声再生回数
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const quizMode = room?.quiz_mode || 'all-at-once-host';
  const isAutoMode = quizMode === 'all-at-once-auto';
  const maxPlayCount = isAutoMode ? 3 : Infinity; // ホストなしモードは3回まで
  const hasQuestion = !!questionText && isQuizActive(room?.status || '');
  const canAnswer = canParticipantAnswer(quizMode, null, userId);

  // 現在のルームの回答をフィルタリング
  const roomAnswers = allRoomAnswers.filter((answer) => answer.room_id === room?.id);

  // 現在の問題IDを取得
  const currentQuestionId = useMemo(() => {
    if (roomAnswers.length === 0) {
      return null;
    }

    // 最新の問題IDを取得（回答の作成日時順）
    const sortedAnswers = [...roomAnswers].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sortedAnswers[0]?.question_id || null;
  }, [roomAnswers, questionText]);

  // デバッグ用の一意問題数計算
  const uniqueQuestionIds = [...new Set(roomAnswers.map((answer) => answer.question_id))];

  // 現在の問題に対するユーザーの回答のみを取得
  const userAnswer =
    currentQuestionId && showResult
      ? roomAnswers.find(
          (answer) => answer.user_id === userId && answer.question_id === currentQuestionId
        )
      : undefined;
  const allowPartialPoints = room?.allow_partial_points || false;
  const userJudgmentResult = userAnswer?.judge_result;

  // 判定結果の確認
  const isAnswerCorrect = userJudgmentResult === 'correct';
  const isPartialAnswer = allowPartialPoints && userJudgmentResult === 'partial';

  // Check if all answers are judged (for room creator's next question button in host-less mode)
  const isRoomCreator = room?.host_user_id === userId;
  const isHostlessMode = room?.quiz_mode === 'all-at-once-auto';

  // 結果表示の準備が完了しているかチェック
  // ルーム作成者の場合も、判定結果が存在するまで待機表示
  const isResultDataReady = showResult && userAnswer?.answer_text && userJudgmentResult !== null;

  // In host-less mode, consider all participants except host for judgment tracking
  const participantsToJudge = isHostlessMode
    ? participants.filter((p) => p.id !== room?.host_user_id)
    : participants;

  const totalParticipantsToJudge = participantsToJudge.length;

  // 現在の問題に対する回答のみをフィルタリング
  const currentQuestionAnswers = currentQuestionId
    ? roomAnswers.filter((answer) => answer.question_id === currentQuestionId)
    : [];

  // ホストなしモードでは非ホスト参加者の回答のみカウント
  const relevantAnswers = isHostlessMode
    ? currentQuestionAnswers.filter((answer) => answer.user_id !== room?.host_user_id)
    : currentQuestionAnswers;

  const judgedCount = relevantAnswers.filter((answer) => answer.judge_result !== null).length;

  // 全ての非ホスト参加者が回答を提出し、かつ全て判定済みかチェック
  const allAnswersSubmitted = relevantAnswers.length >= totalParticipantsToJudge;
  const allAnswersJudged =
    currentQuestionId && // 現在の問題が存在する
    allAnswersSubmitted &&
    judgedCount >= totalParticipantsToJudge &&
    totalParticipantsToJudge > 0;

  // 問題が変わったときに音声再生回数と入力をリセット
  useEffect(() => {
    setPlayCount(0);
    setAnswer('');
    // 新しい問題になったら、前の結果表示状態もクリア
    // これはquiz.tsxで管理されているが、念のためローカルでもクリア
  }, [questionText, currentQuestionId]);

  // 現在の問題に対してのみ判定状態をチェック
  const isCurrentQuestionFullyJudged = useMemo(() => {
    if (!currentQuestionId || !showResult) {
      return false;
    }

    // 現在の問題に対する回答のみを対象とする
    const currentQuestionRelevantAnswers = isHostlessMode
      ? currentQuestionAnswers.filter((answer) => answer.user_id !== room?.host_user_id)
      : currentQuestionAnswers;

    const currentJudgedCount = currentQuestionRelevantAnswers.filter(
      (answer) => answer.judge_result !== null
    ).length;
    const currentSubmittedCount = currentQuestionRelevantAnswers.length;

    return (
      currentSubmittedCount >= totalParticipantsToJudge &&
      currentJudgedCount >= totalParticipantsToJudge &&
      totalParticipantsToJudge > 0
    );
  }, [
    currentQuestionId,
    currentQuestionAnswers,
    totalParticipantsToJudge,
    showResult,
    isHostlessMode,
    room?.host_user_id,
  ]);

  const handleSubmitAnswer = async () => {
    if (answer.trim()) {
      await onSubmitAnswer(answer.trim());
      setAnswer('');
    }
  };

  const handlePlayAudio = () => {
    if (!questionText || playCount >= maxPlayCount) return;
    speakText(questionText, { rate: 1.0 });
    setPlayCount((prev) => prev + 1);
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.measureInWindow((x, y, width, height) => {
        const scrollToY = y - 150; // 画面中央より少し上に調整
        scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollToY), animated: true });
      });
    }, 300); // キーボードアニメーション後に実行
  };

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

        {/* 音声再生ボタン - ホストなしモードのみ */}
        {isAutoMode && (
          <View className="mb-4">
            <Button
              title={`音声を再生する (${playCount}/${maxPlayCount})`}
              onPress={handlePlayAudio}
              disabled={!questionText || playCount >= maxPlayCount || showResult}
              variant={playCount >= maxPlayCount ? 'secondary' : 'primary'}
              size="large"
              fullWidth
            />
            {playCount >= maxPlayCount && (
              <Text className="text-center text-red-600 text-sm mt-2">
                再生回数の上限に達しました
              </Text>
            )}
          </View>
        )}

        {/* クイズコンテンツ */}
        {!showResult ? (
          // All-at-once mode - hasn't answered yet
          <View className="w-full mb-4">
            <TextInput
              ref={inputRef}
              className="border border-gray-300 p-4 rounded-lg mb-3 w-full text-xl"
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
            {!isResultDataReady ? (
              // Waiting for judgment or complete result data
              <>
                <Text className="text-center font-bold text-blue-800 mb-1">回答を提出しました</Text>
                <Text className="text-center text-blue-600">
                  {isRoomCreator
                    ? '結果を準備中...'
                    : isCorrect === null
                    ? 'ホストの判定をお待ちください'
                    : '結果を準備中...'}
                </Text>
                <LoadingSpinner size="small" variant="dots" className="mt-2" />
              </>
            ) : isAnswerCorrect ? (
              // Correct
              <>
                <Text className="text-center font-bold text-green-500 text-lg mb-1">◯正解</Text>
                <Text className="text-center font-bold text-yellow-600 text-lg mb-2">
                  10ポイントGET！
                </Text>

                <Text className="text-center text-blue-600 mt-2">
                  あなたの回答: 「{userAnswer?.answer_text || '取得中...'}」
                </Text>
              </>
            ) : isPartialAnswer ? (
              // Partial (惜しい)
              <>
                <Text className="text-center font-bold text-orange-500 text-lg mb-1">△惜しい</Text>
                <Text className="text-center font-bold text-yellow-600 text-lg mb-2">
                  5ポイントGET！
                </Text>
                <Text className="text-center text-blue-600 mt-2">
                  あなたの回答: 「{userAnswer?.answer_text || '取得中...'}」
                </Text>
                <Text className="text-center text-black mt-2">正解: {questionText}</Text>
              </>
            ) : (
              // Incorrect
              <>
                <Text className="text-center font-bold text-red-500 text-lg mb-1">×不正解</Text>
                <Text className="text-center text-blue-600 mt-2">
                  あなたの回答: 「{userAnswer?.answer_text || '取得中...'}」
                </Text>
                <Text className="text-center text-black mt-2">正解: {questionText}</Text>
              </>
            )}
          </View>
        )}

        {/* ホストなしモード: ルーム作成者用の次の問題ボタン */}
        {isHostlessMode &&
          isRoomCreator &&
          isCurrentQuestionFullyJudged &&
          onNextQuestion &&
          currentQuestionId && (
            <View className="mt-4 mb-4">
              <Button
                title="次の問題へ"
                onPress={onNextQuestion}
                variant="primary"
                size="large"
                fullWidth
              />
              {/* デバッグ情報を表示（開発時のみ） */}
              {__DEV__ && (
                <View className="mt-2">
                  <Text className="text-xs text-gray-500 text-center">
                    問題ID: {currentQuestionId?.slice(-8)} | 参加者: {totalParticipantsToJudge} |
                    回答: {relevantAnswers.length} | 判定済: {judgedCount}
                  </Text>
                  <Text className="text-xs text-gray-400 text-center">
                    全回答数: {roomAnswers.length} | 一意問題数: {uniqueQuestionIds.length}
                  </Text>
                  <Text className="text-xs text-gray-400 text-center">
                    問題文: {questionText.slice(0, 20)}...
                  </Text>
                </View>
              )}
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

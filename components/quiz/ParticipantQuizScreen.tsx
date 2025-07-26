// components/quiz/ParticipantQuizScreen.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { SampleSentenceService } from '@/services/sampleSentenceService';
import type {
  Room,
  RealtimeConnectionState,
  ParticipantWithNickname,
  Answer,
  Question,
} from '@/types';
import { ExitRoomModal } from '../common/ExitRoomModal';

interface ParticipantQuizScreenProps {
  room: Room | null;
  currentQuestion: Question | null; // Add current question for authoritative question ID
  questionText: string;
  userId: string | null;
  participants: ParticipantWithNickname[];
  answers: Answer[]; // Current question's answers (including unjudged)
  allRoomAnswers: Answer[]; // All room answers (judged only, for cumulative stats)
  judgmentTypes?: Record<string, 'correct' | 'partial' | 'incorrect'>; // 判定タイプ
  connectionState: RealtimeConnectionState;
  loading: boolean;
  error: string | null;
  isCorrect: boolean | null;
  showResult: boolean;
  onSubmitAnswer: (answer: string) => Promise<void>;
  onRefreshState: () => void;
  onNextQuestion?: () => Promise<void>; // ホストなしモード用の次の問題へボタン
  onEndQuiz: () => Promise<void>;
}

export const ParticipantQuizScreen: React.FC<ParticipantQuizScreenProps> = ({
  room,
  currentQuestion,
  questionText,
  userId,
  participants,
  answers,
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
  onEndQuiz,
}) => {
  const [answer, setAnswer] = useState('');
  const [playCount, setPlayCount] = useState(0); // 音声再生回数
  const [showExitModal, setShowExitModal] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null); // 日本語訳
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const quizMode = room?.quiz_mode || 'all-at-once-host';
  const isAutoMode = quizMode === 'all-at-once-auto';
  const maxPlayCount = isAutoMode ? 3 : Infinity; // ホストなしモードは3回まで
  const hasQuestion = !!questionText && isQuizActive(room?.status || '');
  const canAnswer = canParticipantAnswer(quizMode, null, userId);

  // 問題文の末尾から句読点を抽出する関数
  const extractTrailingPunctuation = (text: string): string => {
    if (!text) return '';
    const match = text.match(/[.!?]+$/);
    return match ? match[0] : '';
  };

  // 問題文から抽出した句読点
  const trailingPunctuation = extractTrailingPunctuation(questionText);

  // 現在の問題IDを取得 - authoritativeなcurrentQuestion.idを使用
  const currentQuestionId = currentQuestion?.id || null;

  // デバッグ用の一意問題数計算
  const uniqueQuestionIds = [...new Set(allRoomAnswers.map((answer) => answer.question_id))];

  // 現在の問題に対するユーザーの回答を取得 (unjudgedも含む)
  // 追加の安全チェック: showResultがtrueでも、実際に現在の問題の回答データがある場合のみ表示
  const userAnswer =
    currentQuestionId && showResult
      ? answers.find(
          (answer) => answer.user_id === userId && answer.question_id === currentQuestionId
        )
      : undefined;

  // 結果表示の安全性チェック: userAnswerが存在し、かつ現在の問題のものである場合のみ
  const isValidResultDisplay =
    showResult && userAnswer && userAnswer.question_id === currentQuestionId;
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
  // 追加の安全チェック: 有効な結果表示状態でのみデータ準備完了とする
  const isResultDataReady =
    isValidResultDisplay &&
    userAnswer?.answer_text &&
    userJudgmentResult !== null &&
    userJudgmentResult !== undefined;

  // In host-less mode, consider all participants except host for judgment tracking
  const participantsToJudge = isHostlessMode
    ? participants.filter((p) => p.id !== room?.host_user_id)
    : participants;

  const totalParticipantsToJudge = participantsToJudge.length;

  // 現在の問題に対する回答のみをフィルタリング (including unjudged)
  const currentQuestionAnswers = currentQuestionId
    ? answers.filter((answer) => answer.question_id === currentQuestionId)
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

  // Translation fetching function
  const fetchTranslation = useCallback(async (sampleSentenceId: string) => {
    try {
      const sampleSentence = await SampleSentenceService.getSentenceById(sampleSentenceId);
      if (sampleSentence && sampleSentence.translation) {
        setTranslation(sampleSentence.translation);
        return sampleSentence.translation;
      }
    } catch (error) {
      console.error('Translation fetch error:', error);
    }
    return null;
  }, []);

  // 問題が変わったときに音声再生回数と入力をリセット、翻訳も取得
  useEffect(() => {
    setPlayCount(0);
    setAnswer('');
    setTranslation(null); // 翻訳もリセット

    // ホストなしモードで、かつサンプル文のIDがある場合は翻訳を取得
    if (isAutoMode && currentQuestion?.sample_sentence_id) {
      fetchTranslation(currentQuestion.sample_sentence_id);
    }
  }, [currentQuestionId, isAutoMode, currentQuestion?.sample_sentence_id, fetchTranslation]);

  // Component to display translation with fallback loading
  const TranslationDisplay = ({ className }: { className?: string }) => {
    const [localTranslation, setLocalTranslation] = useState<string | null>(translation);

    useEffect(() => {
      setLocalTranslation(translation);
    }, [translation]);

    useEffect(() => {
      if (isAutoMode && currentQuestion?.sample_sentence_id && !localTranslation) {
        fetchTranslation(currentQuestion.sample_sentence_id).then((result: string | null) => {
          if (result) {
            setLocalTranslation(result);
          }
        });
      }
    }, [isAutoMode, currentQuestion?.sample_sentence_id, localTranslation]);

    if (!isAutoMode) return null;
    
    if (localTranslation) {
      return (
        <Text className={className || "text-center text-gray-600 mt-2 italic"}>
          日本語: {localTranslation}
        </Text>
      );
    }
    
    if (currentQuestion?.sample_sentence_id) {
      return (
        <Text className={className || "text-center text-gray-600 mt-2 italic"}>
          日本語: 翻訳を取得中...
        </Text>
      );
    }
    
    return null;
  };

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

  const handleEndQuiz = () => {
    setShowExitModal(false);
    onEndQuiz();
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
            {/* ホストなしモードでは句読点を表示 */}
            {isAutoMode && (
              <View className="flex-row items-center justify-center mb-2">
                <Text className="text-gray-600 text-sm">
                  句読点（. ! ?）は自動で判定されるため入力不要です
                </Text>
              </View>
            )}

            <View className="flex-row items-center">
              <TextInput
                ref={inputRef}
                className="border border-gray-300 p-4 rounded-lg w-full text-xl flex-1"
                placeholder="聞こえたフレーズを入力"
                value={answer}
                onChangeText={setAnswer}
                editable={!showResult}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                onFocus={handleInputFocus}
              />
              {/* ホストなしモードでは句読点を表示 */}
              {isAutoMode && trailingPunctuation && (
                <View className="ml-2 flex-row">
                  <Text className="text-gray-800 text-xl">{trailingPunctuation}</Text>
                </View>
              )}
            </View>

            <Button
              title="回答する"
              onPress={handleSubmitAnswer}
              disabled={!answer.trim() || showResult || loading}
              variant="primary"
              size="large"
              fullWidth
              className="mt-4"
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
                  {isAutoMode && isRoomCreator
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
                  あなたの回答: 「{userAnswer?.answer_text || '取得中...'}」{trailingPunctuation}
                </Text>
                <TranslationDisplay />
              </>
            ) : isPartialAnswer ? (
              // Partial (惜しい)
              <>
                <Text className="text-center font-bold text-orange-500 text-lg mb-1">△惜しい</Text>
                <Text className="text-center font-bold text-yellow-600 text-lg mb-2">
                  5ポイントGET！
                </Text>
                <Text className="text-center text-blue-600 mt-2">
                  あなたの回答: 「{userAnswer?.answer_text || '取得中...'}」{trailingPunctuation}
                </Text>
                <Text className="text-center text-black mt-2">正解: {questionText}</Text>
                <TranslationDisplay />
              </>
            ) : (
              // Incorrect
              <>
                <Text className="text-center font-bold text-red-500 text-lg mb-1">×不正解</Text>
                <Text className="text-center text-blue-600 mt-2">
                  あなたの回答: 「{userAnswer?.answer_text || '取得中...'}」{trailingPunctuation}
                </Text>
                <Text className="text-center text-black mt-2">正解: {questionText}</Text>
                <TranslationDisplay />
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
              <Button
                title="クイズを終了する"
                onPress={() => setShowExitModal(true)}
                variant="danger"
                fullWidth
                disabled={loading}
                className="mt-4"
              />
            </View>
          )}

        {/* 参加者リスト - コンパクト表示 */}
        <View className="mt-4">
          <View style={{ maxHeight: 300 }}>
            <ParticipantsList
              participants={participants}
              hostUserId={room?.host_user_id}
              currentUserId={userId}
              loading={false}
              onRefresh={onRefreshState}
              answers={allRoomAnswers}
              judgmentTypes={judgmentTypes}
              quizMode={quizMode} // ホストなしモードのためのクイズモード
              currentQuestionAnswers={currentQuestionAnswers} // 現在の問題の回答
              showCurrentAnswers={isCurrentQuestionFullyJudged} // 全員が回答・判定済みの場合のみ表示
              trailingPunctuation={trailingPunctuation} // 句読点を渡す
            />
          </View>
        </View>

        {loading && <LoadingSpinner variant="dots" color="#6366F1" />}
        <ErrorMessage message={error} />
        {/* クイズ終了確認モーダル */}
        <ExitRoomModal
          isVisible={showExitModal}
          onClose={() => setShowExitModal(false)}
          onConfirmExit={handleEndQuiz}
          isHost={true}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

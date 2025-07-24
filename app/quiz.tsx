// app/quiz.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuizData } from '@/hooks/useQuizData';
import { useUserStore } from '@/stores/userStore';
import { SampleSentenceService } from '@/services/sampleSentenceService';
import { QuestionCreator } from '@/components/quiz/QuestionCreator';
import { HostQuizScreen } from '@/components/quiz/HostQuizScreen';
import { ParticipantQuizScreen } from '@/components/quiz/ParticipantQuizScreen';
import { QuizResultScreen } from '@/components/quiz/QuizResultScreen';
import { ExitRoomModal } from '@/components/common/ExitRoomModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import type { QuizScreenParams } from '@/types';

const fallbackQuestions = [
  'Hello, how are you today?',
  'What time is it now?',
  'Where are you from?',
  'Nice to meet you.',
  'Have a nice day!',
  'Good morning!',
  'See you later.',
  'Thank you very much.',
];

export default function QuizScreen() {
  const params = useLocalSearchParams() as QuizScreenParams;
  const { roomId, role } = params;
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);
  const { setSettingsConfig } = useHeaderSettings();

  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // 判定タイプを管理するローカルstate
  const [judgmentTypes, setJudgmentTypes] = useState<
    Record<string, 'correct' | 'partial' | 'incorrect'>
  >({});

  // 現在の問題IDを追跡するための状態
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

  // 使用済み問題IDを追跡するための状態（auto mode用）
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());

  const isHost = role === 'host';

  // サンプル文からランダムに未使用の問題を選択する関数
  const getRandomSampleSentence = async (): Promise<{ text: string; sampleSentenceId: string } | null> => {
    try {
      const allSentences = await SampleSentenceService.getAllSentences();
      if (!allSentences || allSentences.length === 0) {
        console.warn('No sample sentences available');
        return null;
      }

      // 未使用の文章を絞り込み
      const unusedSentences = allSentences.filter((sentence) => !usedQuestionIds.has(sentence.id));

      // すべて使用済みの場合は使用履歴をリセット
      if (unusedSentences.length === 0) {
        console.log('All sample sentences used, resetting usage history');
        setUsedQuestionIds(new Set());
        const fallbackSentence = allSentences[Math.floor(Math.random() * allSentences.length)];
        return { text: fallbackSentence.text, sampleSentenceId: fallbackSentence.id };
      }

      // ランダムに選択
      const randomSentence = unusedSentences[Math.floor(Math.random() * unusedSentences.length)];

      // 使用済みIDに追加
      setUsedQuestionIds((prev) => new Set(prev).add(randomSentence.id));

      return { text: randomSentence.text, sampleSentenceId: randomSentence.id };
    } catch (error) {
      console.error('Failed to get random sample sentence:', error);
      return null;
    }
  };

  const {
    room,
    currentQuestion,
    answers,
    allRoomAnswers,
    participants,
    loading,
    error,
    connectionState,
    fetchQuizData,
    fetchAnswers,
    createQuestion,
    submitAnswer,
    judgeAnswer,
    endQuiz,
    nextQuestion,
    removeParticipant,
    setError,
  } = useQuizData({
    roomId,
    userId,
    isHost,
    pollingInterval: 3000,
    enableRealtime: true,
  });

  // Handle room status changes
  useEffect(() => {
    if (room?.status === 'ended') {
      console.log('Quiz ended, showing result screen');
      // Reset local state
      setShowResult(false);
      setIsCorrect(null);

      // Show result screen instead of navigating immediately
      setShowQuizResult(true);
    }
  }, [room?.status]);

  // ヘッダーの設定ボタンを制御
  useEffect(() => {
    setSettingsConfig({
      showSettings: true,
      onSettingsPress: () => setIsExitModalVisible(true),
    });

    // クリーンアップ時に設定をリセット
    return () => {
      setSettingsConfig({});
    };
  }, [setSettingsConfig]);

  // 問題IDの変更を追跡し、即座に状態をリセット
  useEffect(() => {
    const newQuestionId = currentQuestion?.id || null;
    if (newQuestionId !== currentQuestionId) {
      // 問題が変わったら即座に結果表示状態をリセット
      setShowResult(false);
      setIsCorrect(null);
      setCurrentQuestionId(newQuestionId);
    }
  }, [currentQuestion?.id, currentQuestionId]);

  // 問題が変わった瞬間に即座に状態をリセットするための追加チェック
  // useEffectよりも早く実行されるため、レンダリング時の古い状態表示を防ぐ
  const actualCurrentQuestionId = currentQuestion?.id || null;
  const shouldResetState = actualCurrentQuestionId !== currentQuestionId;
  const safeShowResult = shouldResetState ? false : showResult;
  const safeIsCorrect = shouldResetState ? null : isCorrect;

  // Reset participant result state when room status changes
  useEffect(() => {
    const isAutoMode = room?.quiz_mode === 'all-at-once-auto';

    // ルーム状態が待機中や準備中の場合は結果をリセット
    if (!currentQuestion || room?.status === 'waiting' || room?.status === 'ready') {
      setShowResult(false);
      setIsCorrect(null);
    }
  }, [currentQuestion, room?.status]);

  // Monitor answer judgment for participants (runs after state reset)
  useEffect(() => {
    // 現在の問題IDが設定されており、かつ同期が取れている場合のみ実行
    if (userId && currentQuestion?.id && currentQuestion.id === currentQuestionId) {
      const isAutoMode = room?.quiz_mode === 'all-at-once-auto';

      // 参加者または ホストなしモードのホストの回答判定を監視
      if (!isHost || (isHost && isAutoMode)) {
        // 既に結果を表示中の場合は重複チェックを避ける
        if (!safeShowResult) {
          // 現在の問題に対する回答のみを厳密にフィルタリング
          const myAnswer = answers.find(
            (a) =>
              a.user_id === userId &&
              a.question_id === currentQuestion.id &&
              a.question_id === currentQuestionId // 追加の同期チェック
          );
          if (myAnswer?.judged && myAnswer.judge_result) {
            // judge_resultに基づいて判定結果を設定
            setIsCorrect(myAnswer.judge_result === 'correct');
            setShowResult(true);
          }
        }
      }
    }
  }, [
    answers,
    isHost,
    userId,
    currentQuestion?.id,
    currentQuestionId,
    room?.quiz_mode,
    safeShowResult,
  ]);

  // allRoomAnswersからjudgmentTypesを更新
  useEffect(() => {
    const newJudgmentTypes: Record<string, 'correct' | 'partial' | 'incorrect'> = {};
    allRoomAnswers.forEach((answer) => {
      if (answer.judge_result) {
        newJudgmentTypes[answer.id] = answer.judge_result;
      }
    });
    setJudgmentTypes(newJudgmentTypes);
  }, [allRoomAnswers]);

  // ホストなしモードで自動的に問題を作成
  useEffect(() => {
    const isAutoMode = room?.quiz_mode === 'all-at-once-auto';
    if (
      isHost &&
      isAutoMode &&
      (room?.status === 'ready' || room?.status === 'waiting') &&
      !currentQuestion
    ) {
      // サンプル問題を自動作成
      const createAutoQuestion = async () => {
        const randomQuestionData = await getRandomSampleSentence();
        if (randomQuestionData) {
          await new Promise((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(resolve);
            });
          });
          await handleCreateQuestion(randomQuestionData.text, randomQuestionData.sampleSentenceId);
        } else {
          const fallbackQuestion =
            fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];

          await new Promise((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(resolve);
            });
          });
          await handleCreateQuestion(fallbackQuestion);
        }
      };

      createAutoQuestion();
    }
  }, [room?.status, room?.quiz_mode, currentQuestion, isHost]);

  const handleCreateQuestion = async (text: string, sampleSentenceId?: string) => {
    try {
      await createQuestion(text, sampleSentenceId);
    } catch (err) {
      console.error('Question creation failed:', err);
    }
  };

  const handleSubmitAnswer = async (answerText: string) => {
    try {
      const isAutoMode = room?.quiz_mode === 'all-at-once-auto';
      const autoJudge = isAutoMode; // ホストなしモードは自動判定

      // 回答提出前に結果状態をリセット（新しい質問の場合）
      setShowResult(false);
      setIsCorrect(null);

      const answerData = await submitAnswer(answerText, false, autoJudge);

      // 回答提出後は「準備中」状態を表示
      setShowResult(true);

      if (autoJudge && answerData) {
        // ホストなしモードでは submitAnswer の判定結果を使用
        const correct = answerData.judge_result === 'correct';
        console.log('Auto judgment result:', correct, answerData.judge_result);
        setIsCorrect(correct);
      } else {
        setIsCorrect(null); // Wait for host judgment
      }
    } catch (err) {
      console.error('Answer submission failed:', err);
    }
  };

  const handleJudgeAnswer = async (
    answerId: string,
    correct: boolean,
    judgmentType?: 'correct' | 'partial' | 'incorrect'
  ) => {
    try {
      // correctとjudgmentTypeからjudgmentResultを決定
      const judgmentResult: 'correct' | 'partial' | 'incorrect' =
        judgmentType || (correct ? 'correct' : 'incorrect');

      // 判定タイプをローカルで保存
      setJudgmentTypes((prev) => ({ ...prev, [answerId]: judgmentResult }));

      await judgeAnswer(answerId, judgmentResult);
    } catch (err) {
      console.error('Answer judgment failed:', err);
    }
  };

  const handleEndQuiz = async () => {
    try {
      await endQuiz();
      // 結果画面を表示するために自動遷移を削除
      // room.status が 'ended' になることで結果画面が表示される
    } catch (err) {
      console.error('End quiz failed:', err);
      // エラー時のみ自動遷移
      setTimeout(() => router.replace('/'), 1000);
    }
  };

  const handleExitRoom = async () => {
    try {
      if (!userId) return;

      // データベースから参加者を削除し、必要に応じてルームを終了
      await removeParticipant(userId);

      // ホーム画面に戻る - 遅延を追加してクリーンアップを確実に
      setTimeout(() => {
        router.replace('/');
      }, 100);
    } catch (err: any) {
      console.error('Exit room failed:', err);
      // エラーが発生してもホーム画面に戻る
      setTimeout(() => {
        router.replace('/');
      }, 100);
    }
  };

  const handleRefreshState = () => {
    fetchQuizData(true);
    setShowResult(false);
    setIsCorrect(null);
  };

  const handleNextQuestion = async () => {
    try {
      const isAutoMode = room?.quiz_mode === 'all-at-once-auto';

      if (isAutoMode) {
        // ホストなしモードでは、まず状態をリセット
        setShowResult(false);
        setIsCorrect(null);
        setCurrentQuestionId(null); // 問題IDもリセット

        // 次の問題を自動作成して即座に出題
        await nextQuestion();

        // サンプル問題を自動作成
        const randomQuestionData = await getRandomSampleSentence();
        if (randomQuestionData) {
          await new Promise((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(resolve);
            });
          });

          try {
            await handleCreateQuestion(randomQuestionData.text, randomQuestionData.sampleSentenceId);
          } catch (err) {
            console.error('Auto question creation failed:', err);
          }
        } else {
          // フォールバック: デフォルトの質問
          const fallbackQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
          
          await new Promise((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(resolve);
            });
          });

          try {
            await handleCreateQuestion(fallbackQuestion);
          } catch (err) {
            console.error('Auto question creation failed:', err);
          }
        }
      } else {
        // ホストありモードでは従来通り
        await nextQuestion();
      }
    } catch (err) {
      console.error('Next question failed:', err);
    }
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  // Show quiz result screen when quiz is ended
  if (showQuizResult) {
    return (
      <View className="flex-1 bg-white">
        <QuizResultScreen
          participants={participants}
          allRoomAnswers={allRoomAnswers}
          hostUserId={room?.host_user_id}
          isHost={isHost}
          loading={loading}
          onGoHome={handleGoHome}
          judgmentTypes={judgmentTypes}
        />

        <ExitRoomModal
          isVisible={isExitModalVisible}
          onClose={() => setIsExitModalVisible(false)}
          onConfirmExit={handleExitRoom}
          isHost={isHost}
        />
      </View>
    );
  }

  // Host screens
  if (isHost) {
    const isAutoMode = room?.quiz_mode === 'all-at-once-auto';

    // ホストなしモードの場合は、ホストも参加者として扱う
    if (isAutoMode && currentQuestion) {
      return (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <ParticipantQuizScreen
              room={room}
              currentQuestion={currentQuestion}
              questionText={currentQuestion?.text || ''}
              userId={userId}
              participants={participants}
              answers={answers}
              allRoomAnswers={allRoomAnswers}
              judgmentTypes={judgmentTypes}
              connectionState={connectionState}
              loading={loading}
              error={error}
              isCorrect={safeIsCorrect}
              showResult={safeShowResult}
              onSubmitAnswer={handleSubmitAnswer}
              onRefreshState={handleRefreshState}
              onNextQuestion={handleNextQuestion}
              onEndQuiz={handleEndQuiz}
            />
          </ScrollView>

          <ExitRoomModal
            isVisible={isExitModalVisible}
            onClose={() => setIsExitModalVisible(false)}
            onConfirmExit={handleExitRoom}
            isHost={isHost}
          />
        </>
      );
    }

    // Question creation screen
    if (!currentQuestion || room?.status === 'ready' || room?.status === 'waiting') {
      // ホストなしモードの場合は問題作成画面を表示せず、ローディング画面を表示
      if (isAutoMode) {
        return (
          <>
            <View className="flex-1 p-6 items-center justify-center">
              <Text className="text-xl font-bold mb-4">リスニングクイズ</Text>
              <Text className="text-base text-gray-600 text-center mb-4">
                次の問題を準備中です...
              </Text>
              <LoadingSpinner variant="sound-wave" color="#8B5CF6" size="large" className="mb-4" />

              {loading && <LoadingSpinner variant="default" color="#3B82F6" />}
              <ErrorMessage message={error} />
            </View>

            <ExitRoomModal
              isVisible={isExitModalVisible}
              onClose={() => setIsExitModalVisible(false)}
              onConfirmExit={handleExitRoom}
              isHost={isHost}
            />
          </>
        );
      }

      // ホストありモードの場合は従来の問題作成画面
      return (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <QuestionCreator
              onCreateQuestion={handleCreateQuestion}
              loading={loading}
              error={error}
            />
          </ScrollView>

          <ExitRoomModal
            isVisible={isExitModalVisible}
            onClose={() => setIsExitModalVisible(false)}
            onConfirmExit={handleExitRoom}
            isHost={isHost}
          />
        </>
      );
    }

    // Host quiz management screen
    return (
      <>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <HostQuizScreen
            questionText={currentQuestion.text}
            answers={answers}
            allRoomAnswers={allRoomAnswers}
            participants={participants}
            hostUserId={room?.host_user_id || ''}
            quizMode={room?.quiz_mode || 'all-at-once-host'}
            allowPartialPoints={room?.allow_partial_points || false}
            judgmentTypes={judgmentTypes}
            loading={loading}
            error={error}
            onJudgeAnswer={handleJudgeAnswer}
            onRefreshAnswers={() => fetchAnswers(true)}
            onEndQuiz={handleEndQuiz}
            onNextQuestion={handleNextQuestion}
          />
        </ScrollView>

        <ExitRoomModal
          isVisible={isExitModalVisible}
          onClose={() => setIsExitModalVisible(false)}
          onConfirmExit={handleExitRoom}
          isHost={isHost}
        />
      </>
    );
  }

  // Participant screen
  if (!isHost) {
    // Show waiting screen when no question or room is waiting/ready
    if (!currentQuestion || room?.status === 'waiting' || room?.status === 'ready') {
      return (
        <>
          <View className="flex-1 p-6 items-center justify-center">
            <Text className="text-xl font-bold mb-4">待機中</Text>
            <Text className="text-base text-gray-600 text-center mb-4">
              ホストが問題を準備中です。しばらくお待ちください。
            </Text>
            <LoadingSpinner variant="sound-wave" color="#8B5CF6" size="large" className="mb-4" />

            {loading && <LoadingSpinner variant="default" color="#3B82F6" />}
            <ErrorMessage message={error} />

            <ExitRoomModal
              isVisible={isExitModalVisible}
              onClose={() => setIsExitModalVisible(false)}
              onConfirmExit={handleExitRoom}
              isHost={isHost}
            />
          </View>
        </>
      );
    }

    // Show quiz screen when there's an active question
    return (
      <>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <ParticipantQuizScreen
            room={room}
            currentQuestion={currentQuestion}
            questionText={currentQuestion?.text || ''}
            userId={userId}
            participants={participants}
            answers={answers}
            allRoomAnswers={allRoomAnswers}
            judgmentTypes={judgmentTypes}
            connectionState={connectionState}
            loading={loading}
            error={error}
            isCorrect={safeIsCorrect}
            showResult={safeShowResult}
            onSubmitAnswer={handleSubmitAnswer}
            onRefreshState={handleRefreshState}
            onNextQuestion={handleNextQuestion}
            onEndQuiz={handleEndQuiz}
          />
        </ScrollView>

        <ExitRoomModal
          isVisible={isExitModalVisible}
          onClose={() => setIsExitModalVisible(false)}
          onConfirmExit={handleExitRoom}
          isHost={isHost}
        />
      </>
    );
  }
}

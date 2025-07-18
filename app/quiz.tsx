// app/quiz.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { useQuizData } from '@/hooks/useQuizData';
import { QuestionCreator } from '@/components/quiz/QuestionCreator';
import { HostQuizScreen } from '@/components/quiz/HostQuizScreen';
import { ParticipantQuizScreen } from '@/components/quiz/ParticipantQuizScreen';
import { QuizResultScreen } from '@/components/quiz/QuizResultScreen';
import { ExitRoomModal } from '@/components/common/ExitRoomModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { validateAnswer } from '@/utils/quizUtils';
import type { QuizScreenParams } from '@/types';

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

  const isHost = role === 'host';

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

  // Monitor answer judgment for participants
  useEffect(() => {
    if (userId && currentQuestion?.id) {
      const isAutoMode = room?.quiz_mode === 'all-at-once-auto';

      // 参加者または ホストなしモードのホストの回答判定を監視
      if (!isHost || (isHost && isAutoMode)) {
        const myAnswer = answers.find((a) => a.user_id === userId);
        if (myAnswer?.judged && myAnswer.judge_result) {
          // judge_resultに基づいて判定結果を設定
          setIsCorrect(myAnswer.judge_result === 'correct');
          setShowResult(true);
        }
      }
    }
  }, [answers, isHost, userId, currentQuestion?.id, room?.quiz_mode]);

  // 問題IDの変更を追跡
  useEffect(() => {
    const newQuestionId = currentQuestion?.id || null;
    if (newQuestionId !== currentQuestionId) {
      setCurrentQuestionId(newQuestionId);
    }
  }, [currentQuestion?.id, currentQuestionId]);

  // Reset participant result state when question changes or room goes to waiting
  useEffect(() => {
    const isAutoMode = room?.quiz_mode === 'all-at-once-auto';

    // 参加者の状態リセット
    if (!isHost) {
      if (!currentQuestion || room?.status === 'waiting' || room?.status === 'ready') {
        setShowResult(false);
        setIsCorrect(null);
      }

      // ホストなしモードでは問題が変わった時もリセット
      if (isAutoMode && currentQuestion) {
        // 問題IDが変わった場合のみリセット
        if (currentQuestion.id !== currentQuestionId) {
          setShowResult(false);
          setIsCorrect(null);
        }
      }
    }

    // ホストなしモードの場合、ホストも参加者として扱うので状態をリセット
    if (isHost && isAutoMode) {
      if (!currentQuestion || room?.status === 'waiting' || room?.status === 'ready') {
        setShowResult(false);
        setIsCorrect(null);
      }

      // 問題IDが変わった時のみリセット（同じ問題IDの場合はリセットしない）
      if (currentQuestion && currentQuestion.id !== currentQuestionId) {
        setShowResult(false);
        setIsCorrect(null);
      }
    }
  }, [isHost, currentQuestion?.id, currentQuestionId, room?.status, room?.quiz_mode]);

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
      const sampleQuestions = [
        'Hello, how are you today?',
        'What time is it now?',
        'Where are you from?',
        'Nice to meet you.',
        'Have a nice day!',
        'Good morning!',
        'See you later.',
        'Thank you very much.',
        'You are welcome.',
        'How old are you?',
      ];
      const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];

      // 少し遅延を入れて状態が安定してから問題を作成
      const timer = setTimeout(() => {
        handleCreateQuestion(randomQuestion);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [room?.status, room?.quiz_mode, currentQuestion, isHost]);

  const handleCreateQuestion = async (text: string) => {
    try {
      await createQuestion(text);
    } catch (err) {
      console.error('Question creation failed:', err);
    }
  };

  const handleSubmitAnswer = async (answerText: string) => {
    try {
      const isAutoMode = room?.quiz_mode === 'all-at-once-auto';
      const autoJudge = isAutoMode; // ホストなしモードは自動判定

      const answerData = await submitAnswer(answerText, false, autoJudge);

      setShowResult(true);

      if (autoJudge && currentQuestion) {
        // ホストなしモードでは自動判定
        const correct = validateAnswer(answerText, currentQuestion.text);
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

        // 次の問題を自動作成して即座に出題
        await nextQuestion();

        // サンプル問題を自動作成
        const sampleQuestions = [
          'Hello, how are you today?',
          'What time is it now?',
          'Where are you from?',
          'Nice to meet you.',
          'Have a nice day!',
          'Good morning!',
          'See you later.',
          'Thank you very much.',
          'You are welcome.',
          'How old are you?',
        ];
        const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];

        // 少し遅延を入れて確実に状態をリセットしてから新しい問題を作成
        setTimeout(async () => {
          try {
            await handleCreateQuestion(randomQuestion);
          } catch (err) {
            console.error('Auto question creation failed:', err);
          }
        }, 100);
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
              questionText={currentQuestion?.text || ''}
              userId={userId}
              participants={participants}
              allRoomAnswers={allRoomAnswers}
              judgmentTypes={judgmentTypes}
              connectionState={connectionState}
              loading={loading}
              error={error}
              isCorrect={isCorrect}
              showResult={showResult}
              onSubmitAnswer={handleSubmitAnswer}
              onRefreshState={handleRefreshState}
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
            questionText={currentQuestion?.text || ''}
            userId={userId}
            participants={participants}
            allRoomAnswers={allRoomAnswers}
            judgmentTypes={judgmentTypes}
            connectionState={connectionState}
            loading={loading}
            error={error}
            isCorrect={isCorrect}
            showResult={showResult}
            onSubmitAnswer={handleSubmitAnswer}
            onRefreshState={handleRefreshState}
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
}

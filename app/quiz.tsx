// app/quiz.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { useQuizData } from '@/hooks/useQuizData';
import { QuestionCreator } from '@/components/quiz/QuestionCreator';
import { HostQuizScreen } from '@/components/quiz/HostQuizScreen';
import { ParticipantQuizScreen } from '@/components/quiz/ParticipantQuizScreen';
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

  const isHost = role === 'host';

  const {
    room,
    currentQuestion,
    answers,
    allRoomAnswers,
    currentBuzzer,
    participants,
    stamps,
    loading,
    error,
    connectionState,
    fetchQuizData,
    fetchAnswers,
    createQuestion,
    submitAnswer,
    judgeAnswer,
    buzzIn,
    resetBuzz,
    sendStamp,
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
      console.log('Quiz ended, navigating to home');
      // Reset local state
      setShowResult(false);
      setIsCorrect(null);

      // Navigate home
      setTimeout(() => {
        router.replace('/');
      }, 1000);
    }
  }, [room?.status, router]);

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
    if (!isHost && userId && currentQuestion?.id) {
      const myAnswer = answers.find((a) => a.user_id === userId);
      if (myAnswer?.judged) {
        setIsCorrect(myAnswer.is_correct);
        setShowResult(true);
      }
    }
  }, [answers, isHost, userId, currentQuestion?.id]);

  // Reset participant result state when question changes or room goes to waiting
  useEffect(() => {
    if (!isHost && (!currentQuestion || room?.status === 'waiting' || room?.status === 'ready')) {
      setShowResult(false);
      setIsCorrect(null);
    }
  }, [isHost, currentQuestion, room?.status]);

  const handleCreateQuestion = async (text: string) => {
    try {
      await createQuestion(text);
    } catch (err) {
      console.error('Question creation failed:', err);
    }
  };

  const handleSubmitAnswer = async (answerText: string) => {
    try {
      const isFirstComeMode = room?.quiz_mode === 'first-come';
      const autoJudge = isFirstComeMode;

      const answerData = await submitAnswer(answerText, isFirstComeMode, autoJudge);

      setShowResult(true);

      if (autoJudge && currentQuestion) {
        const correct = validateAnswer(answerText, currentQuestion.text);
        setIsCorrect(correct);
      } else {
        setIsCorrect(null); // Wait for host judgment
      }
    } catch (err) {
      console.error('Answer submission failed:', err);
    }
  };

  const handleJudgeAnswer = async (answerId: string, correct: boolean) => {
    try {
      await judgeAnswer(answerId, correct);
    } catch (err) {
      console.error('Answer judgment failed:', err);
    }
  };

  const handleBuzzIn = async () => {
    try {
      await buzzIn();
    } catch (err) {
      console.error('Buzz in failed:', err);
    }
  };

  const handleSendStamp = async (stampType: string) => {
    try {
      await sendStamp(stampType);
    } catch (err) {
      console.error('Send stamp failed:', err);
    }
  };

  const handleResetBuzz = async () => {
    try {
      await resetBuzz();
    } catch (err) {
      console.error('Buzz reset failed:', err);
    }
  };

  const handleEndQuiz = async () => {
    try {
      await endQuiz();

      // Navigate after successful end
      setTimeout(() => {
        router.replace('/');
      }, 800);
    } catch (err) {
      console.error('End quiz failed:', err);
      // Navigate anyway on error
      setTimeout(() => router.replace('/'), 1000);
    }
  };

  const handleExitRoom = async () => {
    try {
      if (!userId) return;

      // データベースから参加者を削除し、必要に応じてルームを終了
      await removeParticipant(userId);

      // ホーム画面に戻る
      router.replace('/');
    } catch (err: any) {
      console.error('Exit room failed:', err);
      // エラーが発生してもホーム画面に戻る
      router.replace('/');
    }
  };

  const handleRefreshState = () => {
    fetchQuizData(true);
    setShowResult(false);
    setIsCorrect(null);
  };

  const handleNextQuestion = async () => {
    try {
      await nextQuestion();
    } catch (err) {
      console.error('Next question failed:', err);
    }
  };

  // Host screens
  if (isHost) {
    // Question creation screen
    if (!currentQuestion || room?.status === 'ready' || room?.status === 'waiting') {
      return (
        <SafeAreaView className="flex-1 bg-white">
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
        </SafeAreaView>
      );
    }

    // Host quiz management screen
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <HostQuizScreen
            questionText={currentQuestion.text}
            answers={answers}
            allRoomAnswers={allRoomAnswers}
            currentBuzzer={currentBuzzer}
            participants={participants}
            hostUserId={room?.host_user_id || ''}
            isFirstComeMode={room?.quiz_mode === 'first-come'}
            loading={loading}
            error={error}
            onJudgeAnswer={handleJudgeAnswer}
            onResetBuzz={handleResetBuzz}
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
      </SafeAreaView>
    );
  }

  // Participant screen
  if (!isHost) {
    // Show waiting screen when no question or room is waiting/ready
    if (!currentQuestion || room?.status === 'waiting' || room?.status === 'ready') {
      return (
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 p-6 items-center justify-center">
            <Text className="text-xl font-bold mb-4">待機中</Text>
            <Text className="text-base text-gray-600 text-center mb-4">
              ホストが問題を準備中です。しばらくお待ちください。
            </Text>
            <LoadingSpinner variant="pulse" color="#8B5CF6" size="large" className="mb-4" />

            {loading && <LoadingSpinner />}
            <ErrorMessage message={error} />

            <ExitRoomModal
              isVisible={isExitModalVisible}
              onClose={() => setIsExitModalVisible(false)}
              onConfirmExit={handleExitRoom}
              isHost={isHost}
            />
          </View>
        </SafeAreaView>
      );
    }

    // Show quiz screen when there's an active question
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <ParticipantQuizScreen
            room={room}
            questionText={currentQuestion?.text || ''}
            currentBuzzer={currentBuzzer}
            userId={userId}
            participants={participants}
            allRoomAnswers={allRoomAnswers}
            connectionState={connectionState}
            loading={loading}
            error={error}
            isCorrect={isCorrect}
            showResult={showResult}
            onBuzzIn={handleBuzzIn}
            onSubmitAnswer={handleSubmitAnswer}
            onRefreshState={handleRefreshState}
            // stamps={stamps}
            // onSendStamp={handleSendStamp}
          />
        </ScrollView>

        <ExitRoomModal
          isVisible={isExitModalVisible}
          onClose={() => setIsExitModalVisible(false)}
          onConfirmExit={handleExitRoom}
          isHost={isHost}
        />
      </SafeAreaView>
    );
  }
}

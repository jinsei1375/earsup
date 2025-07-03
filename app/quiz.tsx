// app/quiz.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { useQuizData } from '@/hooks/useQuizData';
import { QuestionCreator } from '@/components/quiz/QuestionCreator';
import { HostQuizScreen } from '@/components/quiz/HostQuizScreen';
import { ParticipantQuizScreen } from '@/components/quiz/ParticipantQuizScreen';
import { validateAnswer } from '@/utils/quizUtils';
import type { QuizScreenParams } from '@/types';

export default function QuizScreen() {
  const params = useLocalSearchParams<QuizScreenParams>();
  const { roomId, role } = params;
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);

  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const isHost = role === 'host';

  const {
    room,
    currentQuestion,
    answers,
    currentBuzzer,
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
    endQuiz,
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

  const handleRefreshState = () => {
    fetchQuizData(true);
    setShowResult(false);
    setIsCorrect(null);
  };

  // Get participants for buzz-in display
  const participants = room ? [
    { id: room.host_user_id, nickname: 'Host' }, // Simplified for now
  ] : [];

  // Host screens
  if (isHost) {
    // Question creation screen
    if (!currentQuestion || room?.status === 'ready') {
      return (
        <QuestionCreator
          onCreateQuestion={handleCreateQuestion}
          loading={loading}
          error={error}
        />
      );
    }

    // Host quiz management screen
    return (
      <HostQuizScreen
        questionText={currentQuestion.text}
        answers={answers}
        currentBuzzer={currentBuzzer}
        participants={participants}
        isFirstComeMode={room?.quiz_mode === 'first-come'}
        loading={loading}
        error={error}
        onJudgeAnswer={handleJudgeAnswer}
        onResetBuzz={handleResetBuzz}
        onRefreshAnswers={() => fetchAnswers(true)}
        onEndQuiz={handleEndQuiz}
      />
    );
  }

  // Participant screen
  return (
    <ParticipantQuizScreen
      room={room}
      questionText={currentQuestion?.text || ''}
      currentBuzzer={currentBuzzer}
      userId={userId}
      connectionState={connectionState}
      loading={loading}
      error={error}
      isCorrect={isCorrect}
      showResult={showResult}
      onBuzzIn={handleBuzzIn}
      onSubmitAnswer={handleSubmitAnswer}
      onRefreshState={handleRefreshState}
    />
  );
}

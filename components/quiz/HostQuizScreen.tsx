// components/quiz/HostQuizScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { AnswersList } from './AnswersList';
import { BuzzInSection } from './BuzzInSection';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { getQuizModeDisplayName } from '@/utils/quizUtils';
import { speakText } from '@/utils/quizUtils';
import type { Answer, ParticipantWithNickname } from '@/types';

interface HostQuizScreenProps {
  questionText: string;
  answers: Answer[];
  currentBuzzer: string | null;
  participants: ParticipantWithNickname[];
  isFirstComeMode: boolean;
  loading: boolean;
  error: string | null;
  onJudgeAnswer: (answerId: string, isCorrect: boolean) => Promise<void>;
  onResetBuzz: () => Promise<void>;
  onRefreshAnswers: () => void;
  onEndQuiz: () => Promise<void>;
}

export const HostQuizScreen: React.FC<HostQuizScreenProps> = ({
  questionText,
  answers,
  currentBuzzer,
  participants,
  isFirstComeMode,
  loading,
  error,
  onJudgeAnswer,
  onResetBuzz,
  onRefreshAnswers,
  onEndQuiz,
}) => {
  const [playCount, setPlayCount] = useState(0);

  const handlePlayQuestion = () => {
    if (playCount >= 3 || !questionText) return;

    speakText(questionText, { rate: 1.0 });
    setPlayCount((c) => c + 1);
  };

  return (
    <View className="flex-1 p-6 items-center justify-center">
      <Text className="text-xl font-bold mb-4">出題中</Text>

      {/* Quiz mode display */}
      <View className="flex-row items-center mb-4">
        <Text className="text-sm bg-blue-100 px-3 py-1 rounded-full">
          {getQuizModeDisplayName(isFirstComeMode ? 'first-come' : 'all-at-once')}
        </Text>
      </View>

      <Text className="text-lg my-4 text-center">{questionText}</Text>
      <Button
        title={`音声を再生する (${3 - playCount}回残り)`}
        onPress={handlePlayQuestion}
        disabled={playCount >= 3 || !questionText}
      />

      {/* Buzz-in management for first-come mode */}
      {isFirstComeMode && (
        <BuzzInSection
          currentBuzzer={currentBuzzer}
          participants={participants}
          isHost={true}
          loading={loading}
          onResetBuzz={onResetBuzz}
        />
      )}

      {/* Answers list */}
      <AnswersList
        answers={answers}
        isHost={true}
        isAllAtOnceMode={!isFirstComeMode}
        loading={loading}
        onJudgeAnswer={onJudgeAnswer}
        onRefresh={onRefreshAnswers}
      />

      <View className="h-[30px]" />
      <Button title="クイズを終了する" onPress={onEndQuiz} color="red" />
      {loading && <LoadingSpinner />}
      <ErrorMessage message={error} />
    </View>
  );
};
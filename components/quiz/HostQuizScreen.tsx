// components/quiz/HostQuizScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, TouchableOpacity } from 'react-native';
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
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);

  const handlePlayQuestion = () => {
    if (!questionText) return;
    speakText(questionText, { rate: selectedSpeed });
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

      {/* Speed selection */}
      <Text className="text-sm text-gray-600 mb-2">音声再生速度:</Text>
      <View className="flex-row flex-wrap justify-center mb-4">
        {[
          { speed: 0.5, label: '0.5x' },
          { speed: 0.75, label: '0.75x' },
          { speed: 0.9, label: '0.9x' },
          { speed: 1.0, label: '1.0x' },
          { speed: 1.25, label: '1.25x' },
          { speed: 1.5, label: '1.5x' },
        ].map(({ speed, label }) => (
          <TouchableOpacity
            key={speed}
            onPress={() => setSelectedSpeed(speed)}
            className={`px-3 py-2 m-1 rounded-lg border ${
              selectedSpeed === speed ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
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

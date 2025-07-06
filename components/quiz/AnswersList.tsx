// components/quiz/AnswersList.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { Answer } from '@/types';
import { truncateId } from '@/utils/quizUtils';
import { Button } from '@/components/common/Button';

interface AnswersListProps {
  answers: Answer[];
  isHost: boolean;
  isAllAtOnceMode: boolean;
  loading: boolean;
  onJudgeAnswer: (answerId: string, isCorrect: boolean) => void;
  onRefresh: () => void;
}

export const AnswersList: React.FC<AnswersListProps> = ({
  answers,
  isHost,
  isAllAtOnceMode,
  loading,
  onJudgeAnswer,
  onRefresh,
}) => {
  return (
    <View className="w-full my-4 max-h-[400px]">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-base font-bold">回答一覧 ({answers.length}件)</Text>
        <Button title="更新" onPress={onRefresh} variant="ghost" size="small" />
      </View>

      {answers.length === 0 ? (
        <View className="bg-gray-100 p-4 rounded-lg items-center">
          <Text className="italic text-gray-600 text-center">まだ回答がありません</Text>
          <Text className="text-xs text-gray-500 mt-1">
            最終更新: {new Date().toLocaleTimeString()}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="w-full"
          style={{ maxHeight: 350 }}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {answers.map((answer) => (
            <View
              key={answer.id}
              className={`p-3 rounded-lg mb-2 border ${
                answer.judged
                  ? answer.is_correct
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <View className="flex-row justify-between">
                <Text className="font-bold">{answer.nickname || '不明なユーザー'}</Text>
                <Text className="text-xs text-gray-500">ID: {truncateId(answer.id, 6)}</Text>
              </View>

              <Text className="my-1">「{answer.answer_text}」</Text>

              {isHost && isAllAtOnceMode && !answer.judged ? (
                // Host can judge answers in all-at-once mode
                <View className="flex-row justify-end mt-2 gap-2">
                  <Button
                    title="正解"
                    onPress={() => onJudgeAnswer(answer.id, true)}
                    disabled={loading}
                    variant="primary"
                    size="small"
                  />
                  <Button
                    title="不正解"
                    onPress={() => onJudgeAnswer(answer.id, false)}
                    disabled={loading}
                    variant="danger"
                    size="small"
                  />
                </View>
              ) : (
                // Show judgment result
                <Text
                  className={
                    answer.is_correct
                      ? 'text-green-500 font-bold'
                      : answer.is_correct === false
                      ? 'text-red-500 font-bold'
                      : 'text-gray-500 italic'
                  }
                >
                  {answer.judged ? (answer.is_correct ? '✓ 正解' : '✗ 不正解') : '判定待ち'}
                </Text>
              )}
            </View>
          ))}

          <Text className="text-xs text-gray-500 text-center italic mt-2 mb-4">
            最終更新: {new Date().toLocaleTimeString()}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

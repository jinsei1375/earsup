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
  allowPartialPoints?: boolean; // 惜しい判定を許可するか
  judgmentTypes?: Record<string, 'correct' | 'partial' | 'incorrect'>; // 判定タイプ
  loading: boolean;
  onJudgeAnswer: (
    answerId: string,
    isCorrect: boolean,
    judgeType?: 'correct' | 'partial' | 'incorrect'
  ) => void;
  onRefresh: () => void;
}

export const AnswersList: React.FC<AnswersListProps> = ({
  answers,
  isHost,
  isAllAtOnceMode,
  allowPartialPoints = true,
  judgmentTypes = {}, // デフォルトは空のオブジェクト
  loading,
  onJudgeAnswer,
  onRefresh,
}) => {
  return (
    <View className="w-full my-4 max-h-[400px]">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-base font-bold">回答一覧 ({answers.length}件)</Text>
        <Button title="更新" onPress={onRefresh} variant="outline" size="small" />
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
          {answers.map((answer) => {
            const judgmentResult = answer.judge_result || judgmentTypes[answer.id];
            const isPartial = judgmentResult === 'partial' && allowPartialPoints;

            // 背景色を判定結果に応じて決定
            let borderColorClass = 'border-gray-300 bg-gray-50';
            if (answer.judged) {
              if (judgmentResult === 'correct') {
                borderColorClass = 'border-green-500 bg-green-50';
              } else if (isPartial) {
                borderColorClass = 'border-orange-500 bg-orange-50';
              } else {
                borderColorClass = 'border-red-500 bg-red-50';
              }
            }

            return (
              <View key={answer.id} className={`p-3 rounded-lg mb-2 border ${borderColorClass}`}>
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
                      onPress={() => onJudgeAnswer(answer.id, true, 'correct')}
                      disabled={loading}
                      variant="primary"
                      size="small"
                    />
                    {allowPartialPoints && (
                      <Button
                        title="惜しい"
                        onPress={() => onJudgeAnswer(answer.id, false, 'partial')}
                        disabled={loading}
                        variant="secondary"
                        size="small"
                      />
                    )}
                    <Button
                      title="不正解"
                      onPress={() => onJudgeAnswer(answer.id, false, 'incorrect')}
                      disabled={loading}
                      variant="danger"
                      size="small"
                    />
                  </View>
                ) : (
                  // Show judgment result
                  (() => {
                    const judgmentResult = answer.judge_result || judgmentTypes[answer.id];
                    const isPartial = judgmentResult === 'partial';

                    // 判定結果のテキストとスタイルを決定
                    let resultText = '判定待ち';
                    let className = 'text-gray-500 italic';

                    if (answer.judged) {
                      if (judgmentResult === 'correct') {
                        resultText = '✓ 正解';
                        className = 'text-green-500 font-bold';
                      } else if (isPartial && allowPartialPoints) {
                        resultText = '△ 惜しい';
                        className = 'text-orange-500 font-bold';
                      } else {
                        resultText = '✗ 不正解';
                        className = 'text-red-500 font-bold';
                      }
                    }

                    return <Text className={className}>{resultText}</Text>;
                  })()
                )}
              </View>
            );
          })}
          <Text className="text-xs text-gray-500 text-center italic mt-2 mb-4">
            最終更新: {new Date().toLocaleTimeString()}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

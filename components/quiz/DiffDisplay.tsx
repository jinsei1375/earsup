// components/quiz/DiffDisplay.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { DiffResult, DiffWord } from '@/utils/diffUtils';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';

interface DiffDisplayProps {
  diffResult: DiffResult;
  userAnswer: string;
  correctAnswer: string;
  className?: string;
}

interface DiffWordDisplayProps {
  word: DiffWord;
  isCorrectAnswer?: boolean;
}

const DiffWordDisplay: React.FC<DiffWordDisplayProps> = ({ word, isCorrectAnswer = false }) => {
  const getWordStyle = (type: DiffWord['type'], isCorrect: boolean) => {
    switch (type) {
      case 'match':
        return 'text-green-700 bg-green-100';
      case 'different':
        return isCorrect ? 'text-blue-700 bg-blue-100' : 'text-red-700 bg-red-100';
      case 'missing':
        return 'text-orange-700 bg-orange-100';
      case 'extra':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700';
    }
  };

  const getWordIcon = (type: DiffWord['type']) => {
    switch (type) {
      case 'match':
        return <FeatureIcon name="checkmark" size={12} color={APP_COLORS.success} />;
      case 'different':
        return <FeatureIcon name="swap-horizontal" size={12} color={APP_COLORS.warning} />;
      case 'missing':
        return <FeatureIcon name="add" size={12} color={APP_COLORS.warning} />;
      case 'extra':
        return <FeatureIcon name="remove" size={12} color={APP_COLORS.danger} />;
      default:
        return null;
    }
  };

  return (
    <View
      className={`inline-flex flex-row items-center rounded px-1.5 py-0.5 mx-0.5 mb-1 ${getWordStyle(
        word.type,
        isCorrectAnswer
      )}`}
    >
      {getWordIcon(word.type) && <View className="mr-1">{getWordIcon(word.type)}</View>}
      <Text
        className={`text-sm font-medium ${
          word.type === 'match'
            ? 'text-green-700'
            : word.type === 'different'
            ? isCorrectAnswer
              ? 'text-blue-700'
              : 'text-red-700'
            : word.type === 'missing'
            ? 'text-orange-700'
            : 'text-red-700'
        }`}
      >
        {word.text}
      </Text>
    </View>
  );
};

export const DiffDisplay: React.FC<DiffDisplayProps> = ({
  diffResult,
  userAnswer,
  correctAnswer,
  className = '',
}) => {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 90) return 'trophy';
    if (accuracy >= 70) return 'thumbs-up';
    return 'close-circle';
  };

  return (
    <View className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      {/* ヘッダー - 正答率表示 */}
      <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <FeatureIcon
            name={getAccuracyIcon(diffResult.accuracy)}
            size={20}
            color={
              diffResult.accuracy >= 90
                ? APP_COLORS.success
                : diffResult.accuracy >= 70
                ? APP_COLORS.warning
                : APP_COLORS.danger
            }
          />
          <Text className="ml-2 text-lg font-bold text-gray-800">回答比較</Text>
        </View>
        <View className="flex-row items-center">
          <Text className={`text-lg font-bold ${getAccuracyColor(diffResult.accuracy)}`}>
            {diffResult.accuracy}%
          </Text>
          <Text className="text-sm text-gray-500 ml-1">
            ({diffResult.matchedWords}/{diffResult.totalWords})
          </Text>
        </View>
      </View>

      {/* あなたの回答 */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <FeatureIcon name="person" size={16} color={APP_COLORS.primary} />
          <Text className="ml-2 text-sm font-semibold text-gray-700">あなたの回答</Text>
        </View>
        <View className="bg-gray-50 rounded-lg p-3 min-h-[60px]">
          <View className="flex-row flex-wrap items-start">
            {diffResult.userWords.length > 0 ? (
              diffResult.userWords.map((word, index) => (
                <DiffWordDisplay key={`user-${index}`} word={word} isCorrectAnswer={false} />
              ))
            ) : (
              <Text className="text-gray-400 italic">回答なし</Text>
            )}
          </View>
        </View>
      </View>

      {/* 正解 */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <FeatureIcon name="checkmark-circle" size={16} color={APP_COLORS.success} />
          <Text className="ml-2 text-sm font-semibold text-gray-700">正解</Text>
        </View>
        <View className="bg-green-50 rounded-lg p-3 min-h-[60px]">
          <View className="flex-row flex-wrap items-start">
            {diffResult.correctWords.map((word, index) => (
              <DiffWordDisplay key={`correct-${index}`} word={word} isCorrectAnswer={true} />
            ))}
          </View>
        </View>
      </View>

      {/* 凡例 */}
      <View className="bg-gray-50 rounded-lg p-3">
        <Text className="text-xs font-semibold text-gray-600 mb-2">凡例</Text>
        <View className="flex-row flex-wrap">
          <View className="flex-row items-center mr-4 mb-1">
            <View className="w-3 h-3 bg-green-100 rounded mr-1" />
            <Text className="text-xs text-gray-600">完全一致</Text>
          </View>
          <View className="flex-row items-center mr-4 mb-1">
            <View className="w-3 h-3 bg-red-100 rounded mr-1" />
            <Text className="text-xs text-gray-600">間違い</Text>
          </View>
          <View className="flex-row items-center mr-4 mb-1">
            <View className="w-3 h-3 bg-orange-100 rounded mr-1" />
            <Text className="text-xs text-gray-600">不足</Text>
          </View>
          <View className="flex-row items-center mb-1">
            <View className="w-3 h-3 bg-blue-100 rounded mr-1" />
            <Text className="text-xs text-gray-600">大文字小文字・タイポ</Text>
          </View>
        </View>
        <Text className="text-xs text-gray-500 mt-2">
          ※ 文末の句読点(.!?)と大文字小文字の違いは判定に影響しません
        </Text>
      </View>
    </View>
  );
};

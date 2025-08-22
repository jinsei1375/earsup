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
  const getWordStyle = (word: DiffWord, isCorrect: boolean): string => {
    switch (word.type) {
      case 'match':
        return 'text-app-success-dark bg-app-success-light';
      case 'different':
        return isCorrect
          ? 'text-app-primary-dark bg-app-primary-light'
          : 'text-app-danger-dark bg-app-danger-light';
      case 'missing':
        return 'text-app-orange-dark bg-app-orange-light';
      case 'extra':
        return 'text-app-danger-dark bg-app-danger-light';
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
        word,
        isCorrectAnswer
      )}`}
    >
      {getWordIcon(word.type) && <View className="mr-1">{getWordIcon(word.type)}</View>}
      <Text
        className={`text-sm font-medium ${
          word.type === 'match'
            ? 'text-app-success-dark'
            : word.type === 'different'
            ? isCorrectAnswer
              ? 'text-app-primary-dark'
              : 'text-app-danger-dark'
            : word.type === 'missing'
            ? 'text-app-orange-dark'
            : 'text-app-danger-dark'
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
    if (accuracy >= 90) return 'text-app-success-dark';
    if (accuracy >= 70) return 'text-app-warning-dark';
    return 'text-app-danger-dark';
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 90) return 'trophy';
    if (accuracy >= 70) return 'thumbs-up';
    return 'close-circle';
  };

  return (
    <View className={`bg-white border-[${APP_COLORS.gray200}] rounded-xl p-4 ${className}`}>
      {/* ヘッダー - 正答率表示 */}
      <View
        className={`flex-row items-center justify-between mb-4 pb-3 border-b border-[${APP_COLORS.gray100}]`}
      >
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
        <View className="bg-app-success-light rounded-lg p-3 min-h-[60px]">
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
            <View className="w-3 h-3 bg-app-success-light rounded mr-1" />
            <Text className="text-xs text-gray-600">完全一致</Text>
          </View>
          <View className="flex-row items-center mr-4 mb-1">
            <View className="w-3 h-3 bg-app-danger-light rounded mr-1" />
            <Text className="text-xs text-gray-600">間違い</Text>
          </View>
          <View className="flex-row items-center mr-4 mb-1">
            <View className="w-3 h-3 bg-app-orange-light rounded mr-1" />
            <Text className="text-xs text-gray-600">不足</Text>
          </View>
          <View className="flex-row items-center mb-1">
            <View className="w-3 h-3 bg-app-primary-light rounded mr-1" />
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

// components/quiz/QuizModeSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface QuizModeSelectorProps {
  selectedMode: 'all-at-once-host' | 'all-at-once-auto';
  onModeChange: (mode: 'all-at-once-host' | 'all-at-once-auto') => void;
  allowPartialPoints: boolean;
  onPartialPointsChange: (allow: boolean) => void;
  disabled?: boolean;
}

export const QuizModeSelector: React.FC<QuizModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  allowPartialPoints,
  onPartialPointsChange,
  disabled = false,
}) => {
  return (
    <View className="w-full mb-6">
      {/* クイズモード選択 */}
      <Text className="mb-2 font-bold">クイズモード</Text>
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() => onModeChange('all-at-once-host')}
          disabled={disabled}
          className={`flex-1 mr-2 p-4 rounded-lg border-2 items-center justify-center ${
            selectedMode === 'all-at-once-host'
              ? 'bg-blue-500 border-blue-500 active:bg-blue-600'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              selectedMode === 'all-at-once-host' ? 'text-white' : 'text-gray-700'
            }`}
          >
            一斉回答（ホストあり）
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              selectedMode === 'all-at-once-host' ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            ホストが問題を作成
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onModeChange('all-at-once-auto')}
          disabled={disabled}
          className={`flex-1 ml-2 p-4 rounded-lg border-2 items-center justify-center ${
            selectedMode === 'all-at-once-auto'
              ? 'bg-blue-500 border-blue-500 active:bg-blue-600'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              selectedMode === 'all-at-once-auto' ? 'text-white' : 'text-gray-700'
            }`}
          >
            一斉回答（ホストなし）
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              selectedMode === 'all-at-once-auto' ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            ランダムに問題が出題
          </Text>
        </TouchableOpacity>
      </View>

      {/* 判定設定 */}
      <Text className="mb-2 font-bold">判定設定</Text>
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() => onPartialPointsChange(false)}
          disabled={disabled}
          className={`flex-1 mr-2 p-4 rounded-lg border-2 items-center justify-center ${
            !allowPartialPoints
              ? 'bg-blue-500 border-blue-500 active:bg-blue-600'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              !allowPartialPoints ? 'text-white' : 'text-gray-700'
            }`}
          >
            正誤判定のみ
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              !allowPartialPoints ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            正解: 10pt、不正解: 0pt
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onPartialPointsChange(true)}
          disabled={disabled}
          className={`flex-1 ml-2 p-4 rounded-lg border-2 items-center justify-center ${
            allowPartialPoints
              ? 'bg-blue-500 border-blue-500 active:bg-blue-600'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              allowPartialPoints ? 'text-white' : 'text-gray-700'
            }`}
          >
            惜しい判定を有効
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              allowPartialPoints ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            惜しい: 5ptを選択可能
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

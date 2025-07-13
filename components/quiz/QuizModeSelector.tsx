// components/quiz/QuizModeSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface QuizModeSelectorProps {
  selectedMode: 'first-come' | 'all-at-once';
  onModeChange: (mode: 'first-come' | 'all-at-once') => void;
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
          onPress={() => {}} // Disabled for MVP
          disabled={true} // Always disabled for MVP
          className="flex-1 mr-2 p-4 rounded-lg border-2 border-gray-300 bg-gray-100 opacity-50 items-center justify-center"
        >
          <Text className="text-center text-gray-400 font-bold">早押しモード</Text>
          <Text className="text-xs text-center text-gray-400 mt-1">近日リリース予定</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onModeChange('all-at-once')}
          disabled={disabled}
          className={`flex-1 ml-2 p-4 rounded-lg border-2 items-center justify-center ${
            selectedMode === 'all-at-once'
              ? 'bg-blue-500 border-blue-500 active:bg-blue-600'
              : 'bg-transparent border-gray-300 active:bg-gray-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text
            className={`text-center font-bold ${
              selectedMode === 'all-at-once' ? 'text-white' : 'text-gray-700'
            }`}
          >
            一斉回答モード
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              selectedMode === 'all-at-once' ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            全員が同時に回答
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

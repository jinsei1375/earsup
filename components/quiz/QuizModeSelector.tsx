// components/quiz/QuizModeSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface QuizModeSelectorProps {
  selectedMode: 'first-come' | 'all-at-once';
  onModeChange: (mode: 'first-come' | 'all-at-once') => void;
  disabled?: boolean;
}

export const QuizModeSelector: React.FC<QuizModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  disabled = false,
}) => {
  return (
    <View className="w-full mb-6">
      <Text className="mb-2 font-bold">クイズモード</Text>
      <View className="flex-row justify-between">
        <TouchableOpacity
          onPress={() => onModeChange('first-come')}
          disabled={disabled}
          className={`flex-1 mr-2 p-3 rounded-lg border ${
            selectedMode === 'first-come' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text className={`text-center ${selectedMode === 'first-come' ? 'font-bold' : ''}`}>
            早押しモード
          </Text>
          <Text className="text-xs text-center text-gray-500 mt-1">
            最初に回答権を得た人だけが回答できます
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onModeChange('all-at-once')}
          disabled={disabled}
          className={`flex-1 ml-2 p-3 rounded-lg border ${
            selectedMode === 'all-at-once' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text className={`text-center ${selectedMode === 'all-at-once' ? 'font-bold' : ''}`}>
            一斉回答モード
          </Text>
          <Text className="text-xs text-center text-gray-500 mt-1">
            全員が同時に回答できます
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
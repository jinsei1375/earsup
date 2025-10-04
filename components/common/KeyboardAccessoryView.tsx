// components/common/KeyboardAccessoryView.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Keyboard, InputAccessoryView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface KeyboardAccessoryViewProps {
  nativeID: string;
  onDone?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  disableNext?: boolean;
  disablePrevious?: boolean;
  showNavigation?: boolean;
}

export const KeyboardAccessoryView: React.FC<KeyboardAccessoryViewProps> = ({
  nativeID,
  onDone,
  onNext,
  onPrevious,
  disableNext = false,
  disablePrevious = false,
  showNavigation = false,
}) => {
  const handleDone = () => {
    Keyboard.dismiss();
    onDone?.();
  };

  const handleNext = () => {
    if (!disableNext) {
      onNext?.();
    }
  };

  const handlePrevious = () => {
    if (!disablePrevious) {
      onPrevious?.();
    }
  };
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View className="flex-row justify-between items-center px-4 py-2 bg-gray-100 border-t border-gray-300">
        {/* 左側: 前へ・次へボタングループ（条件付き表示） */}
        {showNavigation ? (
          <View className="flex-row">
            <TouchableOpacity
              onPress={handlePrevious}
              className="flex-row items-center px-3 py-1 rounded-lg mr-2"
              activeOpacity={disablePrevious ? 1 : 0.7}
              disabled={disablePrevious}
              style={{ opacity: disablePrevious ? 0.3 : 1 }}
            >
              <Ionicons name="chevron-back" size={24} color="#3B82F6" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              className="flex-row items-center px-3 py-1 rounded-lg"
              activeOpacity={disableNext ? 1 : 0.7}
              disabled={disableNext}
              style={{ opacity: disableNext ? 0.3 : 1 }}
            >
              <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        ) : (
          <View />
        )}

        {/* 右側: 完了ボタン */}
        <TouchableOpacity
          onPress={handleDone}
          className="flex-row items-center px-4 py-2 rounded-lg"
          activeOpacity={0.7}
        >
          <Text className="text-app-primary font-medium text-base">完了</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
};

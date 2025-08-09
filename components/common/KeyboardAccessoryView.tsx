// components/common/KeyboardAccessoryView.tsx
import React from 'react';
import { View, TouchableOpacity, Keyboard, InputAccessoryView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface KeyboardAccessoryViewProps {
  nativeID: string;
  onDone?: () => void;
}

export const KeyboardAccessoryView: React.FC<KeyboardAccessoryViewProps> = ({
  nativeID,
  onDone,
}) => {
  const handleDone = () => {
    Keyboard.dismiss();
    onDone?.();
  };

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View className="flex-row justify-between items-center px-4 py-2 bg-gray-100 border-t border-gray-300">
        <View />
        <TouchableOpacity
          onPress={handleDone}
          className="flex-row items-center px-3 py-1 bg-blue-500 rounded-lg"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
};

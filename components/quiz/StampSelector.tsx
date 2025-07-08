// components/quiz/StampSelector.tsx
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '@/components/common/Button';

interface StampSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectStamp: (stampType: string) => void;
  loading?: boolean;
}

const AVAILABLE_STAMPS = [
  { type: 'amazing', emoji: '😍', text: 'すごい！' },
  { type: 'frustrated', emoji: '😤', text: '悔しい！' },
  { type: 'thumbs_up', emoji: '👍', text: 'いいね！' },
  { type: 'thinking', emoji: '🤔', text: '難しい...' },
  { type: 'surprised', emoji: '😲', text: 'びっくり！' },
  { type: 'heart', emoji: '❤️', text: 'すき！' },
];

export const StampSelector: React.FC<StampSelectorProps> = ({
  visible,
  onClose,
  onSelectStamp,
  loading = false,
}) => {
  const handleStampSelect = (stampType: string) => {
    onSelectStamp(stampType);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 max-h-96">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">スタンプを選択</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1">
            <View className="flex-row flex-wrap gap-3">
              {AVAILABLE_STAMPS.map((stamp) => (
                <TouchableOpacity
                  key={stamp.type}
                  onPress={() => handleStampSelect(stamp.type)}
                  disabled={loading}
                  className="bg-gray-100 rounded-2xl p-4 items-center min-w-24 opacity-100"
                  style={{ opacity: loading ? 0.5 : 1 }}
                >
                  <Text className="text-2xl mb-1">{stamp.emoji}</Text>
                  <Text className="text-xs text-center font-medium">{stamp.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
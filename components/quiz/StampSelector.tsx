// components/quiz/StampSelector.tsx
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '@/components/common/Button';

interface StampSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectStamp: (stampType: string) => void;
  loading?: boolean;
  stamps?: { type: string; emoji: string; text: string }[]; // DBから取得した場合
}

// デフォルトの絵文字スタンプ
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
  // stamps,
}) => {
  const handleStampSelect = (stampType: string) => {
    // onSelectStamp(stampType);
    onClose();
  };

  // 常にデフォルト絵文字のみ表示
  // const displayStamps = stamps && stamps.length > 0 ? stamps : AVAILABLE_STAMPS;
  const displayStamps = AVAILABLE_STAMPS;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">スタンプを選択</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
            style={{ maxHeight: 320 }}
          >
            {displayStamps.map((stamp) => (
              <TouchableOpacity
                key={stamp.type}
                onPress={() => handleStampSelect(stamp.type)}
                disabled={loading}
                className="bg-gray-100 rounded-xl p-2 items-center min-w-24 mr-2 mb-2"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                <Text className="text-2xl mb-1">{stamp.emoji}</Text>
                <Text className="text-xs text-center font-medium">{stamp.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

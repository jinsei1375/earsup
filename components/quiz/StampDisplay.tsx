// components/quiz/StampDisplay.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { Stamp } from '@/types';

interface StampDisplayProps {
  stamps: Stamp[];
  className?: string;
}

const STAMP_EMOJIS: Record<string, string> = {
  amazing: '😍',
  frustrated: '😤',
  thumbs_up: '👍',
  thinking: '🤔',
  surprised: '😲',
  heart: '❤️',
};

const STAMP_TEXTS: Record<string, string> = {
  amazing: 'すごい！',
  frustrated: '悔しい！',
  thumbs_up: 'いいね！',
  thinking: '難しい...',
  surprised: 'びっくり！',
  heart: 'すき！',
};

export const StampDisplay: React.FC<StampDisplayProps> = ({ stamps, className = '' }) => {
  if (!stamps || stamps.length === 0) {
    return (
      <View className={`bg-gray-50 rounded-lg p-3 ${className}`}>
        <Text className="text-gray-500 text-sm text-center">まだスタンプがありません</Text>
      </View>
    );
  }

  return (
    <View className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <Text className="text-sm font-medium mb-2 text-gray-700">みんなのスタンプ</Text>
      <ScrollView 
        className="max-h-24" 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {stamps.map((stamp) => (
          <View key={stamp.id} className="flex-row items-center mb-1 last:mb-0">
            <Text className="text-lg mr-2">
              {STAMP_EMOJIS[stamp.stamp_type] || '❓'}
            </Text>
            <Text className="text-xs text-gray-600 flex-1">
              <Text className="font-medium">{stamp.nickname || '不明なユーザー'}</Text>
              {' '}
              <Text>{STAMP_TEXTS[stamp.stamp_type] || stamp.stamp_type}</Text>
            </Text>
            <Text className="text-xs text-gray-400 ml-2">
              {new Date(stamp.created_at).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
// components/quiz/StampDisplay.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { Stamp } from '@/types';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';

interface StampDisplayProps {
  stamps: Stamp[];
  className?: string;
}

const STAMP_CONFIG: Record<string, { icon: string; color: string; text: string }> = {
  amazing: { icon: 'heart', color: APP_COLORS.danger, text: 'すごい！' },
  frustrated: { icon: 'sad', color: APP_COLORS.warning, text: '悔しい！' },
  thumbs_up: { icon: 'thumbs-up', color: APP_COLORS.success, text: 'いいね！' },
  thinking: { icon: 'help-circle', color: APP_COLORS.info, text: '難しい...' },
  surprised: { icon: 'alert-circle', color: APP_COLORS.warning, text: 'びっくり！' },
  heart: { icon: 'heart', color: APP_COLORS.danger, text: 'すき！' },
};

export const StampDisplay: React.FC<StampDisplayProps> = ({ stamps, className = '' }) => {
  if (!stamps || stamps.length === 0) {
    return (
      <View className={`bg-app-neutral-50 rounded-lg p-3 ${className}`}>
        <Text className="text-app-neutral-500 text-sm text-center">まだスタンプがありません</Text>
      </View>
    );
  }

  return (
    <View className={`bg-app-neutral-50 rounded-lg p-3 ${className}`}>
      <Text className="text-sm font-medium mb-2 text-app-neutral-700">みんなのスタンプ</Text>
      <ScrollView
        className="max-h-24"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {stamps.map((stamp) => {
          const config = STAMP_CONFIG[stamp.stamp_type] || {
            icon: 'help-circle',
            color: APP_COLORS.gray600,
            text: stamp.stamp_type,
          };

          return (
            <View key={stamp.id} className="flex-row items-center mb-1 last:mb-0">
              <FeatureIcon
                name={config.icon as any}
                size={16}
                color={config.color}
                className="mr-2"
              />
              <Text className="text-xs text-app-neutral-600 flex-1">{stamp.stamp_type}</Text>
              <Text className="text-xs text-app-neutral-400 ml-2">
                {new Date(stamp.created_at).toLocaleTimeString()}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

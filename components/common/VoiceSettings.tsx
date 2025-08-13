// components/common/VoiceSettings.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { FeatureIcon, APP_COLORS } from './FeatureIcon';
import type { VoiceSettings as VoiceSettingsType } from '@/types';

interface VoiceSettingsProps {
  voiceSettings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
  className?: string;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voiceSettings,
  onSettingsChange,
  className = '',
}) => {
  const handleGenderChange = (gender: 'male' | 'female') => {
    onSettingsChange({ ...voiceSettings, gender });
  };

  const handleSpeedChange = (speed: number) => {
    onSettingsChange({ ...voiceSettings, speed });
  };

  return (
    <View className={`bg-white border-2 border-gray-300 rounded-xl p-2 ${className}`}>
      <View className="flex-row items-center mb-4">
        <FeatureIcon name="mic" size={20} color={APP_COLORS.primary} className="mr-2" />
        <Text className="text-lg font-semibold text-gray-800">音声設定</Text>
      </View>

      {/* 性別選択 */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">音声の性別</Text>
        <View className="flex-row space-x-3 gap-2">
          <Button
            title="男性"
            variant={voiceSettings.gender === 'male' ? 'primary' : 'secondary'}
            onPress={() => handleGenderChange('male')}
            size="small"
          />
          <Button
            title="女性"
            variant={voiceSettings.gender === 'female' ? 'primary' : 'secondary'}
            onPress={() => handleGenderChange('female')}
            size="small"
          />
        </View>
      </View>

      {/* 速度設定 */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">
          再生速度: {voiceSettings.speed}x
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
            <Button
              key={speed}
              title={`${speed}x`}
              variant={voiceSettings.speed === speed ? 'primary' : 'secondary'}
              onPress={() => handleSpeedChange(speed)}
              size="small"
              className="min-w-[60px]"
            />
          ))}
        </View>
      </View>
    </View>
  );
};

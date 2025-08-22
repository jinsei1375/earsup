// components/quiz/BuzzInSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Button } from 'react-native';
import type { ParticipantWithNickname } from '@/types';

interface BuzzInSectionProps {
  currentBuzzer: string | null;
  participants: ParticipantWithNickname[];
  isHost: boolean;
  loading: boolean;
  onResetBuzz: () => void;
}

export const BuzzInSection: React.FC<BuzzInSectionProps> = ({
  currentBuzzer,
  participants,
  isHost,
  loading,
  onResetBuzz,
}) => {
  return (
    <View className="w-full my-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold">バズイン状況:</Text>
        {isHost && (
          <Button
            title="バズインをリセット"
            onPress={onResetBuzz}
            disabled={!currentBuzzer || loading}
          />
        )}
      </View>

      {currentBuzzer ? (
        <View className="bg-app-warning-light p-3 rounded-lg mt-2">
          <Text className="text-center">
            {participants.find((p) => p.id === currentBuzzer)?.nickname || '不明な参加者'}
            さんがバズインしました
          </Text>
        </View>
      ) : (
        <Text className="italic text-gray-600 text-center mt-2">
          まだバズインした人はいません
        </Text>
      )}
    </View>
  );
};
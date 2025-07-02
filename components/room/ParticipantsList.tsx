// components/room/ParticipantsList.tsx
import React from 'react';
import { View, Text, ScrollView, Button } from 'react-native';
import type { ParticipantWithNickname } from '@/types';

interface ParticipantsListProps {
  participants: ParticipantWithNickname[];
  hostUserId?: string;
  loading: boolean;
  onRefresh: () => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  hostUserId,
  loading,
  onRefresh,
}) => {
  return (
    <>
      <View className="flex-row justify-between items-center w-full mt-2.5 mb-2.5">
        <Text>参加者 ({participants.length}名)</Text>
        <Button title="更新" onPress={onRefresh} disabled={loading} />
      </View>

      <ScrollView className="w-full max-h-[200px] my-5">
        {participants.map((participant) => (
          <View key={participant.id} className="p-3 border-b border-gray-200">
            <Text>
              {participant.nickname} {participant.id === hostUserId ? '(ホスト)' : ''}
            </Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
};
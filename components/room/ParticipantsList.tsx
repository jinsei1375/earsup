// components/room/ParticipantsList.tsx
import React from 'react';
import { View, Text, ScrollView, Button } from 'react-native';
import type { ParticipantWithNickname, Answer } from '@/types';
import { calculateParticipantStats, formatParticipantStats } from '@/utils/quizUtils';

interface ParticipantsListProps {
  participants: ParticipantWithNickname[];
  hostUserId?: string;
  loading: boolean;
  onRefresh: () => void;
  answers?: Answer[]; // Added to calculate stats
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  hostUserId,
  loading,
  onRefresh,
  answers = [], // Default to empty array
}) => {
  // Calculate stats only if answers are provided (during quiz)
  const participantStats = answers.length > 0 
    ? calculateParticipantStats(participants, answers, hostUserId)
    : null;

  return (
    <>
      <View className="flex-row justify-between items-center w-full mt-2.5 mb-2.5">
        <Text>参加者 ({participants.length}名)</Text>
        <Button title="更新" onPress={onRefresh} disabled={loading} />
      </View>

      <ScrollView className="w-full max-h-[200px] my-5">
        {participants.map((participant) => {
          const stats = participantStats?.find(s => s.userId === participant.id);
          return (
            <View key={participant.id} className="p-3 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text>
                  {participant.nickname} {participant.id === hostUserId ? '(ホスト)' : ''}
                </Text>
                {stats && (
                  <Text className="text-sm text-gray-600 font-mono">
                    {formatParticipantStats(stats)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </>
  );
};
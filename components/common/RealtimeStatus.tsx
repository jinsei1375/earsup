// components/common/RealtimeStatus.tsx
import React from 'react';
import { View, Text } from 'react-native';
import type { RealtimeConnectionState } from '@/types';

interface RealtimeStatusProps {
  connectionState: RealtimeConnectionState;
  showLastUpdate?: boolean;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  connectionState,
  showLastUpdate = true,
}) => {
  return (
    <View className="items-center mb-3">
      <Text className={`text-sm ${connectionState.connected ? 'text-app-success-dark' : 'text-gray-500'}`}>
        ● {connectionState.connected ? 'リアルタイム更新中' : 'ポーリング更新中'}
      </Text>
      {showLastUpdate && connectionState.lastUpdate && (
        <Text className="text-xs text-gray-400 mt-1">
          最終更新: {connectionState.lastUpdate.toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};
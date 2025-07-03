// components/common/LoadingSpinner.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'small',
  color = '#0000ff',
  className = 'mt-4',
}) => {
  return (
    <View className={className}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};
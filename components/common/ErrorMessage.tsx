// components/common/ErrorMessage.tsx
import React from 'react';
import { Text } from 'react-native';

interface ErrorMessageProps {
  message: string | null;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = 'mt-4 text-app-danger',
}) => {
  if (!message) return null;
  
  return <Text className={className}>{message}</Text>;
};
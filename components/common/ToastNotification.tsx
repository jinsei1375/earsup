// components/common/ToastNotification.tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastNotificationProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
  animatedValue: Animated.Value;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onDismiss,
  animatedValue,
}) => {
  useEffect(() => {
    // Auto dismiss after duration
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          icon: 'checkmark-circle' as const,
          iconColor: '#ffffff',
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          icon: 'close-circle' as const,
          iconColor: '#ffffff',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-500',
          icon: 'information-circle' as const,
          iconColor: '#ffffff',
        };
    }
  };

  const styles = getToastStyles();

  return (
    <Animated.View
      style={{
        transform: [
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-100, 0],
            }),
          },
        ],
        opacity: animatedValue,
      }}
      className={`${styles.bg} mx-4 mb-2 p-4 rounded-lg shadow-lg flex-row items-center`}
    >
      <Ionicons name={styles.icon} size={24} color={styles.iconColor} />
      <View className="flex-1 ml-3">
        <Text className="text-white font-semibold text-lg">{toast.title}</Text>
        {toast.message && (
          <Text className="text-white text-sm mt-1">{toast.message}</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => onDismiss(toast.id)} className="ml-2">
        <Ionicons name="close" size={20} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );
};
// components/common/FloatingActionButton.tsx
import React from 'react';
import { TouchableOpacity, Text, View, Animated } from 'react-native';
import { useUIAnimations } from '@/hooks/useAnimations';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
  text?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  disabled?: boolean;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  text,
  variant = 'primary',
  size = 'medium',
  position = 'bottom-right',
  disabled = false,
  className = '',
}) => {
  const { scale, pressAnimation } = useUIAnimations();

  const handlePress = () => {
    if (!disabled) {
      pressAnimation().start();
      onPress();
    }
  };

  const sizeStyles = {
    small: {
      container: 'w-12 h-12',
      text: 'text-xs',
      padding: 'p-3',
    },
    medium: {
      container: 'w-16 h-16',
      text: 'text-sm',
      padding: 'p-4',
    },
    large: {
      container: 'w-20 h-20',
      text: 'text-base',
      padding: 'p-5',
    },
  };

  const variantStyles = {
    primary: disabled
      ? 'bg-gray-400 shadow-gray-400/20'
      : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/40',
    secondary: disabled
      ? 'bg-gray-400 shadow-gray-400/20'
      : 'bg-gradient-to-r from-gray-500 to-gray-600 shadow-gray-500/40',
    success: disabled
      ? 'bg-gray-400 shadow-gray-400/20'
      : 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/40',
    warning: disabled
      ? 'bg-gray-400 shadow-gray-400/20'
      : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/40',
    danger: disabled
      ? 'bg-gray-400 shadow-gray-400/20'
      : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/40',
  };

  const positionStyles = {
    'bottom-right': 'absolute bottom-6 right-6',
    'bottom-left': 'absolute bottom-6 left-6',
    'bottom-center': 'absolute bottom-6 left-1/2 transform -translate-x-1/2',
  };

  const { container, text: textSize, padding } = sizeStyles[size];

  return (
    <Animated.View
      className={`${positionStyles[position]} ${className}`}
      style={{
        transform: [{ scale: scale.scaleValue }],
        zIndex: 1000,
      }}
    >
      <TouchableOpacity
        className={`
          ${container}
          ${variantStyles[variant]}
          rounded-full
          shadow-2xl
          items-center
          justify-center
          border-2
          border-white
        `}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <View className="items-center justify-center">
          {icon && <View className="mb-1">{icon}</View>}
          {text && (
            <Text className={`text-white font-bold ${textSize} text-center`}>
              {text}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
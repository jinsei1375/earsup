// components/common/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, View, Animated } from 'react-native';
import { useRef } from 'react';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'correct' | 'partial';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'outline'
  | 'ghost'
  | 'correct'
  | 'partial';
type ButtonSize = 'small' | 'medium' | 'large';

export const CustomButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  className = '',
  icon,
  children,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!disabled) {
      animatePress();
      onPress();
    }
  };

  // ベーススタイル - シンプルで洗練されたデザイン
  const baseButtonStyle = 'rounded-lg items-center justify-center';

  // サイズスタイル - 適度なパディング
  const sizeStyles: Record<ButtonSize, string> = {
    small: 'px-3 py-2',
    medium: 'px-4 py-3',
    large: 'px-6 py-4',
  };

  // バリアントスタイル - シンプルで実用的
  const variantStyles: Record<ButtonVariant, string> = {
    primary: disabled ? 'bg-gray-300' : 'bg-blue-500',
    secondary: disabled ? 'bg-gray-200' : 'bg-gray-100 border border-gray-300',
    danger: disabled ? 'bg-gray-300' : 'bg-red-500',
    outline: disabled
      ? 'bg-transparent border border-gray-300'
      : 'bg-transparent border border-blue-500',
    ghost: disabled ? 'bg-transparent' : 'bg-transparent',
    correct: disabled ? 'bg-gray-300' : 'bg-green-500',
    partial: disabled ? 'bg-gray-300' : 'bg-orange-500',
  };

  // テキストスタイル
  const textSizeStyles: Record<ButtonSize, string> = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const textVariantStyles: Record<ButtonVariant, string> = {
    primary: 'text-white',
    secondary: 'text-gray-700',
    danger: 'text-white',
    outline: 'text-blue-500',
    ghost: 'text-gray-700',
    correct: 'text-white',
    partial: 'text-white',
  };
  const buttonClassName = [
    baseButtonStyle,
    sizeStyles[size],
    variantStyles[variant],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  const textClassName = ['font-medium', textSizeStyles[size], textVariantStyles[variant]].join(' ');

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        className={buttonClassName}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.9}
      >
        {children || (
          <View className="flex-row items-center justify-center">
            {icon && <View className="mr-2">{icon}</View>}
            {title && <Text className={textClassName}>{title}</Text>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Export both names for convenience and clarity
export const Button = CustomButton;

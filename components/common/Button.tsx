// components/common/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

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
  // ベーススタイル
  const baseButtonStyle = 'rounded-lg border-2 items-center justify-center';

  // サイズスタイル
  const sizeStyles = {
    small: 'px-3 py-2',
    medium: 'px-4 py-3',
    large: 'px-6 py-4',
  };

  // バリアントスタイル
  const variantStyles = {
    primary: disabled
      ? 'bg-gray-300 border-gray-300'
      : 'bg-blue-500 border-blue-500 active:bg-blue-600',
    secondary: disabled
      ? 'bg-gray-300 border-gray-300'
      : 'bg-gray-100 border-gray-300 active:bg-gray-200',
    danger: disabled
      ? 'bg-gray-300 border-gray-300'
      : 'bg-red-500 border-red-500 active:bg-red-600',
    outline: disabled
      ? 'bg-transparent border-gray-300'
      : 'bg-transparent border-blue-500 active:bg-blue-50',
    ghost: disabled
      ? 'bg-transparent border-transparent'
      : 'bg-transparent border-transparent active:bg-gray-100',
  };

  // テキストスタイル
  const textSizeStyles = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const textVariantStyles = {
    primary: disabled ? 'text-gray-500' : 'text-white',
    secondary: disabled ? 'text-gray-500' : 'text-gray-700',
    danger: disabled ? 'text-gray-500' : 'text-white',
    outline: disabled ? 'text-gray-400' : 'text-blue-500',
    ghost: disabled ? 'text-gray-400' : 'text-gray-700',
  };

  const buttonClassName = [
    baseButtonStyle,
    sizeStyles[size],
    variantStyles[variant],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  const textClassName = ['font-bold', textSizeStyles[size], textVariantStyles[variant]].join(' ');

  return (
    <TouchableOpacity
      className={buttonClassName}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.8}
    >
      {children || (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-2">{icon}</View>}
          {title && <Text className={textClassName}>{title}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Export both names for convenience and clarity
export const Button = CustomButton;

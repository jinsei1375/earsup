// components/common/AnimatedButton.tsx
import React, { useEffect } from 'react';
import { TouchableOpacity, Text, View, Animated } from 'react-native';
import { useUIAnimations } from '@/hooks/useAnimations';

interface AnimatedButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'correct' | 'partial';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  animateOnMount?: boolean;
  delay?: number;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  className = '',
  icon,
  children,
  animateOnMount = false,
  delay = 0,
}) => {
  const { scale, fade, slide, pressAnimation, enterFromBottom } = useUIAnimations();

  useEffect(() => {
    if (animateOnMount) {
      setTimeout(() => {
        enterFromBottom().start();
      }, delay);
    } else {
      fade.fadeIn(0).start();
    }
  }, [animateOnMount, delay]);

  const handlePress = () => {
    if (!disabled) {
      pressAnimation().start();
      onPress();
    }
  };

  // Enhanced styling with modern gradients and shadows
  const baseButtonStyle = 'rounded-2xl border-2 items-center justify-center';

  const sizeStyles = {
    small: 'px-4 py-3',
    medium: 'px-6 py-4',
    large: 'px-8 py-5',
  };

  const variantStyles = {
    primary: disabled
      ? 'bg-gray-300 border-gray-300'
      : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 border-blue-500 shadow-xl shadow-blue-500/30',
    secondary: disabled
      ? 'bg-gray-300 border-gray-300'
      : 'bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 border-gray-300 shadow-xl',
    danger: disabled
      ? 'bg-gray-300 border-gray-300'
      : 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 border-red-500 shadow-xl shadow-red-500/30',
    outline: disabled
      ? 'bg-transparent border-gray-300'
      : 'bg-transparent border-blue-500 shadow-lg',
    ghost: disabled
      ? 'bg-transparent border-transparent'
      : 'bg-transparent border-transparent',
    correct: disabled
      ? 'bg-green-300 border-green-300'
      : 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 border-green-500 shadow-xl shadow-green-500/30',
    partial: disabled
      ? 'bg-orange-300 border-orange-300'
      : 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 border-orange-500 shadow-xl shadow-orange-500/30',
  };

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
    correct: disabled ? 'text-gray-500' : 'text-white',
    partial: disabled ? 'text-gray-500' : 'text-white',
  };

  const buttonClassName = [
    baseButtonStyle,
    sizeStyles[size],
    variantStyles[variant],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  const textClassName = ['font-bold tracking-wide', textSizeStyles[size], textVariantStyles[variant]].join(' ');

  return (
    <Animated.View
      style={{
        opacity: fade.fadeValue,
        transform: [
          { scale: scale.scaleValue },
          { translateY: animateOnMount ? slide.slideValue : 0 }
        ],
      }}
    >
      <TouchableOpacity
        className={buttonClassName}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.9}
      >
        {children || (
          <View className="flex-row items-center justify-center">
            {icon && <View className="mr-3">{icon}</View>}
            {title && <Text className={textClassName}>{title}</Text>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
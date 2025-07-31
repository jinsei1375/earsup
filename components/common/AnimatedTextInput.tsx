// components/common/AnimatedTextInput.tsx
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { TextInput, View, Text, Animated, TextInputProps } from 'react-native';
import { useUIAnimations } from '@/hooks/useAnimations';

interface AnimatedTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
  variant?: 'default' | 'quiz' | 'modern';
  size?: 'small' | 'medium' | 'large';
  animateOnMount?: boolean;
  delay?: number;
}

export const AnimatedTextInput = forwardRef<TextInput, AnimatedTextInputProps>(({
  label,
  error,
  className = '',
  containerClassName = '',
  variant = 'default',
  size = 'medium',
  animateOnMount = false,
  delay = 0,
  onFocus,
  onBlur,
  value,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const { scale, fade, slide } = useUIAnimations();
  const borderColorValue = useRef(new Animated.Value(0)).current;
  const labelPositionValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    if (animateOnMount) {
      setTimeout(() => {
        Animated.parallel([
          fade.fadeIn(400),
          slide.slideIn(400),
        ]).start();
      }, delay);
    } else {
      fade.fadeIn(0).start();
    }
  }, [animateOnMount, delay]);

  useEffect(() => {
    // Animate label position based on focus or value
    Animated.timing(labelPositionValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  useEffect(() => {
    // Animate border color based on focus and error state
    Animated.timing(borderColorValue, {
      toValue: error ? 2 : isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, error]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    scale.scaleIn(1.02, 150).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    scale.scaleOut(1, 150).start();
    onBlur?.(e);
  };

  const sizeStyles = {
    small: {
      container: 'p-3',
      text: 'text-sm',
      label: 'text-xs',
    },
    medium: {
      container: 'p-4',
      text: 'text-base',
      label: 'text-sm',
    },
    large: {
      container: 'p-5',
      text: 'text-xl',
      label: 'text-base',
    },
  };

  const variantStyles = {
    default: 'rounded-lg bg-white shadow-sm',
    quiz: 'rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg',
    modern: 'rounded-2xl bg-white shadow-xl border-0',
  };

  const { container, text, label: labelSize } = sizeStyles[size];

  const borderColor = borderColorValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['rgb(209, 213, 219)', 'rgb(59, 130, 246)', 'rgb(239, 68, 68)'], // gray-300, blue-500, red-500
  });

  const backgroundColor = borderColorValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['rgba(255, 255, 255, 1)', 'rgba(239, 246, 255, 1)', 'rgba(254, 242, 242, 1)'], // white, blue-50, red-50
  });

  return (
    <Animated.View
      className={`${containerClassName}`}
      style={{
        opacity: fade.fadeValue,
        transform: [
          { scale: scale.scaleValue },
          { translateY: animateOnMount ? slide.slideValue : 0 }
        ],
      }}
    >
      <View className="relative">
        {label && (
          <Animated.Text
            className={`absolute left-3 ${labelSize} font-medium text-gray-600 bg-white px-1 z-10`}
            style={{
              top: labelPositionValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, -8],
              }),
              color: error 
                ? 'rgb(239, 68, 68)' 
                : isFocused 
                  ? 'rgb(59, 130, 246)' 
                  : 'rgb(107, 114, 128)',
            }}
          >
            {label}
          </Animated.Text>
        )}
        
        <Animated.View
          className={`${variantStyles[variant]} border-2`}
          style={{
            borderColor,
            backgroundColor: variant === 'default' ? backgroundColor : undefined,
          }}
        >
          <TextInput
            ref={ref}
            className={`${container} ${text} ${className}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            placeholderTextColor="rgb(156, 163, 175)"
            {...props}
          />
        </Animated.View>
        
        {error && (
          <Animated.Text 
            className="text-red-500 text-sm mt-1 ml-3"
            style={{ opacity: fade.fadeValue }}
          >
            {error}
          </Animated.Text>
        )}
      </View>
    </Animated.View>
  );
});
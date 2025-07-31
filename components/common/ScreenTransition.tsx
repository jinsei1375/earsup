// components/common/ScreenTransition.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { useUIAnimations } from '@/hooks/useAnimations';

interface ScreenTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  type?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'slide-right' | 'slide-left';
  duration?: number;
  delay?: number;
  className?: string;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  isVisible,
  type = 'fade',
  duration = 400,
  delay = 0,
  className = '',
}) => {
  const { fade, slide } = useUIAnimations();
  const slideXValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        switch (type) {
          case 'fade':
            fade.fadeIn(duration).start();
            break;
          case 'slide-up':
            Animated.parallel([
              fade.fadeIn(duration),
              Animated.timing(slide.slideValue, {
                toValue: 0,
                duration,
                useNativeDriver: true,
              }),
            ]).start();
            break;
          case 'slide-down':
            Animated.parallel([
              fade.fadeIn(duration),
              Animated.timing(slide.slideValue, {
                toValue: 0,
                duration,
                useNativeDriver: true,
              }),
            ]).start();
            break;
          case 'slide-right':
            Animated.parallel([
              fade.fadeIn(duration),
              Animated.timing(slideXValue, {
                toValue: 0,
                duration,
                useNativeDriver: true,
              }),
            ]).start();
            break;
          case 'slide-left':
            Animated.parallel([
              fade.fadeIn(duration),
              Animated.timing(slideXValue, {
                toValue: 0,
                duration,
                useNativeDriver: true,
              }),
            ]).start();
            break;
          case 'scale':
            Animated.parallel([
              fade.fadeIn(duration),
              Animated.timing(scaleValue, {
                toValue: 1,
                duration,
                useNativeDriver: true,
              }),
            ]).start();
            break;
        }
      }, delay);
    } else {
      // Reset values when not visible
      fade.fadeValue.setValue(0);
      switch (type) {
        case 'slide-up':
          slide.slideValue.setValue(height * 0.3);
          break;
        case 'slide-down':
          slide.slideValue.setValue(-height * 0.3);
          break;
        case 'slide-right':
          slideXValue.setValue(-width * 0.3);
          break;
        case 'slide-left':
          slideXValue.setValue(width * 0.3);
          break;
        case 'scale':
          scaleValue.setValue(0.8);
          break;
      }
    }
  }, [isVisible, type, duration, delay]);

  const getTransform = () => {
    const transform: any[] = [];
    
    switch (type) {
      case 'slide-up':
      case 'slide-down':
        transform.push({ translateY: slide.slideValue });
        break;
      case 'slide-right':
      case 'slide-left':
        transform.push({ translateX: slideXValue });
        break;
      case 'scale':
        transform.push({ scale: scaleValue });
        break;
    }
    
    return transform;
  };

  return (
    <Animated.View
      className={`flex-1 ${className}`}
      style={{
        opacity: fade.fadeValue,
        transform: getTransform(),
      }}
    >
      {children}
    </Animated.View>
  );
};
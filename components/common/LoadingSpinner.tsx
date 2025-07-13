// components/common/LoadingSpinner.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
  variant?: 'default' | 'pulse' | 'dots' | 'sound-wave';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'small',
  color = '#3B82F6', // Blue-500
  className = 'mt-4',
  variant = 'default',
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0.3)).current;
  const wave2 = useRef(new Animated.Value(0.3)).current;
  const wave3 = useRef(new Animated.Value(0.3)).current;
  const wave4 = useRef(new Animated.Value(0.3)).current;

  const spinnerSize = size === 'large' ? 40 : 24;
  const dotSize = size === 'large' ? 8 : 6;

  useEffect(() => {
    if (variant === 'default') {
      // 回転アニメーション
      const spin = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    } else if (variant === 'pulse') {
      // パルスアニメーション
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.3,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else if (variant === 'dots') {
      // ドットアニメーション
      const createDotAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        );
      };

      const dotAnimations = Animated.parallel([
        createDotAnimation(dot1, 0),
        createDotAnimation(dot2, 200),
        createDotAnimation(dot3, 400),
      ]);
      dotAnimations.start();
      return () => dotAnimations.stop();
    } else if (variant === 'sound-wave') {
      // 音波アニメーション
      const createWaveAnimation = (wave: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(wave, {
              toValue: 1,
              duration: 500,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(wave, {
              toValue: 0.3,
              duration: 500,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        );
      };

      const waveAnimations = Animated.parallel([
        createWaveAnimation(wave1, 0),
        createWaveAnimation(wave2, 150),
        createWaveAnimation(wave3, 300),
        createWaveAnimation(wave4, 450),
      ]);
      waveAnimations.start();
      return () => waveAnimations.stop();
    }
  }, [variant]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (variant === 'dots') {
    return (
      <View className={`flex-row items-center justify-center ${className}`}>
        {[dot1, dot2, dot3].map((dot, index) => (
          <Animated.View
            key={index}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              marginHorizontal: 2,
              opacity: dot,
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
    );
  }

  if (variant === 'sound-wave') {
    return (
      <View
        className={`flex-row items-end justify-center ${className}`}
        style={{ height: spinnerSize }}
      >
        {[wave1, wave2, wave3, wave4].map((wave, index) => (
          <Animated.View
            key={index}
            style={{
              width: size === 'large' ? 4 : 3,
              backgroundColor: color,
              marginHorizontal: 1,
              borderRadius: 2,
              height: wave.interpolate({
                inputRange: [0.3, 1],
                outputRange: [spinnerSize * 0.3, spinnerSize],
              }),
            }}
          />
        ))}
      </View>
    );
  }

  if (variant === 'pulse') {
    return (
      <View className={`items-center justify-center ${className}`}>
        <Animated.View
          style={{
            width: spinnerSize,
            height: spinnerSize,
            borderRadius: spinnerSize / 2,
            backgroundColor: color,
            transform: [{ scale: pulseValue }],
            opacity: pulseValue.interpolate({
              inputRange: [1, 1.3],
              outputRange: [0.8, 0.4],
            }),
          }}
        />
      </View>
    );
  }

  // Default variant - modern spinning ring
  return (
    <View className={`items-center justify-center ${className}`}>
      <Animated.View
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderRadius: spinnerSize / 2,
          borderWidth: size === 'large' ? 3 : 2,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: `${color}40`, // 25% opacity
          transform: [{ rotate: spin }],
        }}
      />
    </View>
  );
};

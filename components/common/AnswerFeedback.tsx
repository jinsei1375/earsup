// components/common/AnswerFeedback.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';

interface AnswerFeedbackProps {
  isCorrect: boolean | null;
  isVisible: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({
  isCorrect,
  isVisible,
  className = '',
  size = 'medium',
}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const shakeValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isVisible || isCorrect === null) {
      // フィードバックを非表示にする
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (isCorrect) {
      // 正解アニメーション：スケールアップ + パルス
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.2,
            duration: 200,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // パルスエフェクト
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseValue, {
              toValue: 1.1,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(pulseValue, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ),
      ]).start();
    } else {
      // 不正解アニメーション：シェイク + 点滅
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // シェイクアニメーション
        Animated.sequence([
          Animated.timing(shakeValue, {
            toValue: 10,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: -10,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: 8,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: -8,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isVisible, isCorrect]);

  if (!isVisible || isCorrect === null) {
    return null;
  }

  const sizeStyles = {
    small: { iconSize: 48, fontSize: 16 },
    medium: { iconSize: 64, fontSize: 20 },
    large: { iconSize: 80, fontSize: 24 },
  };

  const { iconSize, fontSize } = sizeStyles[size];

  const getIcon = () => {
    if (isCorrect) {
      return '🎉';
    } else {
      return '❌';
    }
  };

  const getText = () => {
    if (isCorrect) {
      return '正解！';
    } else {
      return '不正解';
    }
  };

  const getBackgroundColor = () => {
    if (isCorrect) {
      return 'bg-green-100 border-green-200';
    } else {
      return 'bg-red-100 border-red-200';
    }
  };

  const getTextColor = () => {
    if (isCorrect) {
      return 'text-green-800';
    } else {
      return 'text-red-800';
    }
  };

  return (
    <Animated.View
      className={`items-center justify-center p-6 rounded-2xl border-2 ${getBackgroundColor()} ${className}`}
      style={{
        opacity: fadeValue,
        transform: [
          { scale: scaleValue },
          { scale: isCorrect ? pulseValue : 1 },
          { translateX: shakeValue },
        ],
      }}
    >
      <Text style={{ fontSize: iconSize * 0.7 }}>{getIcon()}</Text>
      <Text className={`font-bold mt-2 ${getTextColor()}`} style={{ fontSize }}>
        {getText()}
      </Text>
    </Animated.View>
  );
};
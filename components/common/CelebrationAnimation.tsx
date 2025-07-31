// components/common/CelebrationAnimation.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

interface ParticleProps {
  delay: number;
  color: string;
  size: number;
}

const Particle: React.FC<ParticleProps> = ({ delay, color, size }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const { width } = Dimensions.get('window');
    const randomX = (Math.random() - 0.5) * width * 0.8;
    
    setTimeout(() => {
      Animated.parallel([
        // 上に移動
        Animated.timing(translateY, {
          toValue: -200,
          duration: 2000,
          useNativeDriver: true,
        }),
        // ランダムな横移動
        Animated.timing(translateX, {
          toValue: randomX,
          duration: 2000,
          useNativeDriver: true,
        }),
        // フェードイン -> フェードアウト
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        // スケールアニメーション
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
          Animated.timing(scale, {
            toValue: 0.5,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, delay);
  }, [delay]);

  return (
    <Animated.View
      className="absolute"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
        transform: [
          { translateX },
          { translateY },
          { scale },
        ],
        opacity,
      }}
    />
  );
};

interface CelebrationAnimationProps {
  isVisible: boolean;
  type?: 'confetti' | 'stars' | 'fireworks';
  duration?: number;
  onComplete?: () => void;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  isVisible,
  type = 'confetti',
  duration = 3000,
  onComplete,
}) => {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  const getParticles = () => {
    const particles = [];
    const particleCount = type === 'fireworks' ? 20 : type === 'stars' ? 15 : 25;
    
    for (let i = 0; i < particleCount; i++) {
      const delay = i * 100 + Math.random() * 500;
      const colors = type === 'stars' 
        ? ['#FFD700', '#FFA500', '#FF6347', '#FFB6C1'] 
        : type === 'fireworks'
        ? ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF']
        : ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = type === 'stars' ? 8 + Math.random() * 8 : 6 + Math.random() * 10;
      
      particles.push(
        <Particle
          key={i}
          delay={delay}
          color={color}
          size={size}
        />
      );
    }
    return particles;
  };

  return (
    <View 
      ref={containerRef}
      className="absolute inset-0 items-center justify-center pointer-events-none"
      style={{ zIndex: 1000 }}
    >
      {getParticles()}
    </View>
  );
};
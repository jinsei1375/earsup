// hooks/useAnimations.ts
import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

export const useScaleAnimation = (initialValue = 1) => {
  const scaleValue = useRef(new Animated.Value(initialValue)).current;

  const scaleIn = useCallback((toValue = 1.05, duration = 200) => {
    return Animated.timing(scaleValue, {
      toValue,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
  }, [scaleValue]);

  const scaleOut = useCallback((toValue = 1, duration = 200) => {
    return Animated.timing(scaleValue, {
      toValue,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
  }, [scaleValue]);

  const bounce = useCallback(() => {
    return Animated.sequence([
      scaleIn(1.1, 150),
      scaleOut(1, 150),
    ]);
  }, [scaleIn, scaleOut]);

  return {
    scaleValue,
    scaleIn,
    scaleOut,
    bounce,
  };
};

export const useFadeAnimation = (initialValue = 0) => {
  const fadeValue = useRef(new Animated.Value(initialValue)).current;

  const fadeIn = useCallback((duration = 300) => {
    return Animated.timing(fadeValue, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
  }, [fadeValue]);

  const fadeOut = useCallback((duration = 300) => {
    return Animated.timing(fadeValue, {
      toValue: 0,
      duration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
  }, [fadeValue]);

  return {
    fadeValue,
    fadeIn,
    fadeOut,
  };
};

export const useSlideAnimation = (initialValue = -100) => {
  const slideValue = useRef(new Animated.Value(initialValue)).current;

  const slideIn = useCallback((duration = 400) => {
    return Animated.timing(slideValue, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    });
  }, [slideValue]);

  const slideOut = useCallback((toValue = -100, duration = 300) => {
    return Animated.timing(slideValue, {
      toValue,
      duration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
  }, [slideValue]);

  return {
    slideValue,
    slideIn,
    slideOut,
  };
};

export const useRotateAnimation = (initialValue = 0) => {
  const rotateValue = useRef(new Animated.Value(initialValue)).current;

  const rotate = useCallback((duration = 1000) => {
    return Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
  }, [rotateValue]);

  const rotateInterpolate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return {
    rotateValue,
    rotate,
    rotateInterpolate,
  };
};

// Combined animation hook for common UI patterns
export const useUIAnimations = () => {
  const scale = useScaleAnimation();
  const fade = useFadeAnimation();
  const slide = useSlideAnimation();

  const enterFromBottom = useCallback(() => {
    return Animated.parallel([
      fade.fadeIn(400),
      slide.slideIn(400),
    ]);
  }, [fade, slide]);

  const exitToBottom = useCallback(() => {
    return Animated.parallel([
      fade.fadeOut(300),
      slide.slideOut(-100, 300),
    ]);
  }, [fade, slide]);

  const pressAnimation = useCallback(() => {
    return Animated.sequence([
      scale.scaleIn(0.95, 100),
      scale.scaleOut(1, 100),
    ]);
  }, [scale]);

  return {
    scale,
    fade,
    slide,
    enterFromBottom,
    exitToBottom,
    pressAnimation,
  };
};
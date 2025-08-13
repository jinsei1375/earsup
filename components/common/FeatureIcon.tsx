import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FeatureIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  className?: string;
}

export const FeatureIcon: React.FC<FeatureIconProps> = ({
  name,
  size = 24,
  color = '#3B82F6',
  backgroundColor,
  borderRadius = 'medium',
  className = '',
}) => {
  const radiusStyles = {
    none: '',
    small: 'rounded-sm',
    medium: 'rounded-lg', 
    large: 'rounded-xl',
    full: 'rounded-full',
  };

  const containerSize = size + 16; // アイコンサイズ + パディング

  if (backgroundColor) {
    return (
      <View 
        className={`items-center justify-center ${radiusStyles[borderRadius]} ${className}`}
        style={{ 
          width: containerSize, 
          height: containerSize,
          backgroundColor: backgroundColor + '20' // 20% opacity
        }}
      >
        <Ionicons name={name} size={size} color={color} />
      </View>
    );
  }

  return <Ionicons name={name} size={size} color={color} />;
};

// アプリで使用する共通カラー
export const APP_COLORS = {
  primary: '#3B82F6',    // Blue
  success: '#10B981',    // Green  
  warning: '#F59E0B',    // Amber
  danger: '#EF4444',     // Red
  info: '#6366F1',       // Indigo
  secondary: '#6B7280',  // Gray
};

// 絵文字からアイコンへのマッピング（参考用）
export const COMMON_ICONS = {
  // 音声・メディア関連
  volume: 'volume-high',
  mic: 'mic',
  headset: 'headset',
  speaker: 'volume-medium',
  
  // UI操作関連
  play: 'play',
  pause: 'pause',
  stop: 'stop',
  refresh: 'refresh',
  close: 'close',
  
  // 状態・通知関連
  warning: 'warning',
  error: 'alert-circle',
  success: 'checkmark-circle',
  info: 'information-circle',
  
  // 人・グループ関連
  person: 'person',
  people: 'people',
  
  // 機能・ツール関連
  settings: 'settings',
  create: 'create',
  build: 'build',
  trophy: 'trophy',
  rocket: 'rocket',
  flash: 'flash',
  bulb: 'bulb',
  heart: 'heart',
  flame: 'flame',
  
  // 答え・反応関連
  thumbsUp: 'thumbs-up',
  thumbsDown: 'thumbs-down',
  helpCircle: 'help-circle',
  sad: 'sad',
  happy: 'happy',
  
  // その他
  target: 'radio-button-on',
  location: 'location',
} as const;

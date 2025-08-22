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
          backgroundColor: backgroundColor + '20', // 20% opacity
        }}
      >
        <Ionicons name={name} size={size} color={color} />
      </View>
    );
  }

  return <Ionicons name={name} size={size} color={color} />;
};

// アプリで使用する共通カラー（Tailwindカスタムカラーと同期）
export const APP_COLORS = {
  // プライマリカラー
  primary: '#3B82F6', // app-primary
  primaryLight: '#DBEAFE', // app-primary-light
  primaryDark: '#1E40AF', // app-primary-dark

  // 成功・正解
  success: '#10B981', // app-success
  successLight: '#D1FAE5', // app-success-light
  successDark: '#059669', // app-success-dark

  // 警告・惜しい
  warning: '#F59E0B', // app-warning
  warningLight: '#FEF3C7', // app-warning-light
  warningDark: '#D97706', // app-warning-dark

  // 危険・エラー・不正解
  danger: '#EF4444', // app-danger
  dangerLight: '#FEE2E2', // app-danger-light
  dangerDark: '#DC2626', // app-danger-dark

  // 情報・セカンダリ
  info: '#6366F1', // app-info
  infoLight: '#E0E7FF', // app-info-light
  infoDark: '#4338CA', // app-info-dark

  // パープル（ホストなしモード用）
  purple: '#8B5CF6', // app-purple
  purpleLight: '#EDE9FE', // app-purple-light
  purpleDark: '#7C3AED', // app-purple-dark

  // オレンジ（クイックスタート用）
  orange: '#F97316', // app-orange
  orangeLight: '#FED7AA', // app-orange-light
  orangeDark: '#EA580C', // app-orange-dark

  // イエロー（ランキング等）
  yellow: '#EAB308', // app-yellow
  yellowLight: '#FEF3C7', // app-yellow-light
  yellowDark: '#CA8A04', // app-yellow-dark

  // グレースケール（Tailwindデフォルトを使用）
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // その他
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
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

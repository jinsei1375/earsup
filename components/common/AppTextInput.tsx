// components/common/AppTextInput.tsx
import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

interface AppTextInputProps extends TextInputProps {
  // 追加のプロパティがあれば定義
}

/**
 * アプリ全体で統一されたスタイルのTextInput
 * プレースホルダーの色を見やすく設定
 */
export const AppTextInput = React.forwardRef<TextInput, AppTextInputProps>((props, ref) => {
  const { className, ...restProps } = props;

  return (
    <TextInput
      ref={ref}
      className={`border border-gray-300 rounded-lg p-3 ${className || ''}`}
      placeholderTextColor="#9CA3AF" // Gray-400 - 実機でも見やすい中間的な色
      {...restProps}
    />
  );
});

AppTextInput.displayName = 'AppTextInput';

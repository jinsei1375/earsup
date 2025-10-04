import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './common/Button';

export interface SettingsConfig {
  showSettings?: boolean;
  onSettingsPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onAddPress?: () => void;
  addButtonTitle?: string;
}

type AppHeaderProps = {
  title: string;
  rightComponent?: React.ReactNode;
  settingsConfig?: SettingsConfig;
};

export default function AppHeader({ title, rightComponent, settingsConfig }: AppHeaderProps) {
  const {
    showSettings = false,
    onSettingsPress,
    showBackButton = false,
    onBackPress,
    onAddPress,
    addButtonTitle = '追加',
  } = settingsConfig || {};

  return (
    <View className="h-[50px] flex-row items-center px-4 border-b border-gray-200 bg-white w-full relative">
      {/* Left side - Back button */}
      <View className="w-[60px] items-start">
        {showBackButton && onBackPress ? (
          <TouchableOpacity onPress={onBackPress} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center title with absolute positioning for perfect centering */}
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-lg font-bold">{title}</Text>
      </View>

      {/* Spacer to push right component */}
      <View className="flex-1" />

      {/* Right component, add button, or settings */}
      <View className="w-[60px] items-end">
        {rightComponent ||
          (showSettings && onSettingsPress ? (
            <Button
              variant="ghost"
              size="small"
              onPress={onSettingsPress}
              icon={<Ionicons name="menu" size={32} color="#666" />}
            />
          ) : null)}
      </View>
    </View>
  );
}

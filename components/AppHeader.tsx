import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './common/Button';

export interface SettingsConfig {
  showSettings?: boolean;
  onSettingsPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showAddButton?: boolean;
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
    showAddButton = false,
    onAddPress,
    addButtonTitle = '追加',
  } = settingsConfig || {};

  return (
    <View className="h-[60px] flex-row items-center px-4 border-b border-gray-200 bg-white w-full relative">
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
          (showAddButton && onAddPress ? (
            <Button
              title={addButtonTitle}
              onPress={onAddPress}
              variant="primary"
              size="small"
              icon={<Ionicons name="add" size={20} color="white" />}
            />
          ) : showSettings && onSettingsPress ? (
            <Button
              variant="ghost"
              size="small"
              onPress={onSettingsPress}
              icon={<Ionicons name="settings-outline" size={24} color="#666" />}
            />
          ) : null)}
      </View>
    </View>
  );
}

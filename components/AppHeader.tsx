import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './common/Button';

export interface SettingsConfig {
  showSettings?: boolean;
  onSettingsPress?: () => void;
}

type AppHeaderProps = {
  title: string;
  rightComponent?: React.ReactNode;
  settingsConfig?: SettingsConfig;
};

export default function AppHeader({ title, rightComponent, settingsConfig }: AppHeaderProps) {
  const { showSettings = false, onSettingsPress } = settingsConfig || {};

  return (
    <View className="h-[60px] flex-row items-center px-4 border-b border-gray-200 bg-white w-full relative">
      {/* Center title with absolute positioning for perfect centering */}
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-lg font-bold">{title}</Text>
      </View>

      {/* Left spacer for symmetry */}
      <View className="w-[60px]" />

      {/* Spacer to push right component */}
      <View className="flex-1" />

      {/* Right component or settings */}
      <View className="w-[60px] items-end">
        {rightComponent ||
          (showSettings && onSettingsPress ? (
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

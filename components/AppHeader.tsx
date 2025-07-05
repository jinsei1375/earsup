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
    <View className="h-[60px] flex-row items-center justify-between px-4 border-b border-gray-200 bg-white w-full">
      <View className="w-[60px] items-start">{/* バックボタンは削除 */}</View>

      <Text className="text-lg font-bold flex-1 text-center">{title}</Text>

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

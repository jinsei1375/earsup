import { View, Text } from 'react-native';

type AppHeaderProps = {
  title: string;
  rightComponent?: React.ReactNode;
};

export default function AppHeader({ title, rightComponent }: AppHeaderProps) {
  return (
    <View className="h-[60px] flex-row items-center justify-between px-4 border-b border-gray-200 bg-white w-full">
      <View className="w-[60px] items-start">{/* バックボタンは削除 */}</View>

      <Text className="text-lg font-bold flex-1 text-center">{title}</Text>

      <View className="w-[60px] items-end">{rightComponent}</View>
    </View>
  );
}

// NativeWindを使用するためスタイルシートは削除しました

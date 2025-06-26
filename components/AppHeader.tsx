import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type AppHeaderProps = {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
};

export default function AppHeader({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
}: AppHeaderProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View className="h-[60px] flex-row items-center justify-between px-4 border-b border-gray-200 bg-white w-full">
      <View className="w-[60px] items-start">
        {showBackButton && (
          <TouchableOpacity onPress={handleBackPress} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-lg font-bold flex-1 text-center">{title}</Text>

      <View className="w-[60px] items-end">{rightComponent}</View>
    </View>
  );
}

// NativeWindを使用するためスタイルシートは削除しました

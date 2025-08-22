// components/quiz/StampSelector.tsx
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';

interface StampSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectStamp: (stamp: { type: string; x: number; y: number }) => void;
  loading?: boolean;
  stamps?: { type: string; icon: string; text: string; color: string }[]; // DBから取得した場合
}

// デフォルトのアイコンスタンプ
export const AVAILABLE_STAMPS = [
  { type: 'amazing', icon: 'heart', text: 'すごい！', color: APP_COLORS.danger },
  { type: 'frustrated', icon: 'sad', text: '悔しい！', color: APP_COLORS.warning },
  { type: 'thumbs_up', icon: 'thumbs-up', text: 'いいね！', color: APP_COLORS.success },
  { type: 'thinking', icon: 'help-circle', text: '難しい...', color: APP_COLORS.info },
  { type: 'surprised', icon: 'alert-circle', text: 'びっくり！', color: APP_COLORS.warning },
  { type: 'heart', icon: 'heart', text: 'すき！', color: APP_COLORS.danger },
];

export const StampSelector: React.FC<StampSelectorProps> = ({
  visible,
  onClose,
  onSelectStamp,
  loading = false,
  // stamps,
}) => {
  // ランダム座標生成（画面サイズに応じて調整）
  const getRandomPosition = () => {
    const x = Math.floor(Math.random() * 240) + 40; // left: 40~280px
    const y = Math.floor(Math.random() * 320) + 80; // top: 80~400px
    return { x, y };
  };

  const handleStampSelect = (stampType: string) => {
    const pos = getRandomPosition();
    onSelectStamp({ type: stampType, ...pos });
    onClose();
  };

  // 常にデフォルト絵文字のみ表示
  // const displayStamps = stamps && stamps.length > 0 ? stamps : AVAILABLE_STAMPS;
  const displayStamps = AVAILABLE_STAMPS;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">スタンプを選択</Text>
            <TouchableOpacity onPress={onClose}>
              <FeatureIcon name="close" size={20} color={APP_COLORS.gray600} />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
            style={{ maxHeight: 320 }}
          >
            {displayStamps.map((stamp) => (
              <TouchableOpacity
                key={stamp.type}
                onPress={() => handleStampSelect(stamp.type)}
                disabled={loading}
                className="bg-app-neutral-100 rounded-xl p-3 items-center min-w-24 mr-2 mb-2"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                <FeatureIcon
                  name={stamp.icon as any}
                  size={24}
                  color={stamp.color}
                  backgroundColor={stamp.color}
                  borderRadius="small"
                  className="mb-2"
                />
                <Text className="text-xs text-center font-medium">{stamp.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

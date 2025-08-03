// components/common/InfoModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function InfoModal({ visible, onClose }: InfoModalProps) {
  const router = useRouter();

  const handleTermsPress = () => {
    onClose();
    router.push('/terms' as any);
  };

  const handlePrivacyPress = () => {
    onClose();
    router.push('/privacy' as any);
  };

  const handleContactPress = () => {
    Alert.alert('お問い合わせ', 'お問い合わせは以下のリンクからお願いします。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'お問い合わせページを開く',
        onPress: () => {
          // TODO: NotionのURLに置き換える
          const notionUrl = 'https://notion.so/your-contact-page';
          Linking.openURL(notionUrl).catch(() => {
            Alert.alert('エラー', 'お問い合わせページを開けませんでした。');
          });
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-lg p-6 mx-6 w-80 max-w-sm">
          <Text className="text-lg font-bold mb-6 text-center">アプリ情報</Text>

          <TouchableOpacity className="py-4 border-b border-gray-200" onPress={handleTermsPress}>
            <Text className="text-base text-blue-600 text-center">利用規約</Text>
          </TouchableOpacity>

          <TouchableOpacity className="py-4 border-b border-gray-200" onPress={handlePrivacyPress}>
            <Text className="text-base text-blue-600 text-center">プライバシーポリシー</Text>
          </TouchableOpacity>

          <TouchableOpacity className="py-4 border-b border-gray-200" onPress={handleContactPress}>
            <Text className="text-base text-blue-600 text-center">お問い合わせ</Text>
          </TouchableOpacity>

          <TouchableOpacity className="py-4 mt-4" onPress={onClose}>
            <Text className="text-base text-gray-500 text-center">閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

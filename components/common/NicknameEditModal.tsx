// components/common/NicknameEditModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';

interface NicknameEditModalProps {
  visible: boolean;
  onClose: () => void;
  currentNickname: string;
  onNicknameUpdate: (newNickname: string) => void;
}

export default function NicknameEditModal({
  visible,
  onClose,
  currentNickname,
  onNicknameUpdate,
}: NicknameEditModalProps) {
  const [newNickname, setNewNickname] = useState(currentNickname);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useUserStore((s) => s.userId);
  const setUserInfo = useUserStore((s) => s.setUserInfo);

  const handleSave = async () => {
    const trimmedNickname = newNickname.trim();

    if (!trimmedNickname) {
      Alert.alert('エラー', 'ニックネームを入力してください');
      return;
    }

    if (trimmedNickname.length > 20) {
      Alert.alert('エラー', 'ニックネームは20文字以内で入力してください');
      return;
    }

    if (trimmedNickname === currentNickname) {
      onClose();
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ nickname: trimmedNickname })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // ストアと親コンポーネントの状態を更新
      setUserInfo(userId!, trimmedNickname);
      onNicknameUpdate(trimmedNickname);

      Alert.alert('成功', 'ニックネームを更新しました', [{ text: 'OK', onPress: onClose }]);
    } catch (error) {
      console.error('Error updating nickname:', error);
      Alert.alert('エラー', 'ニックネームの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewNickname(currentNickname);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4 text-center">ニックネーム変更</Text>

          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-2">新しいニックネーム</Text>
            <TextInput
              value={newNickname}
              onChangeText={setNewNickname}
              placeholder="ニックネームを入力"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              maxLength={20}
              autoFocus
              selectTextOnFocus
            />
            <Text className="text-xs text-gray-500 mt-1">{newNickname.length}/20文字</Text>
          </View>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-200 py-3 rounded-lg"
            >
              <Text className="text-gray-700 font-semibold text-center">キャンセル</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              className="flex-1 bg-blue-600 py-3 rounded-lg"
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold text-center">保存</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

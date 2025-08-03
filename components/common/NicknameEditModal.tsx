// components/common/NicknameEditModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';

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
  const { showSuccess, showError } = useToast();

  const handleSave = async () => {
    const trimmedNickname = newNickname.trim();

    if (!trimmedNickname) {
      showError('入力エラー', 'ニックネームを入力してください');
      return;
    }

    if (trimmedNickname.length > 20) {
      showError('入力エラー', 'ニックネームは20文字以内で入力してください');
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

      showSuccess('更新完了', 'ニックネームが正常に更新されました');
      onClose();
    } catch (error) {
      console.error('Error updating nickname:', error);
      showError('更新エラー', 'ニックネームの更新に失敗しました');
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
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View style={{ width: 32 }} />
            <Text className="text-xl font-bold text-gray-800">ニックネーム変更</Text>
            <Button
              onPress={handleCancel}
              variant="ghost"
              size="small"
              icon={<Ionicons name="close" size={24} color="#666" />}
            />
          </View>

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

          <View className="flex-row gap-3 mb-4">
            <Button
              title="キャンセル"
              onPress={handleCancel}
              variant="danger"
              size="large"
              fullWidth
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              title="保存"
              onPress={handleSave}
              variant="primary"
              size="large"
              fullWidth
              disabled={isLoading}
              className="flex-1"
            />
          </View>

          {isLoading && (
            <View className="items-center py-2">
              <LoadingSpinner variant="default" color="#3B82F6" size="small" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// components/common/SettingsModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentNickname: string;
  onNicknameChange: (newNickname: string) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  onClose,
  currentNickname,
  onNicknameChange,
}) => {
  const [nickname, setNickname] = useState(currentNickname);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError('ニックネームを入力してください');
      return;
    }

    if (nickname.trim() === currentNickname) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onNicknameChange(nickname.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'ニックネームの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNickname(currentNickname); // Reset to original value
    setError(null);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="bg-white rounded-lg p-6 w-full max-w-sm"
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold">設定</Text>
                <Button
                  onPress={handleClose}
                  variant="ghost"
                  size="small"
                  icon={<Ionicons name="close" size={24} color="#666" />}
                />
              </View>

              {/* Nickname Section */}
              <View className="mb-6">
                <Text className="text-lg font-semibold mb-3">ニックネーム変更</Text>
                <TextInput
                  className="border border-gray-300 p-3 rounded-lg text-lg"
                  placeholder="ニックネームを入力"
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={20}
                  autoFocus={true}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <Text className="text-sm text-gray-500 mt-2">現在: {currentNickname}</Text>
              </View>

              {/* Error Message */}
              {error && (
                <View className="bg-red-100 p-3 rounded-lg mb-4">
                  <Text className="text-red-700 text-center">{error}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row justify-center gap-4 mb-4">
                <Button
                  title="キャンセル"
                  onPress={handleClose}
                  variant="secondary"
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  title={loading ? '保存中...' : '保存'}
                  onPress={handleSave}
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                />
              </View>

              {/* Loading Spinner */}
              {loading && (
                <View className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <LoadingSpinner variant="default" color="#FFFFFF" size="large" />
                </View>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

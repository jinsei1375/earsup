// components/common/ExitRoomModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';

interface ExitRoomModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  isHost?: boolean;
}

export const ExitRoomModal: React.FC<ExitRoomModalProps> = ({
  isVisible,
  onClose,
  onConfirmExit,
  isHost = false,
}) => {
  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-lg p-6 w-full max-w-sm">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View style={{ width: 32 }} />
                <Text className="text-xl font-bold">ルーム退出</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View className="mb-6">
                <Text className="text-lg mb-3">
                  {isHost ? 'クイズを終了して' : ''}ルームから退出しますか？
                </Text>
                {isHost && (
                  <Text className="text-sm text-gray-600">
                    ホストが退出するとクイズが終了し、他の参加者もホーム画面に戻ります。
                  </Text>
                )}
                {!isHost && (
                  <Text className="text-sm text-gray-600">
                    途中退出するとクイズの結果は記録されません。
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mb-4">
                <Button
                  title="キャンセル"
                  onPress={onClose}
                  variant="secondary"
                  size="large"
                  fullWidth
                  className="flex-1"
                />
                <Button
                  title={isHost ? '終了' : '退出'}
                  onPress={onConfirmExit}
                  variant="danger"
                  size="large"
                  fullWidth
                  className="flex-1"
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

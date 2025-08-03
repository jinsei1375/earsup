// components/common/ConfirmationModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'destructive';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmVariant = 'primary',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-lg p-6 w-full max-w-sm">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="w-6" />
                <Text className="text-xl font-bold">{title}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View className="mb-6">
                <Text className="text-lg">{message}</Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-center gap-4 mb-4">
                <TouchableOpacity
                  onPress={onClose}
                  className="px-6 py-3 rounded-lg bg-gray-200 min-w-[100px]"
                >
                  <Text className="text-gray-700 font-semibold text-center">{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  className={`px-6 py-3 rounded-lg min-w-[100px] ${
                    confirmVariant === 'destructive' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                >
                  <Text className="text-white font-semibold text-center">{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
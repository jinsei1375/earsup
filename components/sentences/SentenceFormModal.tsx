// components/sentences/SentenceFormModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface SentenceFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (text: string, translation: string) => Promise<void>;
  initialText?: string;
  initialTranslation?: string;
  isEditing?: boolean;
}

export const SentenceFormModal: React.FC<SentenceFormModalProps> = ({
  isVisible,
  onClose,
  onSave,
  initialText = '',
  initialTranslation = '',
  isEditing = false,
}) => {
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setText(initialText);
      setTranslation(initialTranslation);
      setError(null);
    }
  }, [isVisible, initialText, initialTranslation]);

  const handleSave = async () => {
    if (!text.trim()) {
      setError('英語フレーズを入力してください');
      return;
    }

    if (!translation.trim()) {
      setError('日本語訳を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(text.trim(), translation.trim());
      // Success is handled by parent component
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setText('');
    setTranslation('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-center px-4 py-8">
            <View
              className="bg-white rounded-lg w-full"
              style={{ minHeight: '60%', maxHeight: '90%' }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Text className="text-xl font-bold">{isEditing ? '編集' : '追加'}</Text>
                <Button
                  onPress={handleClose}
                  variant="ghost"
                  size="small"
                  icon={<Ionicons name="close" size={24} color="#666" />}
                />
              </View>

              <ScrollView
                className="p-4"
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                {/* English Text Input */}
                <View className="mb-4">
                  <Text className="text-base font-medium mb-2">英語フレーズ *</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 text-lg"
                    style={{ minHeight: 100, textAlignVertical: 'top' }}
                    placeholder="例: How are you doing today?"
                    value={text}
                    onChangeText={setText}
                    multiline
                    numberOfLines={4}
                    autoFocus={!isEditing}
                  />
                </View>

                {/* Japanese Translation Input */}
                <View className="mb-6">
                  <Text className="text-base font-medium mb-2">日本語訳 *</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 text-lg"
                    style={{ minHeight: 100, textAlignVertical: 'top' }}
                    placeholder="例: 今日はどうですか？"
                    value={translation}
                    onChangeText={setTranslation}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 mb-4">
                  <Button
                    title="キャンセル"
                    onPress={handleClose}
                    variant="danger"
                    size="large"
                    fullWidth
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    title={isEditing ? '更新' : '登録'}
                    onPress={handleSave}
                    variant="primary"
                    size="large"
                    fullWidth
                    disabled={loading || !text.trim() || !translation.trim()}
                    className="flex-1"
                  />
                </View>

                {loading && (
                  <View className="items-center py-4">
                    <LoadingSpinner variant="default" color="#3B82F6" size="small" />
                  </View>
                )}

                <ErrorMessage message={error} />
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

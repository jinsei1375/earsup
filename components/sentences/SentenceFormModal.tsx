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
    } catch (err: any) {
      setError(err.message);
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
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-lg max-h-[90%]">
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Text className="text-xl font-bold">
                  {isEditing ? '例文を編集' : '例文を追加'}
                </Text>
                <Button
                  onPress={handleClose}
                  variant="ghost"
                  size="small"
                  icon={<Ionicons name="close" size={24} color="#666" />}
                />
              </View>

              <ScrollView
                className="flex-1 p-4"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
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
                    variant="outline"
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

                {/* Usage Tip */}
                <View className="bg-blue-50 rounded-lg p-3 mt-4">
                  <Text className="text-blue-800 font-medium mb-1">💡 使い方のヒント</Text>
                  <Text className="text-blue-700 text-sm leading-5">
                    • クイズで出題したい英語フレーズを入力{'\n'}
                    • 日本語訳も入力すると参加者にヒントとして表示{'\n'}
                    • 登録した例文はクイズ作成時に選択可能
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};
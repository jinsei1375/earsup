// components/quiz/QuestionCreator.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { SampleSentenceModal } from './SampleSentenceModal';

interface QuestionCreatorProps {
  onCreateQuestion: (text: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const QuestionCreator: React.FC<QuestionCreatorProps> = ({
  onCreateQuestion,
  loading,
  error,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [isSampleModalVisible, setIsSampleModalVisible] = useState(false);

  const handleSubmit = async () => {
    if (questionText.trim()) {
      await onCreateQuestion(questionText.trim());
      setQuestionText(''); // Clear after successful creation
    }
  };

  const handleSampleSentenceSelect = (sentence: string) => {
    setQuestionText(sentence);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="items-center">
            <Text className="text-xl font-bold mb-4">問題を作成</Text>
            <View className="w-full">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-base font-medium">英語フレーズ</Text>
                <Button
                  title="例文選択"
                  onPress={() => setIsSampleModalVisible(true)}
                  variant="outline"
                  size="small"
                />
              </View>
              <TextInput
                className="border border-gray-300 p-4 rounded-lg my-2 w-full h-[120px] text-lg"
                style={{ textAlignVertical: 'top' }}
                placeholder="英語フレーズを入力してください"
                value={questionText}
                onChangeText={setQuestionText}
                multiline
                numberOfLines={4}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              <Button
                title="この問題を出題する"
                onPress={handleSubmit}
                variant="primary"
                size="large"
                fullWidth
                disabled={!questionText.trim() || loading}
              />
            </View>
            {loading && <LoadingSpinner variant="dots" color="#3B82F6" />}
            <ErrorMessage message={error} />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      <SampleSentenceModal
        isVisible={isSampleModalVisible}
        onClose={() => setIsSampleModalVisible(false)}
        onSelectSentence={handleSampleSentenceSelect}
        hasCurrentText={!!questionText.trim()}
      />
    </KeyboardAvoidingView>
  );
};

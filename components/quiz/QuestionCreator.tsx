// components/quiz/QuestionCreator.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

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

  const handleSubmit = async () => {
    if (questionText.trim()) {
      await onCreateQuestion(questionText.trim());
      setQuestionText(''); // Clear after successful creation
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center">
            <Text className="text-xl font-bold mb-4">問題を作成</Text>
            <TextInput
              className="border border-gray-300 p-4 rounded-lg my-4 w-full h-[120px] text-lg"
              style={{ textAlignVertical: 'top' }}
              placeholder="英語フレーズを入力してください"
              value={questionText}
              onChangeText={setQuestionText}
              multiline
              numberOfLines={4}
              returnKeyType="done"
              blurOnSubmit={true}
            />
            <Button
              title="この問題を出題する"
              onPress={handleSubmit}
              disabled={!questionText.trim() || loading}
            />
            {loading && <LoadingSpinner />}
            <ErrorMessage message={error} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

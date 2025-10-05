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
import { WordSeparatePreview } from './WordSeparatePreview';
import { KeyboardAccessoryView } from '@/components/common/KeyboardAccessoryView';
import { AppTextInput } from '@/components/common/AppTextInput';

interface QuestionCreatorProps {
  onCreateQuestion: (text: string, sampleSentenceId?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  quizInputType?: 'sentence' | 'word_separate';
}

export const QuestionCreator: React.FC<QuestionCreatorProps> = ({
  onCreateQuestion,
  loading,
  error,
  quizInputType = 'sentence',
}) => {
  const [questionText, setQuestionText] = useState('');
  const [selectedSampleSentenceId, setSelectedSampleSentenceId] = useState<string | null>(null);
  const [isSampleModalVisible, setIsSampleModalVisible] = useState(false);

  // KeyboardAccessoryView用のID
  const inputAccessoryViewID = 'question-creator-accessory';

  const handleSubmit = async () => {
    if (questionText.trim()) {
      await onCreateQuestion(questionText.trim(), selectedSampleSentenceId || undefined);
      setQuestionText(''); // Clear after successful creation
      setSelectedSampleSentenceId(null); // Clear sample sentence ID
    }
  };

  const handleSampleSentenceSelect = (sentence: string, sampleSentenceId?: string) => {
    setQuestionText(sentence);
    setSelectedSampleSentenceId(sampleSentenceId || null);
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
              <AppTextInput
                className="p-4 my-2 w-full h-[120px] text-lg"
                style={{ textAlignVertical: 'top' }}
                placeholder="英語フレーズを入力してください"
                value={questionText}
                onChangeText={setQuestionText}
                multiline
                numberOfLines={4}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                inputAccessoryViewID={inputAccessoryViewID}
              />

              {/* 単語区切りモードの場合のプレビュー */}
              {quizInputType === 'word_separate' && <WordSeparatePreview text={questionText} />}

              <Button
                title="この問題を出題する"
                onPress={handleSubmit}
                variant="primary"
                size="large"
                fullWidth
                disabled={!questionText.trim() || loading}
                className="mt-4"
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

      <KeyboardAccessoryView
        nativeID={inputAccessoryViewID}
        showNavigation={false}
        onDone={() => Keyboard.dismiss()}
      />
    </KeyboardAvoidingView>
  );
};

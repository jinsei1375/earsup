import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Keyboard } from 'react-native';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';
import { Button } from '@/components/common/Button';
import { KeyboardAccessoryView } from '@/components/common/KeyboardAccessoryView';
import {
  parsesentence,
  getWordItems,
  ParsedItem,
  reconstructSentence,
} from '@/utils/wordParseUtils';

interface WordSeparateInputProps {
  questionText: string;
  disabled?: boolean;
  onSubmit: (answer: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const WordSeparateInput: React.FC<WordSeparateInputProps> = ({
  questionText,
  disabled = false,
  onSubmit,
  isSubmitting = false,
}) => {
  const parsedSentence = parsesentence(questionText);
  const wordItems = getWordItems(parsedSentence);

  const [userWords, setUserWords] = useState<string[]>(new Array(wordItems.length).fill(''));
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // KeyboardAccessoryView用のID
  const inputAccessoryViewID = 'word-separate-input-accessory';

  // ナビゲーション関数
  const handleNext = () => {
    if (currentIndex < wordItems.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      inputRefs.current[prevIndex]?.focus();
    }
  };

  const handleDone = () => {
    Keyboard.dismiss();
  };

  const updateWord = (index: number, value: string) => {
    const newWords = [...userWords];
    newWords[index] = value;
    setUserWords(newWords);
  };

  const handleWordFocus = (index: number) => {
    setCurrentIndex(index);
  };

  const handleWordSubmit = (index: number) => {
    if (index < wordItems.length - 1) {
      const nextIndex = index + 1;
      setCurrentIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async () => {
    // 単語を句読点と組み合わせて正しい文章を再構築
    const reconstructedAnswer = reconstructSentence(parsedSentence, userWords);
    await onSubmit(reconstructedAnswer);
  };

  const getWordWidth = (word: string, minWidth: number = 60) => {
    const calculatedWidth = Math.max(word.length * 12 + 24, minWidth);
    return Math.min(calculatedWidth, 150);
  };

  const getWordStyle = (index: number) => {
    const isFocused = currentIndex === index;
    const hasValue = userWords[index]?.length > 0;

    if (disabled) return 'border-app-neutral-300 bg-app-neutral-100';
    if (isFocused) return 'border-app-primary bg-white shadow-sm';
    if (hasValue) return 'border-app-success bg-app-success-light';
    return 'border-app-neutral-400 bg-white';
  };

  const filledCount = userWords.filter((word) => word.trim().length > 0).length;
  const canSubmit = filledCount > 0 && !disabled && !isSubmitting;

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-app-neutral-800">単語を入力してください</Text>
        <View className="flex-row items-center">
          <FeatureIcon name="create" size={20} color={APP_COLORS.gray600} />
          <Text className="ml-1 text-sm text-app-neutral-600">{wordItems.length}単語</Text>
        </View>
      </View>

      {/* 単語と句読点の表示 */}
      <View className="flex-row flex-wrap justify-center mb-6 items-baseline" style={{ gap: 4 }}>
        {parsedSentence.map((item, sentenceIndex) => {
          if (item.isPunctuation) {
            // アポストロフィ（半角・全角）は少し上に、その他の句読点は下部に
            const isApostrophe = /^['’]/.test(item.text);
            return (
              <Text
                key={`punct-${sentenceIndex}`}
                className={`text-2xl text-app-neutral-800 ${
                  isApostrophe ? 'self-start' : 'self-end'
                }`}
                style={{
                  lineHeight: isApostrophe ? 20 : 32,
                  marginTop: isApostrophe ? -8 : 0,
                  marginBottom: isApostrophe ? 0 : 4,
                  height: isApostrophe ? 20 : 'auto',
                }}
              >
                {item.text}
              </Text>
            );
          }

          const wordIndex = item.index;
          const word = item.text;

          return (
            <View key={`word-${wordIndex}`} className="mb-2">
              <TextInput
                ref={(ref) => {
                  inputRefs.current[wordIndex] = ref;
                }}
                value={userWords[wordIndex] || ''}
                onChangeText={(value) => updateWord(wordIndex, value)}
                onFocus={() => handleWordFocus(wordIndex)}
                onSubmitEditing={() => handleWordSubmit(wordIndex)}
                editable={!disabled && !isSubmitting}
                placeholder={`${wordIndex + 1}`}
                className={`text-center py-3 px-2 rounded-lg border-2 text-base font-medium text-app-neutral-800 ${getWordStyle(
                  wordIndex
                )}`}
                style={{
                  width: getWordWidth(word),
                  minHeight: 44,
                }}
                returnKeyType={wordIndex === wordItems.length - 1 ? 'done' : 'next'}
                autoCapitalize="none"
                autoCorrect={false}
                inputAccessoryViewID={inputAccessoryViewID}
              />
              <View className="items-center mt-1">
                <View
                  className="bg-app-neutral-300 h-0.5"
                  style={{ width: getWordWidth(word) - 8 }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* 進捗表示 */}
      <View className="mb-4">
        <Text className="text-center text-app-neutral-600 mb-2">
          進捗: {filledCount}/{wordItems.length} 単語
        </Text>
        <View className="bg-app-neutral-200 rounded-full h-2">
          <View
            className="bg-app-primary rounded-full h-2"
            style={{ width: `${(filledCount / wordItems.length) * 100}%` }}
          />
        </View>

        {/* プレビュー表示 */}
        {filledCount > 0 && (
          <View className="mt-3 p-3 bg-app-neutral-100 rounded-lg">
            <Text className="text-sm text-app-neutral-600 mb-2">プレビュー:</Text>
            <Text className="text-app-neutral-800">
              {reconstructSentence(parsedSentence, userWords)}
            </Text>
          </View>
        )}
      </View>

      {/* 提出ボタン */}
      <Button
        title={isSubmitting ? '送信中...' : '回答を提出'}
        onPress={handleSubmit}
        disabled={!canSubmit}
        variant="primary"
      />

      <KeyboardAccessoryView
        nativeID={inputAccessoryViewID}
        showNavigation={true}
        disablePrevious={currentIndex === 0}
        disableNext={currentIndex === wordItems.length - 1}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onDone={handleDone}
      />
    </View>
  );
};

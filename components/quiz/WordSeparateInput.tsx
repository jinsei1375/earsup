import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';
import { Button } from '@/components/common/Button';

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
  // 文章を単語と句読点に分離
  const parsesentence = (sentence: string) => {
    const words = sentence.split(/\s+/).filter((word) => word.length > 0);
    const result: { text: string; isPunctuation: boolean; index: number }[] = [];
    let wordIndex = 0;

    words.forEach((word) => {
      // すべての記号を分離（句読点 + アポストロフィ）
      const parts = word.split(/([.!?,:;'])/);

      parts.forEach((part) => {
        if (!part) return;

        if (/[.!?,:;']/.test(part)) {
          // 句読点・アポストロフィとして扱う
          result.push({ text: part, isPunctuation: true, index: -1 });
        } else {
          // 単語として扱う
          result.push({ text: part, isPunctuation: false, index: wordIndex++ });
        }
      });
    });

    return result;
  };

  const parsedSentence = parsesentence(questionText);
  const wordItems = parsedSentence.filter((item) => !item.isPunctuation);

  const [userWords, setUserWords] = useState<string[]>(new Array(wordItems.length).fill(''));
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

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

  // 単語と句読点を組み合わせて元の文章形式に戻す
  const reconstructSentence = (
    parsedItems: { text: string; isPunctuation: boolean; index: number }[],
    words: string[]
  ) => {
    let result = '';
    let needSpace = false;

    parsedItems.forEach((item, sentenceIndex) => {
      if (item.isPunctuation) {
        // アポストロフィは前の文字にくっつける、その他の句読点も同様
        result += item.text;
        needSpace = !["'"].includes(item.text); // アポストロフィの後はスペース不要
      } else {
        // 単語の場合
        const word = words[item.index] || '';
        if (word) {
          // 最初の単語以外で、前がアポストロフィでない場合はスペースを追加
          if (needSpace && result.length > 0) {
            result += ' ';
          }
          result += word;
          needSpace = true; // 次にスペースが必要
        }
      }
    });

    return result;
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
      <View className="flex-row flex-wrap justify-center mb-6" style={{ gap: 8 }}>
        {parsedSentence.map((item, sentenceIndex) => {
          if (item.isPunctuation) {
            // アポストロフィは上部に、その他の句読点は下部に
            const isApostrophe = item.text === "'";
            return (
              <Text
                key={`punct-${sentenceIndex}`}
                className={`text-2xl text-app-neutral-800 ${
                  isApostrophe ? 'self-start mt-1' : 'self-end mb-2'
                }`}
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
              {reconstructSentence(wordItems, userWords)}
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
    </View>
  );
};

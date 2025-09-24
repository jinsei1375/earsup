import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';

const sampleSentences = [
  'The quick brown fox jumps over the lazy dog.',
  'I have a dream that one day this nation will rise up.',
  'To be or not to be, that is the question.',
  "I'll go there, and you can't stop me.",
];

export default function WordInputDemo() {
  const [selectedSentence, setSelectedSentence] = useState(sampleSentences[0]);
  const [userWords, setUserWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const { setSettingsConfig, showInfoModal } = useHeaderSettings();

  const handleSettingsPress = useCallback(() => {
    showInfoModal();
  }, [showInfoModal]);

  useEffect(() => {
    // ヘッダー設定
    setSettingsConfig({
      showSettings: true,
      onSettingsPress: handleSettingsPress,
      showBackButton: true,
      onBackPress: () => router.back(),
    });

    // クリーンアップ関数でヘッダー設定をリセット
    return () => {
      setSettingsConfig({});
    };
  }, [setSettingsConfig, handleSettingsPress]);

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

  const parsedSentence = parsesentence(selectedSentence);
  const wordItems = parsedSentence.filter((item) => !item.isPunctuation);

  useEffect(() => {
    if (userWords.length !== wordItems.length) {
      setUserWords(new Array(wordItems.length).fill(''));
      setCurrentIndex(0);
      setIsSubmitted(false);
    }
  }, [selectedSentence, wordItems.length]);

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

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const getWordWidth = (word: string, minWidth: number = 60) => {
    const calculatedWidth = Math.max(word.length * 12 + 24, minWidth);
    return Math.min(calculatedWidth, 150);
  };

  const getWordStyle = (index: number) => {
    const isFocused = currentIndex === index;
    const hasValue = userWords[index]?.length > 0;

    if (isSubmitted) {
      const correctWord = wordItems[index].text;
      const isCorrect = userWords[index]?.toLowerCase().trim() === correctWord.toLowerCase().trim();
      if (isCorrect) return 'border-app-success bg-app-success-light';
      if (hasValue) return 'border-app-danger bg-app-danger-light';
      return 'border-app-warning bg-app-warning-light';
    }
    if (isFocused) return 'border-app-primary bg-white shadow-sm';
    if (hasValue) return 'border-app-success bg-app-success-light';
    return 'border-app-neutral-400 bg-white';
  };

  const getTextStyle = (index: number) => {
    if (isSubmitted) {
      const correctWord = wordItems[index].text;
      const isCorrect = userWords[index]?.toLowerCase().trim() === correctWord.toLowerCase().trim();
      const hasValue = userWords[index]?.length > 0;
      if (isCorrect) return 'text-app-success-dark';
      if (hasValue) return 'text-app-danger-dark';
      return 'text-app-warning-dark';
    }
    return 'text-app-neutral-800';
  };

  const filledCount = userWords.filter((word) => word.trim().length > 0).length;

  const getResults = () => {
    let correct = 0;
    let incorrect = 0;
    let missing = 0;

    wordItems.forEach((wordItem, index) => {
      const userWord = userWords[index]?.toLowerCase().trim();
      const correctWord = wordItem.text.toLowerCase().trim();

      if (!userWord) {
        missing++;
      } else if (userWord === correctWord) {
        correct++;
      } else {
        incorrect++;
      }
    });

    return { correct, incorrect, missing };
  };

  const resetDemo = () => {
    setUserWords(new Array(wordItems.length).fill(''));
    setCurrentIndex(0);
    setIsSubmitted(false);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-app-neutral-50">
        <ScrollView className="flex-1 px-4 py-4">
          {/* 文章選択 */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-app-neutral-800 mb-3">練習文章を選択</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="px-2">
                {sampleSentences.map((sentence, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedSentence(sentence)}
                    className={`px-4 py-3 mb-2 rounded-lg border ${
                      selectedSentence === sentence
                        ? 'bg-app-primary border-app-primary'
                        : 'bg-white border-app-neutral-300'
                    }`}
                    style={{ minWidth: 150 }}
                  >
                    <Text
                      className={`text-sm ${
                        selectedSentence === sentence ? 'text-white' : 'text-app-neutral-700'
                      }`}
                      numberOfLines={2}
                    >
                      {sentence}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* メイン入力エリア */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-app-neutral-800">単語を入力してください</Text>
              <View className="flex-row items-center">
                <FeatureIcon name="create" size={20} color={APP_COLORS.gray600} />
                <Text className="ml-1 text-sm text-app-neutral-600">{wordItems.length}単語</Text>
              </View>
            </View>

            {/* 単語と句読点の表示 */}
            <View className="flex-row flex-wrap justify-center mb-4" style={{ gap: 8 }}>
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
                      editable={!isSubmitted}
                      placeholder={`${wordIndex + 1}`}
                      className={`text-center py-3 px-2 rounded-lg border-2 text-base font-medium ${getWordStyle(
                        wordIndex
                      )} ${getTextStyle(wordIndex)}`}
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

            {/* ヒント表示（提出後） */}
            {isSubmitted && (
              <View className="bg-app-neutral-50 rounded-lg p-3 mb-4">
                <Text className="text-sm font-medium text-app-neutral-700 mb-2">正解:</Text>
                <Text className="text-base text-app-neutral-800 leading-6">{selectedSentence}</Text>
              </View>
            )}

            {/* アクションボタン */}
            <View className="flex-row space-x-3">
              {!isSubmitted ? (
                <>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={filledCount === 0}
                    className={`flex-1 py-4 rounded-lg ${
                      filledCount > 0 ? 'bg-app-primary' : 'bg-app-neutral-300'
                    }`}
                  >
                    <Text className="text-white text-center font-semibold text-base">
                      回答を提出 ({filledCount}/{wordItems.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={resetDemo}
                    className="px-6 py-4 bg-app-neutral-100 border border-app-neutral-300 rounded-lg"
                  >
                    <FeatureIcon name="refresh" size={20} color={APP_COLORS.gray600} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={resetDemo}
                  className="flex-1 py-4 bg-app-success rounded-lg"
                >
                  <Text className="text-white text-center font-semibold text-base">
                    もう一度挑戦
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 結果表示 */}
          {isSubmitted && (
            <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <Text className="text-lg font-bold text-app-neutral-800 mb-4">結果</Text>

              {(() => {
                const { correct, incorrect, missing } = getResults();
                const accuracy = ((correct / wordItems.length) * 100).toFixed(1);

                return (
                  <View>
                    <View className="flex-row justify-around mb-4">
                      <View className="items-center">
                        <FeatureIcon name="checkmark-circle" size={24} color={APP_COLORS.success} />
                        <Text className="text-app-success font-bold text-xl mt-1">{correct}</Text>
                        <Text className="text-app-neutral-600 text-sm">正解</Text>
                      </View>
                      <View className="items-center">
                        <FeatureIcon name="close-circle" size={24} color={APP_COLORS.danger} />
                        <Text className="text-app-danger font-bold text-xl mt-1">{incorrect}</Text>
                        <Text className="text-app-neutral-600 text-sm">不正解</Text>
                      </View>
                      <View className="items-center">
                        <FeatureIcon name="help-circle" size={24} color={APP_COLORS.warning} />
                        <Text className="text-app-warning font-bold text-xl mt-1">{missing}</Text>
                        <Text className="text-app-neutral-600 text-sm">未入力</Text>
                      </View>
                    </View>

                    <View className="bg-app-neutral-50 rounded-lg p-3">
                      <Text className="text-center text-2xl font-bold text-app-primary">
                        正解率: {accuracy}%
                      </Text>
                      <Text className="text-center text-app-neutral-600 mt-1">
                        {correct}/{wordItems.length} 単語
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {/* 凡例 */}
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-sm font-bold text-app-neutral-800 mb-3">入力状態の見方</Text>
            <View className="space-y-2">
              <View className="flex-row items-center">
                <View className="w-6 h-6 border-2 border-app-primary bg-white rounded mr-3" />
                <Text className="text-sm text-app-neutral-700">現在入力中</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 border-2 border-app-success bg-app-success-light rounded mr-3" />
                <Text className="text-sm text-app-neutral-700">入力済み</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 border-2 border-app-neutral-400 bg-white rounded mr-3" />
                <Text className="text-sm text-app-neutral-700">未入力</Text>
              </View>
            </View>

            {isSubmitted && (
              <View className="mt-4 pt-3 border-t border-app-neutral-200">
                <Text className="text-sm font-bold text-app-neutral-800 mb-2">結果の見方</Text>
                <View className="space-y-2">
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 border-2 border-app-success bg-app-success-light rounded mr-3" />
                    <Text className="text-sm text-app-neutral-700">正解</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 border-2 border-app-danger bg-app-danger-light rounded mr-3" />
                    <Text className="text-sm text-app-neutral-700">不正解</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 border-2 border-app-warning bg-app-warning-light rounded mr-3" />
                    <Text className="text-sm text-app-neutral-700">未入力</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

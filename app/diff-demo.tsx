// app/diff-demo.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { DiffDisplay } from '@/components/quiz/DiffDisplay';
import { generateDiff, getJudgmentResult } from '@/utils/diffUtils';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';

export default function DiffDemoScreen() {
  const [userAnswer, setUserAnswer] = useState('I am going to school');
  const [correctAnswer, setCorrectAnswer] = useState('I am going to the school');

  const { setSettingsConfig, showInfoModal } = useHeaderSettings();

  const handleSettingsPress = () => {
    showInfoModal();
  };

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
  }, []);

  const diffResult = generateDiff(userAnswer, correctAnswer);
  const judgment = getJudgmentResult(userAnswer, correctAnswer);

  const exampleCases = [
    {
      name: '完全一致',
      user: 'Hello world',
      correct: 'Hello world',
    },
    {
      name: '大文字小文字の違い',
      user: 'hello WORLD',
      correct: 'Hello world',
    },
    {
      name: '文末句読点あり',
      user: 'I am going to school.',
      correct: 'I am going to school',
    },
    {
      name: '語順違い',
      user: 'I like very much apples',
      correct: 'I like apples very much',
    },
    {
      name: '単語不足',
      user: 'I going to school',
      correct: 'I am going to school',
    },
    {
      name: '余分な単語',
      user: 'I am really going to the school',
      correct: 'I am going to school',
    },
    {
      name: '余分な文字（問題のケース）',
      user: 'we are running behind schedule s',
      correct: 'we are running behind schedule',
    },
    {
      name: 'タイポ',
      user: 'I am goeng to schoool',
      correct: 'I am going to school',
    },
    {
      name: '複合的な違い',
      user: 'She have a beutiful red car.',
      correct: 'She has a beautiful blue car',
    },
  ];

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        {/* 使用方法の説明 */}
        <View className="bg-app-primary-light border border-app-primary rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <FeatureIcon name="information-circle" size={20} color={APP_COLORS.primary} />
            <Text className="ml-2 font-bold text-app-primary-dark">使用方法</Text>
          </View>
          <Text className="text-sm text-app-primary-dark">
            • 上記の入力欄で任意の文章を試すことができます{'\n'}•
            サンプルケースをタップすると入力欄に反映されます{'\n'}•
            差分表示では単語単位で正解・間違いを色分けして表示します{'\n'}•
            文末の句読点(.!?)は判定に影響しません{'\n'}• 大文字小文字の違いは無視されます{'\n'}•
            正答率80%以上で「惜しい」、完全一致で「正解」となります
          </Text>
        </View>
        {/* カスタム入力 */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-app-neutral-800 mb-4">カスタム入力</Text>

          <Text className="text-sm font-medium text-app-neutral-700 mb-2">ユーザーの回答</Text>
          <TextInput
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder="ユーザーの回答を入力..."
            className="border border-app-neutral-300 rounded-lg p-3 mb-3 text-base"
            multiline
          />

          <Text className="text-sm font-medium text-app-neutral-700 mb-2">正解</Text>
          <TextInput
            value={correctAnswer}
            onChangeText={setCorrectAnswer}
            placeholder="正解を入力..."
            className="border border-app-neutral-300 rounded-lg p-3 mb-4 text-base"
            multiline
          />

          <View className="flex-row items-center justify-between bg-app-neutral-50 rounded-lg p-3">
            <Text className="font-medium text-app-neutral-700">判定結果:</Text>
            <View className="flex-row items-center">
              <FeatureIcon
                name={
                  judgment === 'correct'
                    ? 'checkmark-circle'
                    : judgment === 'close'
                    ? 'thumbs-up'
                    : 'close-circle'
                }
                size={16}
                color={
                  judgment === 'correct'
                    ? APP_COLORS.success
                    : judgment === 'close'
                    ? APP_COLORS.warning
                    : APP_COLORS.danger
                }
              />
              <Text
                className={`ml-1 font-bold ${
                  judgment === 'correct'
                    ? 'text-app-success-dark'
                    : judgment === 'close'
                    ? 'text-app-warning-dark'
                    : 'text-app-danger-dark'
                }`}
              >
                {judgment === 'correct' ? '正解' : judgment === 'close' ? '惜しい' : '不正解'}
              </Text>
            </View>
          </View>
        </View>

        {/* 差分表示 */}
        <DiffDisplay
          diffResult={diffResult}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          className="mb-6"
        />

        {/* サンプルケース */}
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-bold text-app-neutral-800 mb-4">サンプルケース</Text>

          {exampleCases.map((example, index) => (
            <View key={index} className={`mb-3 ${index === exampleCases.length - 1 ? 'mb-0' : ''}`}>
              <TouchableOpacity
                onPress={() => {
                  setUserAnswer(example.user);
                  setCorrectAnswer(example.correct);
                }}
                className="border border-app-neutral-200 rounded-lg p-3"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-bold text-app-neutral-800">{example.name}</Text>
                  <View className="flex-row items-center">
                    {(() => {
                      const sampleJudgment = getJudgmentResult(example.user, example.correct);
                      return (
                        <>
                          <FeatureIcon
                            name={
                              sampleJudgment === 'correct'
                                ? 'checkmark-circle'
                                : sampleJudgment === 'close'
                                ? 'thumbs-up'
                                : 'close-circle'
                            }
                            size={14}
                            color={
                              sampleJudgment === 'correct'
                                ? APP_COLORS.success
                                : sampleJudgment === 'close'
                                ? APP_COLORS.warning
                                : APP_COLORS.danger
                            }
                          />
                          <Text
                            className={`ml-1 text-sm font-medium ${
                              sampleJudgment === 'correct'
                                ? 'text-app-success-dark'
                                : sampleJudgment === 'close'
                                ? 'text-app-warning'
                                : 'text-app-danger'
                            }`}
                          >
                            {sampleJudgment === 'correct'
                              ? '正解'
                              : sampleJudgment === 'close'
                              ? '惜しい'
                              : '不正解'}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                </View>
                <Text className="text-sm text-app-neutral-600 mb-1">
                  <Text className="font-medium">回答:</Text> {example.user}
                </Text>
                <Text className="text-sm text-app-neutral-600">
                  <Text className="font-medium">正解:</Text> {example.correct}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

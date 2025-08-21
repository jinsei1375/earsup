// app/guide.tsx
import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';

export default function GuideScreen() {
  const { setSettingsConfig } = useHeaderSettings();

  useEffect(() => {
    // ヘッダー設定
    setSettingsConfig({
      showBackButton: true,
      onBackPress: () => router.back(),
    });

    // クリーンアップ関数でヘッダー設定をリセット
    return () => {
      setSettingsConfig({});
    };
  }, []);

  const setupSteps = [
    {
      title: 'ニックネーム設定',
      description: '初回起動時にニックネームを設定します',
      details: [
        'アプリ起動時に自動で設定画面が表示',
        'クイズ参加時に表示される名前',
        'ホーム画面の設定から後で変更可能',
      ],
    },
    {
      title: 'ルーム作成',
      description: 'クイズを主催する場合',
      details: [
        '"ルームを作成する"ボタンをタップ',
        'クイズモードを選択（ホストあり/なし）',
        '参加者設定（最低参加者数など）',
        'ルームコードが発行される',
      ],
    },
    {
      title: 'ルーム参加',
      description: 'クイズに参加する場合',
      details: [
        '"ルームに参加する"ボタンをタップ',
        'ルームコードを入力',
        '参加者一覧で待機',
        'ホストがクイズ開始まで待機',
      ],
    },
  ];

  const hostModeSteps = [
    {
      step: '1',
      title: 'クイズモード選択',
      content: 'ルーム作成時に「ホストありモード」を選択',
    },
    {
      step: '2',
      title: '参加者待機',
      content: '参加者がルームに入るまで待機（最低1人必要）',
    },
    {
      step: '3',
      title: 'クイズ開始',
      content: '"クイズを開始"ボタンでクイズスタート',
    },
    {
      step: '4',
      title: '問題作成',
      content: '問題文を入力し、音声再生速度を選択',
    },
    {
      step: '5',
      title: '音声再生',
      content: '"音声を再生"ボタンで問題音声を流す',
    },
    {
      step: '6',
      title: '回答収集',
      content: '参加者が回答を入力するまで待機',
    },
    {
      step: '7',
      title: '判定作業',
      content: '各回答を「正解」「惜しい」「不正解」で判定',
    },
    {
      step: '8',
      title: '結果発表',
      content: '全員の判定完了後、結果とランキングを確認',
    },
    {
      step: '9',
      title: '次の問題',
      content: '"次の問題"ボタンで続行、または"クイズ終了"',
    },
  ];

  const autoModeSteps = [
    {
      step: '1',
      title: 'クイズモード選択',
      content: 'ルーム作成時に「ホストなしモード」を選択',
    },
    {
      step: '2',
      title: '例文登録',
      content: '事前に例文を登録しておく（必須）',
    },
    {
      step: '3',
      title: '参加者待機',
      content: '参加者がルームに入るまで待機（最低1人必要）',
    },
    {
      step: '4',
      title: 'クイズ開始',
      content: 'ルーム作成者が"クイズを開始"ボタンを押す',
    },
    {
      step: '5',
      title: '問題選択',
      content: '登録済み例文から問題を選択',
    },
    {
      step: '6',
      title: '音声再生',
      content: '自動で音声が再生（最大3回まで）',
    },
    {
      step: '7',
      title: '回答入力',
      content: '音声を聞いて回答を入力・送信',
    },
    {
      step: '8',
      title: '自動判定',
      content: '登録済みの正答と自動照合（句読点除外可能）',
    },
    {
      step: '9',
      title: '結果確認',
      content: '全員の判定完了後、自動で結果表示',
    },
    {
      step: '10',
      title: '次の問題',
      content: 'ルーム作成者が"次の問題"で続行',
    },
  ];

  const tips = [
    {
      icon: 'volume-high',
      title: '音声が聞こえない場合',
      content: 'デバイスのマナーモード（消音モード）を解除してください',
      color: APP_COLORS.primary,
    },
    {
      icon: 'mic',
      title: '音声設定の活用',
      content: '男性・女性の音声選択や、0.5x〜1.5xの速度調整で学習効果を最大化',
      color: APP_COLORS.success,
    },
    {
      icon: 'flash',
      title: '速度調整の活用',
      content: '初心者には0.75x、上級者には1.25xなど参加者に合わせて調整',
      color: APP_COLORS.warning,
    },
    {
      icon: 'target',
      title: '効果的なクイズ作成',
      content: '短くて覚えやすいフレーズを選ぶと、より楽しく学習できます',
      color: APP_COLORS.info,
    },
    {
      icon: 'people',
      title: 'グループ学習のコツ',
      content: '参加者のレベルに合わせて問題の難易度を調整しましょう',
      color: APP_COLORS.secondary,
    },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* ヘッダーセクション */}
        <View className="items-center mb-8">
          <Text className="text-lg text-gray-600 text-center">EarsUpの使い方を詳しく解説</Text>
        </View>

        {/* 初期設定セクション */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <FeatureIcon name="rocket" size={20} color={APP_COLORS.primary} className="mr-2" />
            <Text className="text-xl font-bold text-gray-800">初期設定</Text>
          </View>
          <View className="space-y-4">
            {setupSteps.map((step, index) => (
              <View key={index} className="bg-blue-50 rounded-lg p-4 mb-2">
                <Text className="font-bold text-blue-800 mb-2">{step.title}</Text>
                <Text className="text-blue-700 mb-3">{step.description}</Text>
                <View className="space-y-1">
                  {step.details.map((detail, detailIndex) => (
                    <View key={detailIndex} className="flex-row items-start">
                      <Text className="text-blue-500 mr-2">•</Text>
                      <Text className="text-blue-600 flex-1">{detail}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ホストありモード */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <FeatureIcon
              name="radio-button-on"
              size={20}
              color={APP_COLORS.success}
              className="mr-2"
            />
            <Text className="text-xl font-bold text-gray-800">ホストありモード</Text>
          </View>
          <Text className="text-gray-600 mb-4">
            ホストが問題作成・音声再生・判定を行うモードです。柔軟な判定が可能で、教育現場に最適です。
          </Text>
          <View className="space-y-3">
            {hostModeSteps.map((step, index) => (
              <View key={index} className="flex-row items-start bg-green-50 rounded-lg p-3 mb-2">
                <View className="bg-green-500 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-white text-xs font-bold">{step.step}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-green-800">{step.title}</Text>
                  <Text className="text-green-700 text-sm">{step.content}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ホストなしモード */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <FeatureIcon
              name="radio-button-on"
              size={20}
              color={APP_COLORS.info}
              className="mr-2"
            />
            <Text className="text-xl font-bold text-gray-800">ホストなしモード</Text>
          </View>
          <Text className="text-gray-600 mb-4">
            事前登録した例文を使用して自動進行するモードです。友達同士の気軽な学習に最適です。
          </Text>
          <View className="space-y-3">
            {autoModeSteps.map((step, index) => (
              <View key={index} className="flex-row items-start bg-purple-50 rounded-lg p-3 mb-2">
                <View className="bg-purple-500 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-white text-xs font-bold">{step.step}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-purple-800">{step.title}</Text>
                  <Text className="text-purple-700 text-sm">{step.content}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ヒント・コツ */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <FeatureIcon name="bulb" size={20} color={APP_COLORS.warning} className="mr-2" />
            <Text className="text-xl font-bold text-gray-800">ヒント・コツ</Text>
          </View>
          <View className="space-y-4">
            {tips.map((tip, index) => (
              <View key={index} className="bg-yellow-50 rounded-lg p-4 mb-2">
                <View className="flex-row items-center mb-2">
                  <FeatureIcon
                    name={tip.icon as any}
                    size={20}
                    color={tip.color}
                    backgroundColor={tip.color}
                    borderRadius="small"
                    className="mr-3"
                  />
                  <Text className="font-bold text-yellow-800 flex-1">{tip.title}</Text>
                </View>
                <Text className="text-yellow-700">{tip.content}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* トラブルシューティング */}
        <View className="bg-red-50 rounded-xl p-6 mb-8">
          <View className="flex-row items-center mb-4">
            <FeatureIcon name="build" size={20} color={APP_COLORS.danger} className="mr-2" />
            <Text className="text-xl font-bold text-red-800">よくある問題と解決方法</Text>
          </View>
          <View className="space-y-4">
            <View className="mb-2">
              <Text className="font-semibold text-red-800 mb-1">音声が再生されない</Text>
              <Text className="text-red-700 text-sm">
                → マナーモードを解除し、音量を確認してください
              </Text>
            </View>
            <View className="mb-2">
              <Text className="font-semibold text-red-800 mb-1">ルームに参加できない</Text>
              <Text className="text-red-700 text-sm">
                → ルームコードが正しいか、ルームが作成済みか確認してください
              </Text>
            </View>
            <View className="mb-2">
              <Text className="font-semibold text-red-800 mb-1">クイズが開始できない</Text>
              <Text className="text-red-700 text-sm">
                → ルーム作成者を除いて参加者が最低1人いるか確認してください
              </Text>
            </View>
          </View>
        </View>

        {/* フッター */}
        <View className="items-center mt-4 mb-4">
          <Text className="text-sm text-gray-500 text-center">
            その他ご不明な点がございましたら、お気軽にお問い合わせください
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

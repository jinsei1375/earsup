// app/features.tsx
import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';

export default function FeaturesScreen() {
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

  const features = [
    {
      icon: '🎧',
      title: 'リスニングクイズ',
      description: '音声を聞いて答えるクイズ形式で英語学習',
      details: [
        '英語の音声問題を自動再生',
        '速度調整機能で聞き取りやすさを調整',
        '問題文は自由に作成・登録可能',
      ],
    },
    {
      icon: '👥',
      title: 'リアルタイム参加',
      description: '複数人で同時にクイズを楽しめる',
      details: [
        'ルームコードで簡単参加',
        '最大参加者数の制限なし',
        'リアルタイムで参加者の状況を表示',
      ],
    },
    {
      icon: '🏆',
      title: 'ポイント・ランキング',
      description: 'ポイント制でリアルタイム順位表示',
      details: [
        '正解で10ポイント、惜しいで5ポイント',
        'タイ記録にも対応した順位システム',
        '累積スコアで総合ランキング',
        '各問題の回答・判定結果を表示',
      ],
    },
    {
      icon: '⚙️',
      title: '柔軟なクイズモード',
      description: '用途に応じて選べる2つのモード',
      details: [
        'ホストありモード：ホストが判定を行う',
        'ホストなしモード：自動判定で進行',
        '惜しい判定の有効/無効設定',
      ],
    },
    {
      icon: '📝',
      title: '例文管理',
      description: '自分だけの例文データベース',
      details: [
        '英語フレーズと日本語訳を登録',
        '登録した例文はクイズで使用可能',
        '編集・削除機能で管理簡単',
      ],
    },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* ヘッダーセクション */}
        <View className="items-center mb-8">
          <Text className="text-lg text-gray-600 text-center">EarsUpの豊富な機能をご紹介</Text>
        </View>

        {/* 機能一覧 */}
        <View className="space-y-6">
          {features.map((feature, index) => (
            <View
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-2"
            >
              <View className="flex-row items-center mb-4">
                <Text className="text-4xl mr-4">{feature.icon}</Text>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-800 mb-1">{feature.title}</Text>
                  <Text className="text-gray-600">{feature.description}</Text>
                </View>
              </View>

              <View className="space-y-2">
                {feature.details.map((detail, detailIndex) => (
                  <View key={detailIndex} className="flex-row items-start">
                    <Text className="text-blue-500 mr-2">•</Text>
                    <Text className="text-gray-700 flex-1 leading-6">{detail}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* 今後の予定セクション */}
        <View className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mt-8">
          <Text className="text-xl font-bold text-purple-800 mb-4 text-center">
            🚀 今後の機能追加予定
          </Text>
          <View className="space-y-3">
            {[
              '1人で学習モード',
              'カスタムテーマ機能',
              'チーム戦モード',
              'オフライン学習モード',
            ].map((item, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <Text className="text-purple-500 mr-3">📋</Text>
                <Text className="text-purple-700 flex-1">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* フッター */}
        <View className="items-center mt-8 mb-4">
          <Text className="text-sm text-gray-500 text-center">
            機能に関するご要望・ご質問はお気軽にお聞かせください
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

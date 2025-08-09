// app/privacy.tsx
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';

export default function PrivacyPolicy() {
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
  }, [setSettingsConfig]);

  return (
    <ScrollView className="flex-1 px-4 py-4">
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">1. 収集する情報</Text>
        <Text className="text-base leading-6 mb-4">
          本アプリでは、以下の情報を収集する場合があります：
        </Text>
        <Text className="text-base leading-6 mb-1">• ニックネーム</Text>
        <Text className="text-base leading-6 mb-1">• クイズの回答履歴</Text>
        <Text className="text-base leading-6 mb-1">• アプリの利用状況</Text>
        <Text className="text-base leading-6 mb-4">• デバイス情報（OS、機種など）</Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">2. 情報の利用目的</Text>
        <Text className="text-base leading-6 mb-4">収集した情報は以下の目的で利用します：</Text>
        <Text className="text-base leading-6 mb-1">• アプリの機能提供</Text>
        <Text className="text-base leading-6 mb-1">• サービスの改善</Text>
        <Text className="text-base leading-6 mb-1">• 技術的な問題の解決</Text>
        <Text className="text-base leading-6 mb-4">• ユーザーサポート</Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">3. 情報の第三者提供</Text>
        <Text className="text-base leading-6 mb-4">
          本アプリの運営者は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">4. データの保存期間</Text>
        <Text className="text-base leading-6 mb-4">
          ユーザーの情報は、アプリの利用に必要な期間中保存されます。
          アプリをアンインストールした場合、デバイス内の情報は削除されます。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">5. セキュリティ</Text>
        <Text className="text-base leading-6 mb-4">
          本アプリの運営者は、収集した情報の安全性を確保するため、適切な技術的・組織的措置を講じています。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">6. 外部サービス</Text>
        <Text className="text-base leading-6 mb-4">
          本アプリは以下の外部サービスを利用しています：
        </Text>
        <Text className="text-base leading-6 mb-1">• Supabase（データベース）</Text>
        <Text className="text-base leading-6 mb-4">• Expo（アプリ開発プラットフォーム）</Text>
        <Text className="text-base leading-6 mb-4">
          これらのサービスにはそれぞれのプライバシーポリシーが適用されます。当アプリは、ユーザーのニックネーム、参加したルーム情報、クイズの回答履歴等をSupabase（米国のデータセンターを利用する場合があります）に保存します。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">7. 音声データ</Text>
        <Text className="text-base leading-6 mb-4">
          本アプリでは音声合成機能を提供していますが、ユーザーの音声を録音・保存することはありません。
          音声合成はデバイス上で処理され、外部に送信されることはありません。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">8. お問い合わせ</Text>
        <Text className="text-base leading-6 mb-4">
          本プライバシーポリシーに関するお問い合わせは、お問い合わせフォームからご連絡ください。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">9. プライバシーポリシーの変更</Text>
        <Text className="text-base leading-6 mb-4">
          本アプリの運営者は、必要に応じて本プライバシーポリシーを変更することがあります。
          重要な変更がある場合は、アプリ内で通知いたします。
        </Text>
      </View>
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">10. ユーザーの権利</Text>
        <Text className="text-base leading-6 mb-1">• データの確認・修正・削除を要求する権利</Text>
        <Text className="text-base leading-6 mb-1">• データポータビリティの権利</Text>
        <Text className="text-base leading-6 mb-1">• サービス利用停止の権利</Text>
      </View>
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">11. お問い合わせ窓口</Text>
        <Text className="text-base leading-6 mb-4">
          本アプリに関するお問い合わせは、下記の窓口までご連絡ください。
          {'\n'}
          運営者：ensei
          {'\n'}
          E-mail: jinsei1375@gmail.com
        </Text>
      </View>

      <View className="mb-8">
        <Text className="text-sm text-gray-500 text-center">
          制定日：2025/8/5{'\n'}
          最終更新日：2025/8/5
        </Text>
      </View>
    </ScrollView>
  );
}

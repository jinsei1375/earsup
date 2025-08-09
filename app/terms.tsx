// app/terms.tsx
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';

export default function TermsOfService() {
  const { setSettingsConfig } = useHeaderSettings();

  useEffect(() => {
    setSettingsConfig({
      showBackButton: true,
      onBackPress: () => router.back(),
    });
    return () => {
      setSettingsConfig({});
    };
  }, []);

  return (
    <ScrollView className="flex-1 px-4 py-4">
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">第1条（適用）</Text>
        <Text className="text-base leading-6 mb-4">
          本利用規約（以下「本規約」といいます。）は、EarsUp（以下「本アプリ」といいます。）の利用条件を定めるものです。
          ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って、本アプリをご利用いただきます。
          本アプリは本アプリの運営者（以下「運営者」といいます。）が提供します。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">第2条（利用登録）</Text>
        <Text className="text-base leading-6 mb-4">
          本アプリの利用にあたって、ユーザーはニックネームの設定が必要です。
          設定されたニックネームは他のユーザーに表示される場合があります。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">第3条（禁止事項）</Text>
        <Text className="text-base leading-6 mb-2">
          ユーザーは、本アプリの利用にあたり、以下の行為をしてはなりません。
        </Text>
        <Text className="text-base leading-6 mb-1">• 法令または公序良俗に違反する行為</Text>
        <Text className="text-base leading-6 mb-1">• 犯罪行為に関連する行為</Text>
        <Text className="text-base leading-6 mb-1">• 他のユーザーに対する迷惑行為</Text>
        <Text className="text-base leading-6 mb-1">• 知的財産権を侵害する行為</Text>
        <Text className="text-base leading-6 mb-4">• その他、運営者が不適切と判断する行為</Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">第4条（本アプリの提供の停止等）</Text>
        <Text className="text-base leading-6 mb-4">
          運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく
          本アプリの全部または一部の提供を停止または中断することができるものとします。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">第5条（著作権）</Text>
        <Text className="text-base leading-6 mb-4">
          本アプリで使用される楽曲や文章等のコンテンツの著作権は、それぞれの権利者に帰属します。
          ユーザーは、これらのコンテンツを著作権法に従って利用するものとします。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">第6条（個人情報の取り扱い）</Text>
        <Text className="text-base leading-6 mb-4">
          運営者は、ユーザーから取得した個人情報をプライバシーポリシーに従って適切に取り扱います。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">第7条（免責事項）</Text>
        <Text className="text-base leading-6 mb-4">
          運営者は、本アプリに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。
          運営者は、本アプリの利用によってユーザーに生じたあらゆる損害について一切の責任を負いません。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">第8条（利用停止・削除）</Text>
        <Text className="text-base leading-6 mb-4">
          ユーザーが本規約に違反した場合、運営者は事前通知なくアカウントの停止または削除を行うことがあります。
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">第9条（準拠法・裁判管轄）</Text>
        <Text className="text-base leading-6 mb-4">
          本規約は日本法に準拠します。本アプリに関して紛争が生じた場合、運営者の所在地を管轄する裁判所を専属的合意管轄とします。
        </Text>
      </View>

      <View className="mb-8">
        <Text className="text-sm text-gray-500 text-center">制定日：2025年8月5日</Text>
      </View>
    </ScrollView>
  );
}

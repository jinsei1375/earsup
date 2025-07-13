import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { SettingsModal } from '@/components/common/SettingsModal';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { Button } from '@/components/common/Button';

export default function HomeScreen() {
  const userId = useUserStore((s) => s.userId);
  const storeNickname = useUserStore((s) => s.nickname);
  const setUserInfo = useUserStore((s) => s.setUserInfo);
  const [nickname, setNickname] = useState<string | null>(storeNickname);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const { setSettingsConfig } = useHeaderSettings();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) return;

      // ストアにニックネームがあれば、それを使用
      if (storeNickname) {
        setNickname(storeNickname);
        return;
      }

      // なければDBから取得
      const { data, error } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', userId)
        .single();

      if (error || !data?.nickname) {
        router.replace('/onboarding/nickname');
        return;
      }

      // 取得したニックネームをストアと状態にセット
      setNickname(data.nickname);
      setUserInfo(userId, data.nickname);
    };

    fetchUserInfo();
  }, [userId, storeNickname]);

  // ヘッダーの設定ボタンを制御
  useEffect(() => {
    setSettingsConfig({
      showSettings: true,
      onSettingsPress: () => setIsSettingsModalVisible(true),
    });

    // クリーンアップ時に設定をリセット
    return () => {
      setSettingsConfig({});
    };
  }, [setSettingsConfig]);

  const handleCreateRoom = () => {
    router.push({ pathname: '/room', params: { mode: 'create' } });
  };
  const handleJoinRoom = () => {
    router.push({ pathname: '/room', params: { mode: 'join' } });
  };

  const features = [
    {
      icon: '🎧',
      title: 'リスニングクイズ',
      description: '音声を聞いて答えるクイズ形式',
    },
    {
      icon: '👥',
      title: 'みんなで参加',
      description: '複数人で同時にクイズを楽しめる',
    },
    {
      icon: '🏆',
      title: 'リアルタイム順位',
      description: 'ポイント制でリアルタイム順位表示',
    },
    {
      icon: '📱',
      title: '簡単操作',
      description: 'ルームコードで簡単に参加可能',
    },
  ];

  const handleNicknameChange = async (newNickname: string) => {
    if (!userId) throw new Error('ユーザーIDが見つかりません');

    const { error } = await supabase
      .from('users')
      .update({ nickname: newNickname })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }

    // ストアと状態を更新
    setUserInfo(userId, newNickname);
    setNickname(newNickname);
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50">
      <View className="p-6">
        {/* ヘッダーセクション */}
        <View className="items-center mb-8 mt-4">
          <View className="bg-white rounded-full p-2 shadow-lg mb-4">
            <Image
              source={require('@/assets/images/adaptive-icon.png')}
              className="w-24 h-24 rounded-full"
            />
          </View>
          <Text className="text-4xl font-bold text-gray-800 mb-2">EarsUp</Text>
          <Text className="text-lg text-gray-600 text-center mb-4">リスニングクイズアプリ</Text>
          {nickname ? (
            <View className="flex-row items-center mb-4">
              <View className="bg-white px-4 py-2 rounded-full shadow-sm">
                <Text className="text-blue-600 font-semibold">{nickname}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSettingsModalVisible(true)}
                className="ml-2 bg-white rounded-full p-2 shadow-sm"
              >
                <Text className="text-gray-600 text-sm">✏️</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-gray-500">ニックネームを取得中...</Text>
          )}
          <Text className="text-sm text-gray-500 text-center leading-6">
            音声を聞いて答えるクイズで{'\n'}みんなで楽しく英語を学習しよう！
          </Text>
        </View>

        {/* メインアクションボタン */}
        <View className="mb-6">
          <Button
            title="ルームを作成する"
            onPress={handleCreateRoom}
            variant="primary"
            size="large"
            fullWidth
            className="mb-4"
          />
          <Button
            title="ルームに参加する"
            onPress={handleJoinRoom}
            variant="outline"
            size="large"
            fullWidth
          />
        </View>

        {/* 機能紹介セクション */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4 text-center">✨ アプリの特徴</Text>
          <View className="flex-row flex-wrap justify-between">
            {features.map((feature, index) => (
              <View
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-3"
                style={{ width: '48%' }}
              >
                <Text className="text-3xl mb-2 text-center">{feature.icon}</Text>
                <Text className="font-bold text-gray-800 text-center mb-1 text-sm">
                  {feature.title}
                </Text>
                <Text className="text-xs text-gray-600 text-center leading-4">
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 使い方セクション */}
        <View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
          <Text className="text-lg font-bold text-green-800 mb-3 text-center">🚀 はじめ方</Text>
          <View className="space-y-3">
            {[
              { step: '1', text: 'ルームを作成またはコードで参加' },
              { step: '2', text: 'ホストが音声問題を作成・再生' },
              { step: '3', text: '音声を聞いて回答を入力' },
              { step: '4', text: 'リアルタイムで結果発表！' },
            ].map((item) => (
              <View key={item.step} className="flex-row items-center mb-2">
                <View className="bg-green-500 rounded-full w-6 h-6 items-center justify-center mr-3">
                  <Text className="text-white text-xs font-bold">{item.step}</Text>
                </View>
                <Text className="text-green-700 flex-1">{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* フッター */}
        <View className="items-center mt-4 mb-8">
          <Text className="text-xs text-gray-400 text-center">
            v1.0.0 • Made with ❤️ for learning
          </Text>
        </View>
      </View>

      <SettingsModal
        isVisible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
        currentNickname={nickname || ''}
        onNicknameChange={handleNicknameChange}
      />
    </ScrollView>
  );
}

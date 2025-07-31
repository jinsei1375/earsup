import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { SettingsModal } from '@/components/common/SettingsModal';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { Button } from '@/components/common/Button';
import { AnimatedButton } from '@/components/common/AnimatedButton';

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
  const handleManageSentences = () => {
    router.push('/sentences');
  };

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
    <ScrollView className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <View className="p-6">
        {/* ヘッダーセクション */}
        <View className="items-center mb-8 mt-4">
          <View className="bg-white rounded-full p-3 shadow-xl mb-6 border border-blue-100">
            <Image
              source={require('@/assets/images/adaptive-icon.png')}
              className="w-28 h-28 rounded-full"
            />
          </View>
          <Text className="text-5xl font-bold text-gray-800 mb-3 tracking-tight">EarsUp</Text>
          <Text className="text-xl text-gray-600 text-center mb-6 font-medium">リスニングクイズアプリ</Text>
          {nickname ? (
            <View className="flex-row items-center mb-6">
              <View className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-full shadow-lg">
                <Text className="text-white font-bold text-lg">{nickname}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSettingsModalVisible(true)}
                className="ml-3 bg-white rounded-full p-3 shadow-lg border border-gray-200"
              >
                <Text className="text-gray-600 text-lg">✏️</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-gray-500">ニックネームを取得中...</Text>
          )}
          <Text className="text-base text-gray-600 text-center leading-7 px-4">
            音声を聞いて答えるクイズで{'\n'}みんなで楽しく英語を学習しよう！ 🎧
          </Text>
        </View>

        {/* メインアクションボタン */}
        <View className="mb-8 space-y-4">
          <AnimatedButton
            title="🎯 ルームを作成する"
            onPress={handleCreateRoom}
            variant="primary"
            size="large"
            fullWidth
            className="mb-4"
            animateOnMount={true}
            delay={100}
          />
          <AnimatedButton
            title="🤝 ルームに参加する"
            onPress={handleJoinRoom}
            variant="outline"
            size="large"
            fullWidth
            className="mb-4"
            animateOnMount={true}
            delay={200}
          />
          <AnimatedButton
            title="📝 例文登録"
            onPress={handleManageSentences}
            variant="secondary"
            size="medium"
            fullWidth
            animateOnMount={true}
            delay={300}
          />
        </View>

        {/* クイックスタートガイド */}
        <View className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 mb-6 border border-orange-100 shadow-lg">
          <Text className="text-xl font-bold text-orange-800 mb-4 text-center">
            ⚡ クイックスタート
          </Text>
          <View className="space-y-3">
            {[
              { step: '1', text: 'ルームを作成またはコードで参加', icon: '🏠' },
              { step: '2', text: 'クイズモードを選択', icon: '⚙️' },
              { step: '3', text: '音声を聞いて回答入力', icon: '🎧' },
              { step: '4', text: 'リアルタイムで結果発表！', icon: '🎉' },
            ].map((item) => (
              <View key={item.step} className="flex-row items-center mb-2 bg-white rounded-xl p-3 shadow-sm">
                <View className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full w-8 h-8 items-center justify-center mr-4">
                  <Text className="text-white text-sm font-bold">{item.step}</Text>
                </View>
                <Text className="text-lg mr-2">{item.icon}</Text>
                <Text className="text-orange-700 flex-1 font-medium">{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 詳細情報リンク */}
        <View className="mb-6 space-y-3">
          <View className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-3">
            <TouchableOpacity
              onPress={() => router.push('/features')}
              className="flex-row items-center justify-between p-5 active:bg-gray-50 rounded-2xl"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full items-center justify-center mr-4">
                  <Text className="text-2xl">🚀</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-lg">機能詳細</Text>
                  <Text className="text-gray-500 text-sm mt-1">全機能の詳しい説明と今後の予定</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <TouchableOpacity
              onPress={() => router.push('/guide')}
              className="flex-row items-center justify-between p-5 active:bg-gray-50 rounded-2xl"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full items-center justify-center mr-4">
                  <Text className="text-2xl">📚</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-lg">使い方ガイド</Text>
                  <Text className="text-gray-500 text-sm mt-1">詳しい操作方法とコツを解説</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>
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

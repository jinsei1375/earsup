import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import NicknameEditModal from '@/components/common/NicknameEditModal';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { Button } from '@/components/common/Button';
import { useToast } from '@/contexts/ToastContext';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';

export default function HomeScreen() {
  const userId = useUserStore((s) => s.userId);
  const storeNickname = useUserStore((s) => s.nickname);
  const { showError, showSuccess } = useToast();
  const setUserInfo = useUserStore((s) => s.setUserInfo);
  const [nickname, setNickname] = useState<string | null>(storeNickname);
  const [isNicknameEditModalVisible, setIsNicknameEditModalVisible] = useState(false);
  const { setSettingsConfig, showInfoModal } = useHeaderSettings();

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
  const handleSettingsPress = () => {
    showInfoModal();
  };

  useEffect(() => {
    setSettingsConfig({
      showSettings: true,
      onSettingsPress: handleSettingsPress,
    });

    // クリーンアップ時に設定をリセット
    return () => {
      setSettingsConfig({});
    };
  }, []);

  const handleCreateRoom = () => {
    router.push({ pathname: '/room', params: { mode: 'create' } });
  };
  const handleJoinRoom = () => {
    router.push({ pathname: '/room', params: { mode: 'join' } });
  };
  const handleManageSentences = () => {
    router.push('/sentences');
  };

  const handleNicknameUpdate = (newNickname: string) => {
    setNickname(newNickname);
    showSuccess('ニックネーム更新', 'ニックネームが更新されました');
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50">
      <View className="p-6">
        {/* ヘッダーセクション */}
        <View className="items-center mb-8 mt-4">
          <Text className="text-4xl font-bold text-gray-800 mb-2">EarsUp</Text>
          {nickname ? (
            <View className="flex-row items-center mb-4">
              <View className="bg-white px-4 py-2 rounded-full shadow-sm">
                <Text className="text-app-primary font-semibold">{nickname}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsNicknameEditModalVisible(true)}
                className="ml-2 bg-white rounded-full p-2 shadow-sm"
              >
                <FeatureIcon name="create" size={16} color={APP_COLORS.gray600} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-gray-500">ニックネームを取得中...</Text>
          )}
        </View>

        {/* メインアクションボタン */}
        <View className="mb-8">
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
            className="mb-4"
          />
          <Button
            title="マイセンテンス"
            onPress={handleManageSentences}
            variant="secondary"
            size="medium"
            fullWidth
          />
        </View>

        {/* クイックスタートガイド */}
        <View className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 mb-6">
          <View className="flex-row items-center justify-center mb-3">
            <FeatureIcon name="flash" size={20} color={APP_COLORS.warning} className="mr-2" />
            <Text className="text-lg font-bold text-app-orange-dark">クイックスタート</Text>
          </View>
          <View className="space-y-2">
            {[
              { step: '1', text: 'ルームを作成またはコードで参加' },
              { step: '2', text: 'クイズモードを選択' },
              { step: '3', text: '音声を聞いて回答入力' },
              { step: '4', text: 'リアルタイムで結果発表！' },
            ].map((item) => (
              <View key={item.step} className="flex-row items-center mb-1">
                <View className="bg-app-orange rounded-full w-5 h-5 items-center justify-center mr-3">
                  <Text className="text-white text-xs font-bold">{item.step}</Text>
                </View>
                <Text className="text-app-orange-dark flex-1 text-sm">{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 詳細情報リンク */}
        <View className="mb-6 space-y-3">
          <View className="bg-white rounded-xl shadow-sm border border-gray-200 mb-2">
            <TouchableOpacity
              onPress={() => router.push('/features')}
              className="flex-row items-center justify-between p-4 active:bg-gray-50"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-app-primary-light rounded-full items-center justify-center mr-3">
                  <FeatureIcon name="rocket" size={18} color={APP_COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold text-base">機能詳細</Text>
                  <Text className="text-gray-500 text-sm">全機能の詳しい説明と今後の予定</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-lg">›</Text>
            </TouchableOpacity>
          </View>

          {/* 回答比較デモ */}
          <View className="bg-white rounded-xl shadow-sm border border-gray-200 mb-2">
            <TouchableOpacity
              onPress={() => router.push('/diff-demo')}
              className="flex-row items-center justify-between p-4 active:bg-gray-50"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-app-purple-light rounded-full items-center justify-center mr-3">
                  <FeatureIcon name="analytics" size={18} color={APP_COLORS.info} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold text-base">回答自動判定デモ</Text>
                  <Text className="text-gray-500 text-sm">自動判定による回答の差分表示を体験</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-lg">›</Text>
            </TouchableOpacity>
          </View>

          {/* 一旦動線保留 */}
          {/* <View className="bg-white rounded-xl shadow-sm border border-gray-200 mb-2">
            <TouchableOpacity
              onPress={() => router.push('/word-input-demo')}
              className="flex-row items-center justify-between p-4 active:bg-gray-50"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-app-purple-light rounded-full items-center justify-center mr-3">
                  <FeatureIcon name="create" size={18} color={APP_COLORS.purple} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold text-base">単語入力デモ</Text>
                  <Text className="text-gray-500 text-sm">単語区切りでの入力体験</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-lg">›</Text>
            </TouchableOpacity>
          </View> */}

          <View className="bg-white rounded-xl shadow-sm border border-gray-200">
            <TouchableOpacity
              onPress={() => router.push('/guide')}
              className="flex-row items-center justify-between p-4 active:bg-gray-50"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-app-success-light rounded-full items-center justify-center mr-3">
                  <FeatureIcon name="book" size={18} color={APP_COLORS.success} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold text-base">使い方ガイド</Text>
                  <Text className="text-gray-500 text-sm">詳しい操作方法とコツを解説</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-lg">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* フッター */}
        <View className="items-center mt-4 mb-8">
          <Text className="text-xs text-gray-400 text-center">v1.0.0</Text>
        </View>
      </View>

      <NicknameEditModal
        visible={isNicknameEditModalVisible}
        onClose={() => setIsNicknameEditModalVisible(false)}
        currentNickname={nickname || ''}
        onNicknameUpdate={handleNicknameUpdate}
      />
    </ScrollView>
  );
}

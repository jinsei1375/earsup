import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { SettingsModal } from '@/components/common/SettingsModal';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';

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
    <View className="flex-1 items-center justify-center gap-4 px-4">
      {nickname ? (
        <Text className="text-xl font-bold text-blue-500">こんにちは、{nickname} さん！</Text>
      ) : (
        <Text>ニックネームを取得中...</Text>
      )}
      <Button title="ルーム作成" onPress={handleCreateRoom} />
      <Button title="ルーム参加" onPress={handleJoinRoom} />
      
      <SettingsModal
        isVisible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
        currentNickname={nickname || ''}
        onNicknameChange={handleNicknameChange}
      />
    </View>
  );
}

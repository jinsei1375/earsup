import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function HomeScreen() {
  const userId = useUserStore((s) => s.userId);
  const storeNickname = useUserStore((s) => s.nickname);
  const setUserInfo = useUserStore((s) => s.setUserInfo);
  const [nickname, setNickname] = useState<string | null>(storeNickname);

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

  const handleCreateRoom = () => {
    router.push({ pathname: '/room', params: { mode: 'create' } });
  };
  const handleJoinRoom = () => {
    router.push({ pathname: '/room', params: { mode: 'join' } });
  };

  return (
    <View style={styles.container}>
      {nickname ? <Text>こんにちは、{nickname} さん！</Text> : <Text>ニックネームを取得中...</Text>}
      <Button title="ルーム作成" onPress={handleCreateRoom} />
      <Button title="ルーム参加" onPress={handleJoinRoom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

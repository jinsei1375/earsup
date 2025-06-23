import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function TabOneScreen() {
  const userId = useUserStore((s) => s.userId);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    const fetchNickname = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', userId)
        .single();
      if (error || !data?.nickname) {
        // ニックネームが取得できなければ登録画面へ
        router.replace('/onboarding/nickname');
        return;
      }
      setNickname(data.nickname);
    };
    fetchNickname();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ホーム</Text>
      {nickname ? <Text>こんにちは、{nickname} さん！</Text> : <Text>ニックネームを取得中...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function HomeScreen() {
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
        router.replace('/onboarding/nickname');
        return;
      }
      setNickname(data.nickname);
    };
    fetchNickname();
  }, [userId]);

  return (
    <View style={styles.container}>
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

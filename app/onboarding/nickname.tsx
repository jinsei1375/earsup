// app/onboarding/nickname.tsx
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export default function NicknameScreen() {
  const [nickname, setNickname] = useState('');
  const setUserId = useUserStore((s) => s.setUserId);

  const handleSubmit = async () => {
    // 既存IDがあれば取得、なければ生成
    let userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      userId = uuidv4();
      await AsyncStorage.setItem('userId', userId);
    }
    // Supabaseに保存
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: userId, nickname })
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    setUserId(userId);
    router.replace('/'); // ホームに遷移
  };

  return (
    <View style={styles.container}>
      <Text>ニックネームを入力してください</Text>
      <TextInput
        style={styles.input}
        placeholder="例: EarsFan123"
        value={nickname}
        onChangeText={setNickname}
      />
      <Button title="登録して始める" onPress={handleSubmit} disabled={!nickname.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
});

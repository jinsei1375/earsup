// app/onboarding/nickname.tsx
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { KeyboardAccessoryView } from '@/components/common/KeyboardAccessoryView';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export default function NicknameScreen() {
  const [nickname, setNickname] = useState('');
  const setUserInfo = useUserStore((s) => s.setUserInfo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  // InputAccessoryView ID
  const inputAccessoryViewID = 'nickname-input-accessory';

  const handleSubmit = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // 既存IDがあれば取得、なければ生成
      let userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        userId = Crypto.randomUUID();
        await AsyncStorage.setItem('userId', userId);
      }

      // ニックネームも保存
      await AsyncStorage.setItem('userNickname', nickname);

      // Supabaseに保存
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          nickname,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // ストアに保存
      setUserInfo(userId, nickname);

      console.log('ユーザー登録完了:', { userId, nickname });
      router.replace('/'); // ホームに遷移
    } catch (err: any) {
      await handleError(err, 'ニックネーム登録エラー');
      setError(err.message || 'ニックネームの登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="space-y-4">
            <Text className="text-xl font-bold text-center mb-6">
              ニックネームを入力してください
            </Text>
            <TextInput
              className="border border-gray-300 p-4 rounded-lg text-lg"
              placeholder="例: EarsFan123"
              value={nickname}
              onChangeText={setNickname}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              inputAccessoryViewID={inputAccessoryViewID}
            />
            {error && <Text className="text-red-500 text-center">{error}</Text>}
            <View className="mt-6">
              <Button
                title={loading ? '登録中...' : '登録して始める'}
                onPress={handleSubmit}
                disabled={!nickname.trim() || loading}
                variant="primary"
                size="large"
                fullWidth
              />
            </View>
            {loading && (
              <View className="flex items-center">
                <LoadingSpinner variant="dots" color="#3B82F6" />
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* InputAccessoryView */}
      <KeyboardAccessoryView nativeID={inputAccessoryViewID} />
    </KeyboardAvoidingView>
  );
}

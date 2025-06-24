import { useUserStore } from '@/stores/userStore';
import { useEffect, useState } from 'react';
import { Slot, useRouter, useRootNavigationState, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import AppHeader from '@/components/AppHeader';

export default function RootLayout() {
  const userId = useUserStore((s) => s.userId);
  const setUserId = useUserStore((s) => s.setUserId);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 初回のみAsyncStorageからuserIdを復元
    (async () => {
      const storedId = await AsyncStorage.getItem('userId');
      if (storedId) setUserId(storedId);
      setIsReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!isReady || !rootNavigationState?.key) return;
    if (!userId) {
      setTimeout(() => {
        router.replace('/onboarding/nickname');
      }, 0);
    }
  }, [userId, rootNavigationState?.key, isReady]);

  if (!isReady) return null; // ローディング中は何も表示しない

  // パス名に基づいてヘッダーの設定を決定
  // ヘッダータイトルとバックボタンを画面ごとに設定
  const getHeaderConfig = () => {
    if (!pathname) return { title: 'EarSup', showBack: false };

    // URLからクエリパラメータを取得
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];

    switch (pathname) {
      case '/':
        return { title: 'EarSup', showBack: false };
      case '/room':
        return { title: 'ルーム', showBack: true };
      case '/quiz':
        return { title: 'リスニングクイズ', showBack: false }; // クイズ中は戻れないように
      case '/onboarding/nickname':
        return { title: 'ニックネーム設定', showBack: false };
      default:
        // 特定の画面にマッチしない場合、最後のセグメントをキャピタライズしてタイトルとして使用
        const title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
        return { title, showBack: true };
    }
  };

  const { title, showBack } = getHeaderConfig();

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title={title} showBackButton={showBack} onBackPress={() => router.back()} />
      <View style={styles.container}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
});

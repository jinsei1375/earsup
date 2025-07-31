import { useUserStore } from '@/stores/userStore';
import { useEffect, useState } from 'react';
import { Slot, useRouter, useRootNavigationState, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, View, StatusBar } from 'react-native';
import AppHeader from '@/components/AppHeader';
import { HeaderSettingsProvider, useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { ScreenTransition } from '@/components/common/ScreenTransition';
// グローバルCSSのインポート
import '@/assets/css/global.css';

export default function RootLayout() {
  return (
    <HeaderSettingsProvider>
      <RootLayoutContent />
    </HeaderSettingsProvider>
  );
}

function RootLayoutContent() {
  const userId = useUserStore((s) => s.userId);
  const setUserId = useUserStore((s) => s.setUserId);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const { settingsConfig } = useHeaderSettings();

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
      router.replace('/onboarding/nickname');
    }
  }, [userId, rootNavigationState?.key, isReady]);

  if (!isReady) return null; // ローディング中は何も表示しない

  // パス名に基づいてヘッダーのタイトルを決定
  // バックボタンは使用せず、各画面で明示的な遷移ボタンを設置する
  const getHeaderTitle = () => {
    if (!pathname) return 'EarsUp';

    // URLからクエリパラメータを取得
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];

    switch (pathname) {
      case '/':
        return 'EarsUp';
      case '/room':
        return 'ルーム';
      case '/quiz':
        return 'リスニングクイズ';
      case '/sentences':
        return '例文登録';
      case '/onboarding/nickname':
        return 'ニックネーム設定';
      default:
        // 特定の画面にマッチしない場合、最後のセグメントをキャピタライズしてタイトルとして使用
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    }
  };

  const title = getHeaderTitle();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppHeader title={title} settingsConfig={settingsConfig} />
      <ScreenTransition
        isVisible={isReady}
        type="fade"
        duration={300}
        className="flex-1"
      >
        <View className="flex-1" pointerEvents="auto">
          <Slot />
        </View>
      </ScreenTransition>
    </SafeAreaView>
  );
}

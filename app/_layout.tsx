import { useUserStore } from '@/stores/userStore';
import { useEffect, useState } from 'react';
import { Slot, useRouter, useRootNavigationState, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, View, StatusBar } from 'react-native';
import AppHeader from '@/components/AppHeader';
import { HeaderSettingsProvider, useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { ToastProvider } from '@/contexts/ToastContext';
// グローバルCSSのインポート
import '@/assets/css/global.css';

export default function RootLayout() {
  return (
    <ToastProvider>
      <HeaderSettingsProvider>
        <RootLayoutContent />
      </HeaderSettingsProvider>
    </ToastProvider>
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
      setTimeout(() => {
        router.replace('/onboarding/nickname');
      }, 0);
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
        return '';
      case '/room':
        return 'ルーム';
      case '/quiz':
        return 'リスニングクイズ';
      case '/sentences':
        return 'マイセンテンス';
      case '/onboarding/nickname':
        return 'ニックネーム設定';
      case '/guide':
        return '使い方ガイド';
      case '/features':
        return 'アプリの特徴';
      case '/terms':
        return '利用規約';
      case '/privacy':
        return 'プライバシーポリシー';
      case '/diff-demo':
        return '回答自動判定デモ';
      case '/setting':
        return '設定';
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
      <View className="flex-1" pointerEvents="auto">
        <Slot />
      </View>
    </SafeAreaView>
  );
}

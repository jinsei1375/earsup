import { useUserStore } from '@/stores/userStore';
import { useCallback, useEffect, useState } from 'react';
import { Slot, useRouter, useRootNavigationState, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import { HeaderSettingsProvider, useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import InfoModal from '@/components/common/InfoModal';
import { BannerAdUnit } from '@/components/ads/BannerAdUnit';
import { trackingTransparencyService } from '@/services/trackingTransparencyService';
import mobileAds from 'react-native-google-mobile-ads';
// グローバルCSSのインポート
import '@/assets/css/global.css';

export default function RootLayout() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <HeaderSettingsProvider>
          <RootLayoutContent />
        </HeaderSettingsProvider>
      </SettingsProvider>
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
  const { settingsConfig, isInfoModalVisible, hideInfoModal } = useHeaderSettings();

  // EarsUpサービス層パターン: AdMob初期化
  const initAdMob = useCallback(async () => {
    try {
      console.log('[AdMob] Initializing...');
      await mobileAds().initialize();
      console.log('[AdMob] Initialized successfully');
    } catch (err) {
      console.error('[AdMob] Initialization failed:', err);
    }
  }, []);

  // EarsUpサービス層パターン: App Tracking Transparency リクエスト
  const requestATT = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      console.log('[ATT] Not iOS, skipping');
      return;
    }

    try {
      console.log('[ATT] Starting request...');
      // サービス層で undetermined チェックを含む適切な処理を実行
      await trackingTransparencyService.requestTrackingPermission();
    } catch (err) {
      console.error('[ATT] Request failed:', err);
    }
  }, []);

  // アプリ初期化処理
  useEffect(() => {
    async function initApp() {
      try {
        console.log('[App] Starting initialization...');

        // 1. AdMob初期化（ATTなしでも動作可能）
        await initAdMob();

        // 2. UserIDの復元
        const storedId = await AsyncStorage.getItem('userId');
        if (storedId) {
          setUserId(storedId);
        }

        setIsReady(true);

        // 3. iOSの場合、アプリ起動後にATTリクエスト
        if (Platform.OS === 'ios') {
          // スプラッシュ画面との重複を避けるため遅延
          setTimeout(async () => {
            await requestATT();
          }, 1000);
        }
      } catch (error) {
        console.error('[App] Initialization failed:', error);
        setIsReady(true);
      }
    }

    initApp();
  }, [initAdMob, requestATT, setUserId]);

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
      case '/word-input-demo':
        return '単語入力デモ';
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
      <BannerAdUnit />
      <View className="flex-1" pointerEvents="auto">
        <Slot />
      </View>
      <InfoModal visible={isInfoModalVisible} onClose={hideInfoModal} />
    </SafeAreaView>
  );
}

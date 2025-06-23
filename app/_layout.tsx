import { useUserStore } from '@/stores/userStore';
import { useEffect, useState } from 'react';
import { Slot, useRouter, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const userId = useUserStore((s) => s.userId);
  const setUserId = useUserStore((s) => s.setUserId);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
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

  return <Slot />;
}

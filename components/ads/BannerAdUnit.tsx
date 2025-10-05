// components/ads/BannerAdUnit.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { usePathname } from 'expo-router';

// 広告を表示しない画面のパスリスト
const EXCLUDED_PATHS = ['/quiz', '/room'];

// 広告IDの設定
const adUnitId = __DEV__
  ? TestIds.BANNER
  : Platform.OS === 'ios'
  ? 'ca-app-pub-2855999657692570/9497318972' // 本番環境のiOS用広告ID
  : 'ca-app-pub-2855999657692570/9497318972'; // 本番環境のAndroid用広告ID (適宜変更)

interface BannerAdUnitProps {
  size?: BannerAdSize;
}

export const BannerAdUnit: React.FC<BannerAdUnitProps> = ({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adHeight, setAdHeight] = useState(50); // デフォルトの高さ
  const bannerRef = useRef(null);
  const pathname = usePathname();

  // 広告を表示すべきか判定
  const shouldShowAd = !EXCLUDED_PATHS.some((path) => pathname?.startsWith(path));

  // 広告のロード状態を管理
  useEffect(() => {
    // パスが除外リストにない場合のみ広告を初期化
    if (shouldShowAd) {
      setAdLoaded(false);
    }
  }, [pathname, shouldShowAd]);

  if (!shouldShowAd) {
    return null;
  }

  return (
    <View style={[styles.container, { height: adHeight }]}>
      <BannerAd
        ref={bannerRef}
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setAdLoaded(true);
          // ADAPTIVEバナーの場合は高さが動的に変わるので調整
          if (size.includes('ADAPTIVE')) {
            setAdHeight(60); // 適切な高さに調整
          }
        }}
        onAdFailedToLoad={(error) => {
          console.log('Ad failed to load:', error);
          setAdLoaded(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

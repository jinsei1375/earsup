import { Platform } from 'react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';

/**
 * EarsUpアプリのトラッキング透明性を管理するサービス
 * サービス層パターン: データアクセス層としてATT APIを抽象化
 */
class TrackingTransparencyService {
  /**
   * 現在のトラッキング許可ステータスを取得
   */
  async getTrackingPermissionStatus(): Promise<string> {
    if (Platform.OS !== 'ios') {
      console.log('[ATT] Not iOS, skipping');
      return 'unavailable';
    }

    try {
      const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
      console.log('[ATT] Current status:', status);
      return status;
    } catch (error) {
      console.error('[ATT] Failed to get status:', error);
      return 'unavailable';
    }
  }

  /**
   * ATT許可リクエストを表示
   * undetermined（未決定）の場合のみダイアログを表示
   */
  async requestTrackingPermission(): Promise<string> {
    if (Platform.OS !== 'ios') {
      console.log('[ATT] Not iOS, skipping');
      return 'unavailable';
    }

    try {
      // 現在のステータスを確認
      const currentStatus = await this.getTrackingPermissionStatus();

      // すでに応答済み（granted または denied）の場合はスキップ
      if (currentStatus !== 'undetermined') {
        console.log('[ATT] Already responded:', currentStatus);
        return currentStatus;
      }

      // undetermined の場合のみリクエスト実行
      console.log('[ATT] Requesting permission...');
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
      console.log('[ATT] Permission result:', status);
      return status;
    } catch (error) {
      console.error('[ATT] Request failed:', error);
      return 'unavailable';
    }
  }

  /**
   * トラッキングが許可されているか確認
   */
  async isTrackingAuthorized(): Promise<boolean> {
    const status = await this.getTrackingPermissionStatus();
    return status === 'granted';
  }
}

// シングルトンパターンでエクスポート
export const trackingTransparencyService = new TrackingTransparencyService();

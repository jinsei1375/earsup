// utils/errorUtils.ts

export interface ErrorInfo {
  message: string;
  isNetworkError: boolean;
  isOffline: boolean;
}

export const analyzeError = async (error: any): Promise<ErrorInfo> => {
  let isOffline = false;
  let isNetworkError = false;

  // Simple network check
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
    });

    clearTimeout(timeoutId);
  } catch {
    isOffline = true;
    isNetworkError = true;
  }

  let message = 'エラーが発生しました';

  if (isOffline) {
    message = 'インターネット接続がありません。接続を確認してください。';
  } else if (error?.message) {
    // Supabaseエラー
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      message = 'ネットワークエラーが発生しました。接続を確認してください。';
      isNetworkError = true;
    } else if (error.message.includes('timeout')) {
      message = 'タイムアウトエラーが発生しました。もう一度お試しください。';
      isNetworkError = true;
    } else if (error.message.includes('JWT')) {
      message = 'セッションが期限切れです。アプリを再起動してください。';
    } else if (
      error.message.includes('Permission denied') ||
      error.message.includes('Unauthorized')
    ) {
      message = 'アクセス権限がありません。';
    } else {
      message = error.message;
    }
  } else if (error?.code) {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        message = 'ネットワークエラーが発生しました。接続を確認してください。';
        isNetworkError = true;
        break;
      case 'UNAUTHORIZED':
        message = '認証エラーが発生しました。';
        break;
      default:
        message = `エラーコード: ${error.code}`;
    }
  }

  return {
    message,
    isNetworkError,
    isOffline,
  };
};

export const getRetryMessage = (isNetworkError: boolean, isOffline: boolean): string => {
  if (isOffline) {
    return 'インターネット接続を確認してから再試行してください。';
  } else if (isNetworkError) {
    return '接続状況を確認してから再試行してください。';
  } else {
    return 'しばらく待ってから再試行してください。';
  }
};

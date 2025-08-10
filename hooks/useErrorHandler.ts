// hooks/useErrorHandler.ts
import { useToast } from '@/contexts/ToastContext';
import { analyzeError, getRetryMessage } from '@/utils/errorUtils';

export const useErrorHandler = () => {
  const { showError } = useToast();

  const handleError = async (error: any, customMessage?: string) => {
    try {
      const errorInfo = await analyzeError(error);

      const title = customMessage || 'エラー';
      let message = errorInfo.message;

      if (errorInfo.isNetworkError || errorInfo.isOffline) {
        message += '\n' + getRetryMessage(errorInfo.isNetworkError, errorInfo.isOffline);
      }

      showError(title, message);

      // Log for debugging
      console.error('Error handled:', {
        originalError: error,
        analyzedError: errorInfo,
        customMessage,
      });
    } catch (analysisError) {
      // Fallback if error analysis fails
      showError(
        customMessage || 'エラー',
        'エラーが発生しました。しばらく待ってから再試行してください。'
      );
      console.error('Error analysis failed:', analysisError);
    }
  };

  const handleNetworkError = (customMessage?: string) => {
    showError(
      customMessage || 'ネットワークエラー',
      'インターネット接続を確認してから再試行してください。'
    );
  };

  const handleOfflineError = (customMessage?: string) => {
    showError(
      customMessage || 'オフライン',
      'インターネット接続がありません。接続を確認してください。'
    );
  };

  return {
    handleError,
    handleNetworkError,
    handleOfflineError,
  };
};

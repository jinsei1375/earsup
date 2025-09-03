// app/setting.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';

import { useToast } from '@/contexts/ToastContext';
import { useSettings } from '@/contexts/SettingsContext';

export default function Setting() {
  const { setSettingsConfig } = useHeaderSettings();
  const { settings, updateSettings, loading } = useSettings();
  const { showSuccess, showError } = useToast();

  const [voiceGender, setVoiceGender] = useState(settings?.default_voice_gender || 'male');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // ヘッダー設定
    setSettingsConfig({
      showBackButton: true,
      onBackPress: () => router.back(),
    });

    // クリーンアップ関数でヘッダー設定をリセット
    return () => {
      setSettingsConfig({});
    };
  }, [setSettingsConfig]);

  // 設定が読み込まれたら初期値を設定
  useEffect(() => {
    if (settings) {
      setVoiceGender(settings.default_voice_gender);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setUpdating(true);

      await updateSettings({
        default_voice_gender: voiceGender,
      });

      showSuccess('設定を保存しました');
    } catch (err) {
      showError('設定の保存に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  const hasChanges = () => {
    if (!settings) return false;
    return voiceGender !== settings.default_voice_gender;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <LoadingSpinner size="large" variant="pulse" />
          <Text className="text-app-neutral-600 mt-4">設定を読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (!settings) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-app-neutral-600 text-center mb-4">
            設定データの読み込みに失敗しました
          </Text>
          <Button title="再試行" onPress={() => window.location.reload()} variant="primary" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-neutral-50">
      <ScrollView className="flex-1 px-4 py-4">
        {/* デフォルト音声設定 */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <FeatureIcon name="volume-high" size={20} color={APP_COLORS.gray600} />
            <Text className="text-lg font-bold text-app-neutral-800 ml-2">デフォルト音声</Text>
          </View>

          <Text className="text-app-neutral-600 text-sm mb-3">
            クイズで使用される音声の性別を選択してください
          </Text>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => setVoiceGender('male')}
              className={`flex-1 p-4 rounded-lg border-2 ${
                voiceGender === 'male'
                  ? 'bg-app-primary border-app-primary'
                  : 'bg-white border-app-neutral-300'
              }`}
            >
              <View className="items-center">
                <FeatureIcon
                  name="man"
                  size={24}
                  color={voiceGender === 'male' ? APP_COLORS.white : APP_COLORS.gray600}
                />
                <Text
                  className={`mt-2 font-medium ${
                    voiceGender === 'male' ? 'text-white' : 'text-app-neutral-700'
                  }`}
                >
                  男性の声
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setVoiceGender('female')}
              className={`flex-1 p-4 rounded-lg border-2 ${
                voiceGender === 'female'
                  ? 'bg-app-primary border-app-primary'
                  : 'bg-white border-app-neutral-300'
              }`}
            >
              <View className="items-center">
                <FeatureIcon
                  name="woman"
                  size={24}
                  color={voiceGender === 'female' ? APP_COLORS.white : APP_COLORS.gray600}
                />
                <Text
                  className={`mt-2 font-medium ${
                    voiceGender === 'female' ? 'text-white' : 'text-app-neutral-700'
                  }`}
                >
                  女性の声
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 保存ボタン */}
        <View className="mt-4">
          <Button
            title={updating ? '保存中...' : '設定を保存'}
            onPress={handleSaveSettings}
            disabled={!hasChanges() || updating}
            variant={hasChanges() ? 'primary' : 'secondary'}
            fullWidth
          />

          {hasChanges() && (
            <Text className="text-app-primary text-sm text-center mt-2">
              変更が保存されていません
            </Text>
          )}
        </View>

        {/* 将来の拡張エリア */}
        <View className="bg-app-neutral-100 rounded-xl p-4 mt-6">
          <Text className="text-app-neutral-600 text-center font-medium">
            🚀 今後追加予定の設定
          </Text>
          <Text className="text-app-neutral-500 text-sm text-center mt-2">
            • ユーザーアイコン{'\n'}• テーマ（ダーク/ライト）{'\n'}• フォントサイズ{'\n'}•
            プッシュ通知
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

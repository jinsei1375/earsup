// app/setting.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';
import { supabase } from '@/lib/supabase';
import { audioService } from '@/services/audioService';
import { Ionicons } from '@expo/vector-icons';

import { useToast } from '@/contexts/ToastContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useUserStore } from '@/stores/userStore';

export default function Setting() {
  const { setSettingsConfig } = useHeaderSettings();
  const { settings, updateSettings, loading } = useSettings();
  const { showSuccess, showError } = useToast();
  const { userId, nickname, setUserInfo } = useUserStore();

  const [voiceGender, setVoiceGender] = useState(settings?.default_voice_gender || 'male');
  const [nicknameInput, setNicknameInput] = useState(nickname || '');
  const [updating, setUpdating] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<boolean>(false);

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

  // ニックネームが変更されたら初期値を設定
  useEffect(() => {
    if (nickname) {
      setNicknameInput(nickname);
    }
  }, [nickname]);

  const handleSaveSettings = async () => {
    if (!settings || !userId) return;

    const trimmedNickname = nicknameInput.trim();

    // バリデーション
    if (!trimmedNickname) {
      showError('ニックネームを入力してください');
      return;
    }

    if (trimmedNickname.length > 20) {
      showError('ニックネームは20文字以内で入力してください');
      return;
    }

    try {
      setUpdating(true);

      // ニックネームが変更されている場合、データベースを更新
      if (trimmedNickname !== nickname) {
        const { error: nicknameError } = await supabase
          .from('users')
          .update({ nickname: trimmedNickname })
          .eq('id', userId);

        if (nicknameError) {
          throw nicknameError;
        }

        // ストアを更新
        setUserInfo(userId, trimmedNickname);
      }

      // 音声設定が変更されている場合、設定を更新
      if (voiceGender !== settings.default_voice_gender) {
        await updateSettings({
          default_voice_gender: voiceGender,
        });
      }

      showSuccess('設定を保存しました');
    } catch (err) {
      showError('設定の保存に失敗しました');
      console.error('Settings save error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const hasChanges = () => {
    if (!settings) return false;
    const trimmedNickname = nicknameInput.trim();
    return voiceGender !== settings.default_voice_gender || trimmedNickname !== nickname;
  };

  const handlePlaySampleVoice = async (gender: 'male' | 'female') => {
    if (playingVoice) return; // 既に再生中の場合は何もしない

    try {
      setPlayingVoice(true);
      const sampleText = 'Hello! This is a sample voice for listening quiz.';
      const voiceSettings = {
        gender: gender,
        speed: 1.0,
      };
      await audioService.playText(sampleText, voiceSettings);
    } catch (error) {
      console.error('Sample voice playback failed:', error);
      showError('音声の再生に失敗しました');
    } finally {
      setPlayingVoice(false);
    }
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
        {/* ニックネーム設定 */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <FeatureIcon name="person" size={20} color={APP_COLORS.gray600} />
            <Text className="text-lg font-bold text-app-neutral-800 ml-2">ニックネーム</Text>
          </View>

          <Text className="text-app-neutral-600 text-sm mb-3">
            他のユーザーに表示されるニックネームを設定してください。
          </Text>

          <TextInput
            value={nicknameInput}
            onChangeText={setNicknameInput}
            placeholder="ニックネームを入力"
            className="bg-app-neutral-50 border border-app-neutral-300 rounded-lg px-4 py-3 text-app-neutral-800"
            maxLength={20}
          />
          <Text className="text-app-neutral-500 text-xs mt-1 text-right">
            {nicknameInput.length}/20文字
          </Text>
        </View>

        {/* デフォルト音声設定 */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <FeatureIcon name="volume-high" size={20} color={APP_COLORS.gray600} />
            <Text className="text-lg font-bold text-app-neutral-800 ml-2">デフォルト音声</Text>
          </View>

          <Text className="text-app-neutral-600 text-sm mb-3">
            クイズで使用される音声の性別を選択してください。{'\n'}
            ホストありモードでは、ホストが選択した音声設定が優先されます。
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setVoiceGender('male')}
              className={`flex-1 p-4 rounded-lg border-2 ${
                voiceGender === 'male'
                  ? 'bg-app-primary border-app-primary'
                  : 'bg-white border-app-neutral-300'
              }`}
            >
              <View className="items-center">
                <Text
                  className={`font-medium ${
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
                <Text
                  className={`font-medium ${
                    voiceGender === 'female' ? 'text-white' : 'text-app-neutral-700'
                  }`}
                >
                  女性の声
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* サンプル音声再生ボタン */}
          <View className="mt-4">
            <TouchableOpacity
              onPress={() => handlePlaySampleVoice(voiceGender)}
              disabled={playingVoice}
              className="flex-row items-center justify-center py-3 px-4 bg-app-neutral-100 rounded-lg border border-app-neutral-300"
            >
              {playingVoice ? (
                <LoadingSpinner size="small" />
              ) : (
                <Ionicons name="play" size={20} color={APP_COLORS.gray600} />
              )}
              <Text className="text-app-neutral-700 font-medium ml-2">サンプル音声を再生する</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 保存ボタン */}
        <View className="mt-6">
          <Button
            title={updating ? '保存中...' : '設定を保存'}
            onPress={handleSaveSettings}
            disabled={!hasChanges() || updating}
            variant={hasChanges() ? 'primary' : 'secondary'}
            fullWidth
          />

          {hasChanges() && (
            <Text className="text-app-primary text-sm text-center mt-3">
              変更が保存されていません
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

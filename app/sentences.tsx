// app/sentences.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/stores/userStore';
import { UserSentenceService } from '@/services/userSentenceService';
import { audioService } from '@/services/audioService';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { SentenceFormModal } from '@/components/sentences/SentenceFormModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import { useToast } from '@/contexts/ToastContext';
import { useSettings } from '@/contexts/SettingsContext';
import type { UserSentence } from '@/types';

export default function SentencesScreen() {
  const userId = useUserStore((s) => s.userId);
  const { setSettingsConfig } = useHeaderSettings();
  const { showError, showSuccess } = useToast();
  const { settings } = useSettings();
  const [sentences, setSentences] = useState<UserSentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingSentence, setEditingSentence] = useState<UserSentence | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isVisible: boolean;
    sentence: UserSentence | null;
  }>({ isVisible: false, sentence: null });
  const [playingSentenceId, setPlayingSentenceId] = useState<string | null>(null);

  useEffect(() => {
    // ヘッダー設定
    setSettingsConfig({
      showBackButton: true,
      onBackPress: handleGoBack,
      showAddButton: true,
      onAddPress: handleAddSentence,
      addButtonTitle: '追加',
    });

    // クリーンアップ関数でヘッダー設定をリセット
    return () => {
      setSettingsConfig({});
    };
  }, []);

  useEffect(() => {
    loadSentences();
  }, []);

  const loadSentences = async (isRefresh = false) => {
    if (!userId) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await UserSentenceService.getUserSentences(userId);
      setSentences(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddSentence = () => {
    setEditingSentence(null);
    setIsFormModalVisible(true);
  };

  const handleEditSentence = (sentence: UserSentence) => {
    setEditingSentence(sentence);
    setIsFormModalVisible(true);
  };

  const handleDeleteSentence = (sentence: UserSentence) => {
    setDeleteConfirmation({
      isVisible: true,
      sentence: sentence,
    });
  };

  const confirmDeleteSentence = async () => {
    const sentence = deleteConfirmation.sentence;
    if (!sentence) return;
    const sentenceId = sentence.id;

    try {
      await UserSentenceService.deleteUserSentence(sentenceId);
      showSuccess('削除完了', '削除しました');
      loadSentences();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError('削除エラー', err.message);
      } else {
        showError('削除エラー', 'マイセンテンスの削除に失敗しました');
      }
    } finally {
      setDeleteConfirmation({ isVisible: false, sentence: null });
    }
  };

  const handleSaveSentence = async (text: string, translation: string) => {
    if (!userId) return;

    try {
      if (editingSentence) {
        await UserSentenceService.updateUserSentence(editingSentence.id, text, translation);
        showSuccess('更新完了', '正常に更新されました');
      } else {
        await UserSentenceService.createUserSentence(userId, text, translation);
        showSuccess('保存完了', '正常に保存されました');
      }
      setIsFormModalVisible(false);
      loadSentences();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err; // Let the modal handle the error
      } else {
        throw new Error('An unknown error occurred.');
      }
    }
  };

  const handlePlaySentence = async (sentence: UserSentence) => {
    try {
      setPlayingSentenceId(sentence.id);
      await audioService.playText(sentence.text, {
        gender: settings?.default_voice_gender || 'female',
        speed: 1.0,
      });
    } catch (error) {
      console.error('Audio playback failed:', error);
      showError('音声エラー', '音声の再生に失敗しました');
    } finally {
      setPlayingSentenceId(null);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoadingSpinner variant="default" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">読み込み中...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadSentences(true)} />
        }
      >
        {error && (
          <View className="p-4">
            <ErrorMessage message={error} />
          </View>
        )}

        {sentences.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8 mt-16">
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text className="text-xl font-bold text-gray-600 mt-4 mb-2">例文がありません</Text>
            <Text className="text-gray-500 text-center leading-6 mb-6">
              最初の例文を登録してみましょう。{'\n'}
              クイズで使用する英語フレーズを{'\n'}
              自由に登録できます。
            </Text>
            <Button
              title="例文を追加"
              onPress={handleAddSentence}
              variant="primary"
              size="medium"
              icon={<Ionicons name="add" size={20} color="white" />}
            />
          </View>
        ) : (
          <View className="p-4">
            {sentences.map((sentence) => (
              <View
                key={sentence.id}
                className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-semibold text-gray-800 mb-1">
                      {sentence.text}
                    </Text>
                    {sentence.translation && (
                      <Text className="text-gray-600">{sentence.translation}</Text>
                    )}
                  </View>
                  <View className="flex-row">
                    <TouchableOpacity
                      onPress={() => handlePlaySentence(sentence)}
                      className="p-2 mr-1"
                      disabled={playingSentenceId === sentence.id}
                    >
                      <Ionicons
                        name={playingSentenceId === sentence.id ? 'volume-high' : 'play'}
                        size={20}
                        color={playingSentenceId === sentence.id ? '#3B82F6' : '#10B981'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleEditSentence(sentence)}
                      className="p-2 mr-1"
                    >
                      <Ionicons name="pencil" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSentence(sentence)}
                      className="p-2"
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text className="text-xs text-gray-400">
                  {new Date(sentence.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <SentenceFormModal
        isVisible={isFormModalVisible}
        onClose={() => setIsFormModalVisible(false)}
        onSave={handleSaveSentence}
        initialText={editingSentence?.text || ''}
        initialTranslation={editingSentence?.translation || ''}
        isEditing={!!editingSentence}
      />

      <ConfirmationModal
        isVisible={deleteConfirmation.isVisible}
        onClose={() => setDeleteConfirmation({ isVisible: false, sentence: null })}
        onConfirm={confirmDeleteSentence}
        title="マイセンテンスを削除"
        message={`「${deleteConfirmation.sentence?.text || ''}」を削除しますか？`}
        confirmText="削除"
        confirmVariant="destructive"
      />
    </View>
  );
}

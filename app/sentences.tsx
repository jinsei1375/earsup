// app/sentences.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/stores/userStore';
import { UserSentenceService } from '@/services/userSentenceService';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { SentenceFormModal } from '@/components/sentences/SentenceFormModal';
import { useHeaderSettings } from '@/contexts/HeaderSettingsContext';
import type { UserSentence } from '@/types';

export default function SentencesScreen() {
  const userId = useUserStore((s) => s.userId);
  const { setSettingsConfig } = useHeaderSettings();
  const [sentences, setSentences] = useState<UserSentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingSentence, setEditingSentence] = useState<UserSentence | null>(null);

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
    Alert.alert('例文を削除', `「${sentence.text}」を削除しますか？`, [
      {
        text: 'キャンセル',
        style: 'cancel',
      },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await UserSentenceService.deleteUserSentence(sentence.id);
            loadSentences();
          } catch (err: unknown) {
            if (err instanceof Error) {
              Alert.alert('エラー', err.message);
            } else {
              Alert.alert('エラー', '不明なエラーが発生しました');
            }
          }
        },
      },
    ]);
  };

  const handleSaveSentence = async (text: string, translation: string) => {
    if (!userId) return;

    try {
      if (editingSentence) {
        await UserSentenceService.updateUserSentence(editingSentence.id, text, translation);
      } else {
        await UserSentenceService.createUserSentence(userId, text, translation);
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
    </View>
  );
}

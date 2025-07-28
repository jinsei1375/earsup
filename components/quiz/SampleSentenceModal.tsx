// components/quiz/SampleSentenceModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { SampleSentenceService } from '@/services/sampleSentenceService';
import { UserSentenceService } from '@/services/userSentenceService';
import { useUserStore } from '@/stores/userStore';
import type { SampleSentence, SampleCategory, UserSentence } from '@/types';

interface SampleSentenceModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectSentence: (sentence: string) => void;
  hasCurrentText: boolean;
}

type TabType = 'sample' | 'user';

export const SampleSentenceModal: React.FC<SampleSentenceModalProps> = ({
  isVisible,
  onClose,
  onSelectSentence,
  hasCurrentText,
}) => {
  const userId = useUserStore((s) => s.userId);
  const [activeTab, setActiveTab] = useState<TabType>('sample');
  
  // Sample sentences state
  const [categories, setCategories] = useState<SampleCategory[]>([]);
  const [sentences, setSentences] = useState<SampleSentence[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // User sentences state
  const [userSentences, setUserSentences] = useState<UserSentence[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      if (activeTab === 'sample') {
        loadCategories();
      } else {
        loadUserSentences();
      }
    }
  }, [isVisible, activeTab]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const categoriesData = await SampleSentenceService.getCategories();
      setCategories(categoriesData);

      // 最初のカテゴリを自動選択
      if (categoriesData.length > 0) {
        setSelectedCategoryId(categoriesData[0].id);
        await loadSentences(categoriesData[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSentences = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const userSentencesData = await UserSentenceService.getUserSentences(userId);
      setUserSentences(userSentencesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSentences = async (categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      const sentencesData = await SampleSentenceService.getSentencesByCategory(categoryId);
      setSentences(sentencesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    await loadSentences(categoryId);
  };

  const handleSentenceSelect = (sentence: SampleSentence | UserSentence) => {
    if (hasCurrentText) {
      Alert.alert('入力内容の置換', 'すでに入力されている内容は削除されます。よろしいですか？', [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '置換する',
          style: 'destructive',
          onPress: () => {
            onSelectSentence(sentence.text);
            onClose();
          },
        },
      ]);
    } else {
      onSelectSentence(sentence.text);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedCategoryId(null);
    setSentences([]);
    setUserSentences([]);
    setError(null);
    setActiveTab('sample');
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-16 bg-white rounded-t-lg">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-xl font-bold">例文を選択</Text>
            <Button
              onPress={handleClose}
              variant="ghost"
              size="small"
              icon={<Ionicons name="close" size={24} color="#666" />}
            />
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-gray-200">
            <TouchableOpacity
              onPress={() => setActiveTab('sample')}
              className={`flex-1 py-3 ${
                activeTab === 'sample' ? 'border-b-2 border-blue-500' : ''
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  activeTab === 'sample' ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                サンプル文
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('user')}
              className={`flex-1 py-3 ${
                activeTab === 'user' ? 'border-b-2 border-blue-500' : ''
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  activeTab === 'user' ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                登録センテンス
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'sample' ? (
            <View className="flex-1 flex-row">
              {/* Category List */}
              <View className="w-1/3 border-r border-gray-200">
                <Text className="p-3 font-semibold bg-gray-50 border-b border-gray-200">
                  カテゴリ
                </Text>
                <ScrollView>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => handleCategorySelect(category.id)}
                      className={`p-3 border-b border-gray-100 ${
                        selectedCategoryId === category.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : ''
                      }`}
                    >
                      <Text
                        className={`${
                          selectedCategoryId === category.id
                            ? 'text-blue-700 font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Sample Sentence List */}
              <View className="flex-1">
                <Text className="p-3 font-semibold bg-gray-50 border-b border-gray-200">
                  サンプル文
                </Text>
                {loading ? (
                  <View className="flex-1 items-center justify-center">
                    <LoadingSpinner variant="default" color="#3B82F6" size="small" />
                  </View>
                ) : (
                  <ScrollView className="flex-1">
                    {sentences.map((sentence) => (
                      <TouchableOpacity
                        key={sentence.id}
                        onPress={() => handleSentenceSelect(sentence)}
                        className="p-4 border-b border-gray-100 active:bg-gray-50"
                      >
                        <Text className="text-base font-medium mb-1">{sentence.text}</Text>
                        {sentence.translation && (
                          <Text className="text-sm text-gray-600">{sentence.translation}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                    {sentences.length === 0 && !loading && (
                      <View className="p-8 items-center">
                        <Text className="text-gray-500 italic">
                          このカテゴリにはサンプル文がありません
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </View>
          ) : (
            /* User Sentences Tab */
            <View className="flex-1">
              <Text className="p-3 font-semibold bg-gray-50 border-b border-gray-200">
                登録したセンテンス
              </Text>
              {loading ? (
                <View className="flex-1 items-center justify-center">
                  <LoadingSpinner variant="default" color="#3B82F6" size="small" />
                </View>
              ) : (
                <ScrollView className="flex-1">
                  {userSentences.map((sentence) => (
                    <TouchableOpacity
                      key={sentence.id}
                      onPress={() => handleSentenceSelect(sentence)}
                      className="p-4 border-b border-gray-100 active:bg-gray-50"
                    >
                      <Text className="text-base font-medium mb-1">{sentence.text}</Text>
                      {sentence.translation && (
                        <Text className="text-sm text-gray-600">{sentence.translation}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {userSentences.length === 0 && !loading && (
                    <View className="p-8 items-center">
                      <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                      <Text className="text-gray-500 italic text-center mt-3 leading-6">
                        まだ例文が登録されていません。{'\n'}
                        「例文登録」画面から追加できます。
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          )}

          {error && (
            <View className="p-4 border-t border-gray-200">
              <ErrorMessage message={error} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

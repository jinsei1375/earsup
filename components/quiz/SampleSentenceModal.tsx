// components/quiz/SampleSentenceModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { SampleSentenceService } from '@/services/sampleSentenceService';
import type { SampleSentence, SampleCategory } from '@/types';

interface SampleSentenceModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectSentence: (sentence: string) => void;
  hasCurrentText: boolean;
}

export const SampleSentenceModal: React.FC<SampleSentenceModalProps> = ({
  isVisible,
  onClose,
  onSelectSentence,
  hasCurrentText,
}) => {
  const [categories, setCategories] = useState<SampleCategory[]>([]);
  const [sentences, setSentences] = useState<SampleSentence[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      loadCategories();
    }
  }, [isVisible]);

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

  const handleSentenceSelect = (sentence: SampleSentence) => {
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
    setError(null);
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
            <Text className="text-xl font-bold">サンプル文を選択</Text>
            <Button
              onPress={handleClose}
              variant="ghost"
              size="small"
              icon={<Ionicons name="close" size={24} color="#666" />}
            />
          </View>

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

            {/* Sentence List */}
            <View className="flex-1">
              <Text className="p-3 font-semibold bg-gray-50 border-b border-gray-200">
                サンプル文
              </Text>
              {loading ? (
                <View className="flex-1 items-center justify-center">
                  <LoadingSpinner />
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

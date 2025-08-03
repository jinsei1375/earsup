// components/quiz/QuestionList.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { SupabaseService } from '@/services/supabaseService';
import { useUserStore } from '@/stores/userStore';
import type { QuestionWithTranslation } from '@/types';

interface QuestionListProps {
  roomId: string;
  onAddToExamples?: (question: QuestionWithTranslation) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({ roomId, onAddToExamples }) => {
  const userId = useUserStore((s) => s.userId);
  const [questions, setQuestions] = useState<QuestionWithTranslation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = async () => {
    if (!roomId) return;

    setLoading(true);
    setError(null);

    try {
      const questionsData = await SupabaseService.getQuestionsWithTranslations(roomId);
      setQuestions(questionsData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('問題の取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomId) {
      loadQuestions();
    }
  }, [roomId]);

  const handleAddToExamples = (question: QuestionWithTranslation) => {
    if (onAddToExamples) {
      onAddToExamples(question);
    }
  };

  return (
    <View className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">出題された問題一覧</Text>
        <View className="flex-row items-center">
          <Ionicons name="document-text" size={20} color="#6B7280" />
        </View>
      </View>

      {/* Content */}
      <View style={{ maxHeight: 400 }}>
        <ScrollView className="p-4" showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
          {loading && (
            <View className="items-center py-8">
              <LoadingSpinner variant="default" color="#3B82F6" size="large" />
              <Text className="mt-4 text-gray-600">読み込み中...</Text>
            </View>
          )}

          {error && (
            <View className="mb-4">
              <ErrorMessage message={error} />
            </View>
          )}

          {!loading && questions.length === 0 && (
            <View className="items-center py-8">
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text className="text-xl font-bold text-gray-600 mt-4 mb-2">問題がありません</Text>
              <Text className="text-gray-500 text-center">
                このクイズではまだ問題が出題されていません
              </Text>
            </View>
          )}

          {!loading && questions.length > 0 && (
            <View>
              <Text className="text-sm text-gray-500 mb-4">
                全{questions.length}問が出題されました
              </Text>

              {questions.map((question, index) => (
                <View
                  key={question.id}
                  className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-600 mb-2">問題 {index + 1}</Text>
                    {onAddToExamples && (
                      <TouchableOpacity
                        onPress={() => handleAddToExamples(question)}
                        className="bg-blue-500 px-3 py-1 rounded-md flex-row items-center"
                        activeOpacity={0.7}
                        disabled={loading}
                        style={{ elevation: 2, zIndex: 10 }}
                      >
                        <Ionicons name="add" size={16} color="white" />
                        <Text className="text-white text-sm ml-1 font-medium">
                          マイセンテンスに追加
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text className="text-lg font-medium text-gray-800 mb-2">{question.text}</Text>

                  {question.translation && (
                    <Text className="text-gray-600 text-base">{question.translation}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

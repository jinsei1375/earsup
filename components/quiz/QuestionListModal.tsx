// components/quiz/QuestionListModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { SentenceFormModal } from '@/components/sentences/SentenceFormModal';
import { SupabaseService } from '@/services/supabaseService';
import { UserSentenceService } from '@/services/userSentenceService';
import { useUserStore } from '@/stores/userStore';
import type { QuestionWithTranslation } from '@/types';

interface QuestionListModalProps {
  isVisible: boolean;
  onClose: () => void;
  roomId: string;
}

export const QuestionListModal: React.FC<QuestionListModalProps> = ({
  isVisible,
  onClose,
  roomId,
}) => {
  const userId = useUserStore((s) => s.userId);
  const [questions, setQuestions] = useState<QuestionWithTranslation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSentenceModalVisible, setIsSentenceModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithTranslation | null>(null);

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
    if (isVisible && roomId) {
      loadQuestions();
    }
  }, [isVisible, roomId]);

  const handleAddToExamples = (question: QuestionWithTranslation) => {
    setSelectedQuestion(question);
    setIsSentenceModalVisible(true);
  };

  const handleSaveSentence = async (text: string, translation: string) => {
    if (!userId) {
      throw new Error('ユーザーが見つかりません');
    }

    try {
      await UserSentenceService.createUserSentence(userId, text, translation);
      setIsSentenceModalVisible(false);
      setSelectedQuestion(null);
      
      // Show success message
      if (Platform.OS === 'web') {
        console.log('例文に追加されました');
      } else {
        Alert.alert('成功', '例文に追加されました');
      }
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const handleClose = () => {
    setQuestions([]);
    setError(null);
    onClose();
  };

  return (
    <>
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View className="flex-1 bg-black/50 justify-center px-4 py-8">
          <View
            className="bg-white rounded-lg w-full"
            style={{ minHeight: '60%', maxHeight: '90%' }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">出題された問題一覧</Text>
              <Button
                onPress={handleClose}
                variant="ghost"
                size="small"
                icon={<Ionicons name="close" size={24} color="#666" />}
              />
            </View>

            {/* Content */}
            <ScrollView
              className="flex-1 p-4"
              showsVerticalScrollIndicator={true}
            >
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
                  <Text className="text-xl font-bold text-gray-600 mt-4 mb-2">
                    問題がありません
                  </Text>
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
                        <Text className="text-sm font-medium text-gray-600 mb-2">
                          問題 {index + 1}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleAddToExamples(question)}
                          className="bg-blue-500 px-3 py-1 rounded-md flex-row items-center"
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add" size={16} color="white" />
                          <Text className="text-white text-sm ml-1 font-medium">
                            例文に追加
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      <Text className="text-lg font-medium text-gray-800 mb-2">
                        {question.text}
                      </Text>
                      
                      {question.translation && (
                        <Text className="text-gray-600 text-base">
                          {question.translation}
                        </Text>
                      )}
                      
                      <Text className="text-xs text-gray-400 mt-2">
                        {new Date(question.created_at).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sentence Form Modal */}
      <SentenceFormModal
        isVisible={isSentenceModalVisible}
        onClose={() => {
          setIsSentenceModalVisible(false);
          setSelectedQuestion(null);
        }}
        onSave={handleSaveSentence}
        initialText={selectedQuestion?.text || ''}
        initialTranslation={selectedQuestion?.translation || ''}
        isEditing={false}
      />
    </>
  );
};
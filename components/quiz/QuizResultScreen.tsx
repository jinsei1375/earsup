// components/quiz/QuizResultScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import type { ParticipantWithNickname, Answer, QuestionWithTranslation } from '@/types';
import { calculateParticipantStats, addRanksToParticipantStats } from '@/utils/quizUtils';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QuestionList } from '@/components/quiz/QuestionList';
import { SentenceFormModal } from '@/components/sentences/SentenceFormModal';
import { UserSentenceService } from '@/services/userSentenceService';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/contexts/ToastContext';
import { Ionicons } from '@expo/vector-icons';

interface QuizResultScreenProps {
  participants: ParticipantWithNickname[];
  allRoomAnswers: Answer[];
  hostUserId?: string;
  isHost: boolean;
  loading: boolean;
  judgmentTypes?: Record<string, 'correct' | 'partial' | 'incorrect'>; // 判定タイプ
  onGoHome: () => void;
  roomId: string; // Add roomId to get questions
}

export const QuizResultScreen: React.FC<QuizResultScreenProps> = ({
  participants,
  allRoomAnswers,
  hostUserId,
  isHost,
  loading,
  judgmentTypes = {}, // デフォルトは空のオブジェクト
  onGoHome,
  roomId,
}) => {
  const userId = useUserStore((s) => s.userId);
  const { showSuccess } = useToast();
  const [isSentenceModalVisible, setIsSentenceModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithTranslation | null>(null);

  // 統計情報を計算して順位付きでソート
  const participantStatsWithRanks = addRanksToParticipantStats(
    calculateParticipantStats(participants, allRoomAnswers, hostUserId, judgmentTypes)
  ).sort((a, b) => {
    // 順位順でソート（同順位の場合はポイント順、さらに正解率順）
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    if (a.points !== b.points) {
      return b.points - a.points;
    }
    return b.accuracy - a.accuracy;
  });

  // 総問題数（ユニークなquestion_idの数で計算）
  const totalQuestions = new Set(allRoomAnswers.map((answer) => answer.question_id)).size;

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
        showSuccess('成功', '例文に追加されました');
      }
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* ヘッダー */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-app-success-dark mb-2">最終結果</Text>
          {totalQuestions > 0 && (
            <Text className="text-sm text-gray-500 mt-1">全{totalQuestions}問</Text>
          )}
        </View>

        {/* 最終結果 */}
        {participantStatsWithRanks.length > 0 && (
          <View className="mb-6">
            {/* 全参加者のランキング */}
            <View className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
              <ScrollView
                className="max-h-[300px]"
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {participantStatsWithRanks.map((stat) => {
                  const rank = stat.rank;

                  return (
                    <View
                      key={stat.userId}
                      className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                        rank === 1
                          ? 'bg-app-warning-light'
                          : rank === 2
                          ? 'bg-gray-100'
                          : rank === 3
                          ? 'bg-app-orange-light'
                          : 'bg-white'
                      }`}
                    >
                      <View className="flex-row items-center flex-1">
                        <Text className="text-2xl mr-3 min-w-[40px] font-bold text-gray-700">
                          {rank}位
                        </Text>
                        <View className="flex-1">
                          <Text className="font-bold text-lg">{stat.nickname}</Text>
                          <Text className="text-sm text-gray-600">
                            {stat.points}ポイント ({stat.correctAnswers}問正解
                            {stat.partialAnswers > 0 && `, ${stat.partialAnswers}問惜しい`} / 正解率
                            {stat.accuracy}
                            %)
                          </Text>
                        </View>
                      </View>
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-app-primary">{stat.points}</Text>
                        <Text className="text-xs text-gray-500">ポイント</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ホームに戻るボタン */}
        <View className="items-center">
          {loading ? (
            <LoadingSpinner variant="pulse" color="#3B82F6" size="large" className="mb-4" />
          ) : (
            <Button
              title="ホームに戻る"
              onPress={onGoHome}
              variant="primary"
              size="large"
              fullWidth
              className="mb-4"
            />
          )}
        </View>

        {/* 問題一覧セクション */}
        {totalQuestions > 0 && (
          <View className="mt-6">
            <QuestionList roomId={roomId} onAddToExamples={handleAddToExamples} />
          </View>
        )}
      </View>

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
    </ScrollView>
  );
};

// components/quiz/QuizResultScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import type { ParticipantWithNickname, Answer } from '@/types';
import { calculateParticipantStats, addRanksToParticipantStats } from '@/utils/quizUtils';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QuestionListModal } from '@/components/quiz/QuestionListModal';
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
  const [isQuestionListVisible, setIsQuestionListVisible] = useState(false);
  
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

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* ヘッダー */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-green-600 mb-2">最終結果</Text>
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
                          ? 'bg-yellow-100'
                          : rank === 2
                          ? 'bg-gray-100'
                          : rank === 3
                          ? 'bg-orange-100'
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
                        <Text className="text-2xl font-bold text-blue-600">{stat.points}</Text>
                        <Text className="text-xs text-gray-500">ポイント</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {/* 問題一覧ボタン */}
        {totalQuestions > 0 && (
          <View className="mb-6">
            <Button
              title="問題一覧を見る"
              onPress={() => setIsQuestionListVisible(true)}
              variant="secondary"
              size="large"
              fullWidth
              icon={<Ionicons name="list" size={20} color="#3B82F6" />}
              className="mb-2"
            />
            <Text className="text-center text-sm text-gray-500">
              出題された問題を確認して例文に追加できます
            </Text>
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
      </View>
      
      {/* Question List Modal */}
      <QuestionListModal
        isVisible={isQuestionListVisible}
        onClose={() => setIsQuestionListVisible(false)}
        roomId={roomId}
      />
    </ScrollView>
  );
};

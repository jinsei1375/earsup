// components/quiz/QuizResultScreen.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { ParticipantWithNickname, Answer } from '@/types';

interface QuizResultScreenProps {
  participants: ParticipantWithNickname[];
  allRoomAnswers: Answer[];
  hostUserId?: string;
  isHost: boolean;
  loading: boolean;
  onGoHome: () => void;
}

export const QuizResultScreen: React.FC<QuizResultScreenProps> = ({
  participants,
  allRoomAnswers,
  hostUserId,
  isHost,
  loading,
  onGoHome,
}) => {
  // 統計情報を計算（ポイント制：正解10ポイント、不正解0ポイント）
  const participantStats = participants
    .filter((participant) => participant.id !== hostUserId)
    .map((participant) => {
      const userAnswers = allRoomAnswers.filter((answer) => answer.user_id === participant.id);
      const correctAnswers = userAnswers.filter((answer) => answer.is_correct === true).length;
      const totalAnswers = userAnswers.length;
      const points = correctAnswers * 10; // 正解1問につき10ポイント

      return {
        userId: participant.id,
        nickname: participant.nickname,
        correctAnswers,
        totalAnswers,
        points,
        accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
      };
    })
    .sort((a, b) => {
      // ポイント順でソート（同点の場合は正解率順）
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
          <Text className="text-3xl font-bold text-green-600 mb-2">🏆 最終結果</Text>
          {totalQuestions > 0 && (
            <Text className="text-sm text-gray-500 mt-1">全{totalQuestions}問</Text>
          )}
        </View>

        {/* 最終結果 */}
        {participantStats.length > 0 && (
          <View className="mb-6">
            {/* 全参加者のランキング */}
            <View className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
              <ScrollView
                className="max-h-[300px]"
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {participantStats.map((stat, index) => {
                  const rank = index + 1;

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
                            {stat.points}ポイント ({stat.correctAnswers}問正解 / 正解率
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
    </ScrollView>
  );
};

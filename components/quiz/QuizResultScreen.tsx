// components/quiz/QuizResultScreen.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/common/Button';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { calculateParticipantStats } from '@/utils/quizUtils';
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
  // 統計情報を計算
  const participantStats = calculateParticipantStats(participants, allRoomAnswers, hostUserId);
  const nonHostStats = participantStats.filter((stat) => stat.userId !== hostUserId);

  // 順位付け（正解数→正解率順）
  const rankedStats = nonHostStats.sort((a, b) => {
    if (a.correctAnswers !== b.correctAnswers) {
      return b.correctAnswers - a.correctAnswers;
    }
    if (a.totalAnswers > 0 && b.totalAnswers > 0) {
      const accuracyA = a.correctAnswers / a.totalAnswers;
      const accuracyB = b.correctAnswers / b.totalAnswers;
      return accuracyB - accuracyA;
    }
    return 0;
  });

  // 総問題数（ユニークなquestion_idの数で計算）
  const totalQuestions = new Set(allRoomAnswers.map((answer) => answer.question_id)).size;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* ヘッダー */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-green-600 mb-2">🎉 クイズ終了！</Text>
          <Text className="text-lg text-gray-600">お疲れさまでした！</Text>
          {totalQuestions > 0 && (
            <Text className="text-sm text-gray-500 mt-1">全{totalQuestions}問</Text>
          )}
        </View>

        {/* 結果サマリー */}
        {rankedStats.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold mb-4 text-center">🏆 最終結果</Text>

            {/* トップ3の表彰台 */}
            <View className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl mb-4">
              {rankedStats.slice(0, 3).map((stat, index) => {
                const participant = participants.find((p) => p.id === stat.userId);
                const rank = index + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                const accuracy =
                  stat.totalAnswers > 0
                    ? Math.round((stat.correctAnswers / stat.totalAnswers) * 100)
                    : 0;

                return (
                  <View
                    key={stat.userId}
                    className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                      rank === 1 ? 'bg-yellow-100' : rank === 2 ? 'bg-gray-100' : 'bg-orange-100'
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      <Text className="text-2xl mr-3">{medal}</Text>
                      <View>
                        <Text className="font-bold text-lg">
                          {participant?.nickname || 'Unknown'}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {stat.correctAnswers}問正解 / 正解率{accuracy}%
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xl font-bold text-gray-700">{rank}位</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 詳細な参加者リスト */}
        <View className="mb-6">
          <Text className="text-lg font-bold mb-3">📊 詳細結果</Text>
          <ParticipantsList
            participants={participants}
            hostUserId={hostUserId}
            loading={false}
            onRefresh={() => {}}
            answers={allRoomAnswers}
          />
        </View>

        {/* 統計情報 */}
        {rankedStats.length > 0 && (
          <View className="bg-blue-50 p-4 rounded-xl mb-6">
            <Text className="text-lg font-bold mb-3 text-blue-800">📈 統計情報</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-blue-700">参加者数:</Text>
                <Text className="text-blue-700 font-bold">{rankedStats.length}名</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-blue-700">平均正解数:</Text>
                <Text className="text-blue-700 font-bold">
                  {(
                    rankedStats.reduce((sum, stat) => sum + stat.correctAnswers, 0) /
                    rankedStats.length
                  ).toFixed(1)}
                  問
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-blue-700">平均正解率:</Text>
                <Text className="text-blue-700 font-bold">
                  {Math.round(
                    rankedStats.reduce((sum, stat) => {
                      return (
                        sum +
                        (stat.totalAnswers > 0
                          ? (stat.correctAnswers / stat.totalAnswers) * 100
                          : 0)
                      );
                    }, 0) / rankedStats.length
                  )}
                  %
                </Text>
              </View>
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

          <Text className="text-sm text-gray-500 text-center">
            {isHost ? 'ホストとして' : '参加者として'}参加していただき、ありがとうございました！
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

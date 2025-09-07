// components/room/ParticipantsList.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { ParticipantWithNickname, Answer } from '@/types';
import { calculateParticipantStats, calculateParticipantRank } from '@/utils/quizUtils';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FeatureIcon, APP_COLORS } from '@/components/common/FeatureIcon';

interface ParticipantsListProps {
  participants: ParticipantWithNickname[];
  hostUserId?: string;
  currentUserId: string | null; // 現在のユーザーID
  loading: boolean;
  onRefresh: () => void;
  answers?: Answer[]; // Added to calculate stats
  judgmentTypes?: Record<string, 'correct' | 'partial' | 'incorrect'>; // 判定タイプ
  quizMode?: 'all-at-once-host' | 'all-at-once-auto'; // クイズモード
  currentQuestionAnswers?: Answer[]; // 現在の問題の回答（全員回答済み時に表示）
  showCurrentAnswers?: boolean; // 現在の問題の回答を表示するか
  trailingPunctuation?: string; // 句読点
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  hostUserId,
  currentUserId,
  loading,
  onRefresh,
  answers = [], // Default to empty array
  judgmentTypes = {}, // デフォルトは空のオブジェクト
  quizMode = 'all-at-once-host', // デフォルトはホストモード
  currentQuestionAnswers = [], // 現在の問題の回答
  showCurrentAnswers = false, // デフォルトは非表示
  trailingPunctuation = '', // デフォルトは空文字
}) => {
  // Calculate stats only if answers are provided (during quiz)

  const isAutoMode = quizMode === 'all-at-once-auto';

  // 参加者並び替え ホストありモード時はホストを除外
  const filteredParticipants = !isAutoMode
    ? participants.filter((p) => p.id !== hostUserId)
    : participants;

  // First calculate stats for sorting
  const participantStats =
    answers.length > 0
      ? calculateParticipantStats(participants, answers, hostUserId, judgmentTypes, quizMode)
      : null;

  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    // Sort by points if stats are available
    if (participantStats) {
      const statsA = participantStats.find((s) => s.userId === a.id);
      const statsB = participantStats.find((s) => s.userId === b.id);

      if (statsA && statsB) {
        // Sort by points first, then by accuracy
        if (statsA.points !== statsB.points) {
          return statsB.points - statsA.points;
        }
        if (statsA.totalAnswers > 0 && statsB.totalAnswers > 0) {
          const accuracyA = statsA.correctAnswers / statsA.totalAnswers;
          const accuracyB = statsB.correctAnswers / statsB.totalAnswers;
          return accuracyB - accuracyA;
        }
      }

      // Prioritize participants with stats over those without
      if (statsA && !statsB) return -1;
      if (!statsA && statsB) return 1;
    }

    // If no stats, put host first as fallback
    if (a.id === hostUserId) return -1;
    if (b.id === hostUserId) return 1;

    return 0;
  });

  // Get participant rank (including host) with tie handling
  const getRank = (userId: string): number | null => {
    if (!participantStats) return null;
    return calculateParticipantRank(participantStats, userId);
  };

  // Get progress bar width percentage
  const getProgressWidth = (correct: number, total: number): number => {
    if (total === 0) return 0;
    return (correct / total) * 100;
  };

  return (
    <>
      <View className="flex-row justify-between items-center w-full mt-2.5 mb-2.5">
        <Text className="text-lg font-semibold text-gray-800">
          参加者 ({String(filteredParticipants.length)}名)
        </Text>
        <Button
          title="更新"
          variant="outline"
          size="small"
          onPress={onRefresh}
          disabled={loading}
        />
        {loading && <LoadingSpinner variant="default" color="#3B82F6" size="small" />}
      </View>

      <View className="w-full my-2 border-2 border-gray-300 rounded-xl bg-gray-50 p-1 max-h-[300px]">
        <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true} bounces={false}>
          {sortedParticipants.length === 0 ? (
            <View className="p-6 bg-gray-50 rounded-xl items-center">
              <Text className="text-gray-500 text-center text-base">参加者がいません</Text>
            </View>
          ) : (
            sortedParticipants.map((participant, index) => {
              const stats = participantStats?.find((s) => s.userId === participant.id);
              const isHost = participant.id === hostUserId;
              const isCurrentUser = participant.id === currentUserId; // 自分かどうか
              const rank = getRank(participant.id);

              // 現在の問題に対するこの参加者の回答を取得
              const currentAnswer = showCurrentAnswers
                ? currentQuestionAnswers.find((answer) => answer.user_id === participant.id)
                : null;

              return (
                <View
                  key={participant.id}
                  className={`mb-3 p-3 rounded-xl shadow-sm ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-app-primary-light'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        {isCurrentUser && (
                          <View className="bg-app-primary rounded-full w-3 h-3 mr-2" />
                        )}
                        <Text
                          className={`text-base font-semibold ${
                            isCurrentUser ? 'text-app-primary-dark' : 'text-gray-800'
                          }`}
                        >
                          {participant.nickname}
                        </Text>
                        {isHost && !isAutoMode && (
                          <View className="ml-2 bg-app-primary px-2 py-0.5 rounded-full">
                            <Text className="text-xs text-white font-bold">ホスト</Text>
                          </View>
                        )}
                        {rank && (
                          <View
                            className={`ml-2 px-1.5 py-0.5 rounded-full ${
                              rank === 1
                                ? 'bg-app-warning-light'
                                : rank === 2
                                ? 'bg-gray-100'
                                : rank === 3
                                ? 'bg-app-orange-light'
                                : 'bg-app-primary-light'
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                rank === 1
                                  ? 'text-app-warning-dark'
                                  : rank === 2
                                  ? 'text-gray-700'
                                  : rank === 3
                                  ? 'text-app-orange-dark'
                                  : 'text-app-primary'
                              }`}
                            >
                              {rank}位
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {stats && (
                      <View className="items-end min-w-[100px]">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-2xl font-bold text-app-primary mr-1">
                            {String(stats.points)}
                          </Text>
                          <Text className="text-xs text-gray-500">ポイント</Text>
                        </View>
                        <Text className="text-sm text-gray-500 text-right">
                          ({String(stats.correctAnswers)}/{String(stats.totalAnswers)}問)
                        </Text>

                        {stats.totalAnswers > 0 && (
                          <>
                            <View className="w-20 h-2 bg-gray-200 rounded-full mb-1">
                              <View
                                className="h-full bg-app-success rounded-full"
                                style={{
                                  width: `${getProgressWidth(
                                    stats.correctAnswers,
                                    stats.totalAnswers
                                  )}%`,
                                }}
                              />
                            </View>
                            <Text className="text-xs text-app-success-dark font-medium mb-1">
                              正解率{' '}
                              {String(
                                Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
                              )}
                              %
                            </Text>

                            {/* Streak information */}
                            <View className="flex-row items-center">
                              {stats.currentStreak > 0 && (
                                <View className="bg-app-orange-light px-2 py-1 rounded-full mr-1 flex-row items-center">
                                  <FeatureIcon name="flame" size={12} color={APP_COLORS.warning} />
                                  <Text className="text-xs text-app-orange-dark font-bold ml-1">
                                    {String(stats.currentStreak)}連続
                                  </Text>
                                </View>
                              )}
                              {stats.maxStreak > 1 && (
                                <View className="bg-app-purple-light px-2 py-1 rounded-full">
                                  <Text className="text-xs text-app-purple-dark font-medium">
                                    最高{String(stats.maxStreak)}連続
                                  </Text>
                                </View>
                              )}
                            </View>
                          </>
                        )}

                        {stats.totalAnswers === 0 && (
                          <Text className="text-xs text-gray-400 mt-1">未回答</Text>
                        )}
                      </View>
                    )}

                    {!stats && !isHost && participantStats && (
                      <View className="items-end min-w-[100px]">
                        <View className="bg-gray-100 px-3 py-2 rounded-lg">
                          <Text className="text-xs text-gray-500 text-center">未参加</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* 現在の問題の回答表示（全員回答・判定済みの場合のみ） */}
                  {currentAnswer && (
                    <View className="mt-3 pt-3 border-t border-gray-200">
                      <Text className="text-xs text-gray-500 mb-1">今回の回答:</Text>
                      <View className="flex-row items-center">
                        <Text className="text-sm text-gray-800 flex-1">
                          「{currentAnswer.answer_text}」{isAutoMode && trailingPunctuation}
                        </Text>
                        {currentAnswer.judge_result && (
                          <View
                            className={`ml-2 px-2 py-1 rounded-full ${
                              currentAnswer.judge_result === 'correct'
                                ? 'bg-app-success-light'
                                : currentAnswer.judge_result === 'partial'
                                ? 'bg-app-orange-light'
                                : 'bg-app-danger-light'
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                currentAnswer.judge_result === 'correct'
                                  ? 'text-app-success-dark'
                                  : currentAnswer.judge_result === 'partial'
                                  ? 'text-app-orange-dark'
                                  : 'text-app-danger-dark'
                              }`}
                            >
                              {currentAnswer.judge_result === 'correct'
                                ? '正解'
                                : currentAnswer.judge_result === 'partial'
                                ? '惜しい'
                                : '不正解'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </>
  );
};

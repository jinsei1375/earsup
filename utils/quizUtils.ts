// utils/quizUtils.ts
import * as Speech from 'expo-speech';
import type { Answer, ParticipantWithNickname } from '@/types';
import { generateDiff, getJudgmentResult } from './diffUtils';

export const generateRoomCode = (): string => {
  return Math.random().toString(36).slice(-6).toUpperCase();
};

export const validateAnswer = (
  answer: string,
  correctAnswer: string,
  excludePunctuation: boolean = false
): boolean => {
  // 文字列の正規化を行う関数
  const normalizeText = (text: string): string => {
    let normalized = text.trim();

    // 全角・半角の正規化
    normalized = normalized
      // 全角英数字を半角に変換
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
      })
      // 全角スペースを半角スペースに変換
      .replace(/　/g, ' ')
      // 複数の半角スペースを1つに統一
      .replace(/\s+/g, ' ')
      // アポストロフィの正規化（' → '）
      .replace(/’/g, "'")
      // ダッシュの正規化（— → -）
      .replace(/[—–]/g, '-')
      // クォーテーションマークの正規化
      .replace(/[""]/g, '"')
      .replace(/['’]/g, "'");

    return normalized.toLowerCase();
  };

  let processedAnswer = normalizeText(answer);
  let processedCorrectAnswer = normalizeText(correctAnswer);

  if (excludePunctuation) {
    // Remove common punctuation marks for host-less mode comparison
    const punctuationRegex = /[.!?,:;]/g;
    processedAnswer = processedAnswer.replace(punctuationRegex, '');
    processedCorrectAnswer = processedCorrectAnswer.replace(punctuationRegex, '');
  }

  return processedAnswer === processedCorrectAnswer;
};

/**
 * 差分ベースの回答評価（ホストなしモード用）
 */
export const evaluateAnswerWithDiff = (
  answer: string,
  correctAnswer: string,
  excludePunctuation: boolean = true // デフォルトで句読点を除外
): 'correct' | 'close' | 'incorrect' => {
  if (!answer || !correctAnswer) {
    return 'incorrect';
  }

  // 常に句読点を除外する場合の処理
  let processedAnswer = answer.trim();
  let processedCorrectAnswer = correctAnswer.trim();

  if (excludePunctuation) {
    // 文末の句読点を除去
    processedAnswer = processedAnswer.replace(/[.!?]+$/, '');
    processedCorrectAnswer = processedCorrectAnswer.replace(/[.!?]+$/, '');
  }

  return getJudgmentResult(processedAnswer, processedCorrectAnswer);
};

export const speakText = (
  text: string,
  options?: {
    language?: string;
    rate?: number;
  }
): void => {
  Speech.speak(text, {
    language: options?.language || 'en-US',
    rate: options?.rate || 1.0,
  });
};

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}分前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}時間前`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}日前`;
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const isQuizActive = (status: string): boolean => {
  return status === 'active' || status === 'judged';
};

export const isQuizEnded = (status: string): boolean => {
  return status === 'ended';
};

export const canParticipantAnswer = (
  quizMode: string,
  currentBuzzer: string | null,
  userId: string | null
): boolean => {
  if (quizMode === 'all-at-once-host' || quizMode === 'all-at-once-auto') return true;
  return false;
};

export const canParticipantBuzzIn = (quizMode: string, currentBuzzer: string | null): boolean => {
  // 新しいモードでは早押し機能は使用しない
  return false;
};

export const getQuizModeDisplayName = (mode: string): string => {
  switch (mode) {
    case 'all-at-once-host':
      return '一斉回答（ホストあり）';
    case 'all-at-once-auto':
      return '一斉回答（ホストなし）';
    // 後方互換性のため
    case 'all-at-once':
      return '一斉回答モード';
    default:
      return 'モード不明';
  }
};

export const getStatusDisplayName = (status: string): string => {
  switch (status) {
    case 'waiting':
      return '待機中';
    case 'ready':
      return '開始準備';
    case 'active':
      return '出題中';
    case 'judged':
      return '判定中';
    case 'ended':
      return '終了';
    default:
      return '不明';
  }
};

export const shouldShowLoadingSpinner = (
  loading: boolean,
  force: boolean,
  hasData: boolean
): boolean => {
  return loading && force && !hasData;
};

export const truncateId = (id: string, length: number = 8): string => {
  return id.length > length ? `${id.slice(0, length)}...` : id;
};

export interface ParticipantStats {
  userId: string;
  nickname: string;
  correctAnswers: number;
  totalAnswers: number;
  points: number; // 正解10pt + 惜しい5pt
  partialAnswers: number; // 惜しい答え数
  accuracy: number; // 正解率（パーセント）
  currentStreak: number;
  maxStreak: number;
}

// Calculate consecutive correct answers (current streak)
export const calculateStreakStats = (
  answers: Answer[],
  userId: string
): { currentStreak: number; maxStreak: number } => {
  const userAnswers = answers
    .filter((answer) => answer.user_id === userId && answer.judged)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  for (const answer of userAnswers) {
    if (answer.judge_result === 'correct') {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current streak (from the end)
  for (let i = userAnswers.length - 1; i >= 0; i--) {
    if (userAnswers[i].judge_result === 'correct') {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, maxStreak };
};

export const calculateParticipantStats = (
  participants: ParticipantWithNickname[],
  answers: Answer[],
  hostUserId?: string,
  judgmentTypes?: Record<string, 'correct' | 'partial' | 'incorrect'>,
  quizMode?: 'all-at-once-host' | 'all-at-once-auto'
): ParticipantStats[] => {
  // ホストなしモードではホストも含める、ホストありモードではホストを除外
  const targetParticipants =
    quizMode === 'all-at-once-auto'
      ? participants // ホストなしモードではホストも含める
      : participants.filter((participant) => participant.id !== hostUserId); // ホストありモードではホストを除外

  return targetParticipants.map((participant) => {
    const userAnswers = answers.filter(
      (answer) => answer.user_id === participant.id && answer.judged
    );

    const correctAnswers = userAnswers.filter((answer) => answer.judge_result === 'correct').length;

    // 惜しい判定
    const partialAnswers = userAnswers.filter((answer) => answer.judge_result === 'partial').length;

    // ポイント計算: 正解10pt + 惜しい5pt
    const points = correctAnswers * 10 + partialAnswers * 5;

    // 正解率計算
    const accuracy =
      userAnswers.length > 0 ? Math.round((correctAnswers / userAnswers.length) * 100) : 0;

    const streakStats = calculateStreakStats(answers, participant.id);

    return {
      userId: participant.id,
      nickname: participant.nickname,
      correctAnswers,
      totalAnswers: userAnswers.length,
      points,
      partialAnswers, // 惜しい答え数を追加
      accuracy,
      currentStreak: streakStats.currentStreak,
      maxStreak: streakStats.maxStreak,
    };
  });
};

export const formatParticipantStats = (stats: ParticipantStats): string => {
  return `${stats.correctAnswers}/${stats.totalAnswers}`;
};

/**
 * 参加者の順位を計算する（同率順位対応）
 * @param participantStats ソート済みの参加者統計
 * @param userId 順位を取得したい参加者のID
 * @returns 順位（見つからない場合はnull）
 */
export const calculateParticipantRank = (
  participantStats: ParticipantStats[],
  userId: string
): number | null => {
  if (!participantStats || participantStats.length === 0) return null;

  // 参加者統計をソート（ポイント降順、正答率降順）
  const sortedStats = [...participantStats].sort((a, b) => {
    // Sort by points first
    if (a.points !== b.points) {
      return b.points - a.points;
    }
    // Then by accuracy as tiebreaker
    if (a.totalAnswers > 0 && b.totalAnswers > 0) {
      const accuracyA = a.correctAnswers / a.totalAnswers;
      const accuracyB = b.correctAnswers / b.totalAnswers;
      return accuracyB - accuracyA;
    }
    return 0;
  });

  // 指定されたユーザーの統計を探す
  const userStats = sortedStats.find((s) => s.userId === userId);
  if (!userStats) return null;

  // Helper function to check if two participants have the same performance
  const isSamePerformance = (statsA: ParticipantStats, statsB: ParticipantStats) => {
    if (statsA.points !== statsB.points) return false;

    // If both have answers, compare accuracy
    if (statsA.totalAnswers > 0 && statsB.totalAnswers > 0) {
      const accuracyA = statsA.correctAnswers / statsA.totalAnswers;
      const accuracyB = statsB.correctAnswers / statsB.totalAnswers;
      return Math.abs(accuracyA - accuracyB) < 0.001; // Small epsilon for floating point comparison
    }

    // If both have no answers, they're tied
    return statsA.totalAnswers === 0 && statsB.totalAnswers === 0;
  };

  // Calculate rank with tie handling
  let rank = 1;
  for (let i = 0; i < sortedStats.length; i++) {
    const currentStats = sortedStats[i];

    if (currentStats.userId === userId) {
      return rank;
    }

    // Check if next participant has different performance
    if (i + 1 < sortedStats.length) {
      const nextStats = sortedStats[i + 1];

      // If performance is different, next rank jumps by number of tied participants
      if (!isSamePerformance(currentStats, nextStats)) {
        rank = i + 2; // +2 because we're moving to next position (i+1) and rank is 1-indexed
      }
    }
  }

  return null;
};

/**
 * 参加者統計配列に順位情報を追加する
 * @param participantStats 参加者統計配列
 * @returns 順位情報付きの参加者統計配列
 */
export const addRanksToParticipantStats = (
  participantStats: ParticipantStats[]
): (ParticipantStats & { rank: number })[] => {
  return participantStats.map((stat) => ({
    ...stat,
    rank: calculateParticipantRank(participantStats, stat.userId) || 0,
  }));
};

/**
 * 問題文の末尾から句読点を抽出する関数
 * @param text 問題文
 * @returns 末尾の句読点（.!?など）
 */
export const extractTrailingPunctuation = (text: string): string => {
  if (!text) return '';
  const match = text.match(/[.!?]+$/);
  return match ? match[0] : '';
};

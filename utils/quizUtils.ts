// utils/quizUtils.ts
import * as Speech from 'expo-speech';
import type { Answer, ParticipantWithNickname } from '@/types';

export const generateRoomCode = (): string => {
  return Math.random().toString(36).slice(-6).toUpperCase();
};

export const validateAnswer = (
  answer: string,
  correctAnswer: string,
  excludePunctuation: boolean = false
): boolean => {
  let processedAnswer = answer.trim().toLowerCase();
  let processedCorrectAnswer = correctAnswer.trim().toLowerCase();

  if (excludePunctuation) {
    // Remove common punctuation marks for host-less mode comparison
    const punctuationRegex = /[.!?]/g;
    processedAnswer = processedAnswer.replace(punctuationRegex, '');
    processedCorrectAnswer = processedCorrectAnswer.replace(punctuationRegex, '');
  }

  return processedAnswer === processedCorrectAnswer;
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
  judgmentTypes?: Record<string, 'correct' | 'partial' | 'incorrect'>
): ParticipantStats[] => {
  return participants // ホストも含めて統計を計算
    .map((participant) => {
      const userAnswers = answers.filter(
        (answer) => answer.user_id === participant.id && answer.judged
      );

      const correctAnswers = userAnswers.filter(
        (answer) => answer.judge_result === 'correct'
      ).length;

      // 惜しい判定
      const partialAnswers = userAnswers.filter(
        (answer) => answer.judge_result === 'partial'
      ).length;

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

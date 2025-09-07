// hooks/useQuizData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { SupabaseService } from '@/services/supabaseService';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import type {
  Room,
  Question,
  Answer,
  Buzz,
  ParticipantWithNickname,
  Stamp,
  RealtimeConnectionState,
} from '@/types';
import { validateAnswer } from '@/utils/quizUtils';
import { getJudgmentResult } from '@/utils/diffUtils';

interface UseQuizDataOptions {
  roomId: string | null;
  userId: string | null;
  isHost: boolean;
  pollingInterval?: number;
  enableRealtime?: boolean;
}

export const useQuizData = (options: UseQuizDataOptions) => {
  const { roomId, userId, isHost, pollingInterval = 3000, enableRealtime = true } = options;

  const [room, setRoom] = useState<Room | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [allRoomAnswers, setAllRoomAnswers] = useState<Answer[]>([]); // 累積回答
  const [currentBuzzer, setCurrentBuzzer] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithNickname[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchRef = useRef<number>(0);
  const lastAnswersFetchRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { connectionState, subscribe, unsubscribe } = useRealtimeSubscription({
    channelName: `quiz-${roomId}`,
    onConnected: () => console.log(`Quiz realtime connected: ${roomId}`),
    onDisconnected: () => console.log(`Quiz realtime disconnected: ${roomId}`),
    onError: (error) => console.error('Quiz realtime error:', error),
  });

  const fetchQuizData = useCallback(
    async (force = false) => {
      if (!roomId) return;

      const now = Date.now();
      if (!force && now - lastFetchRef.current < 1000) {
        return; // Debounce rapid calls
      }
      lastFetchRef.current = now;

      // Only show loading for force updates when we have no data
      if (force) setLoading(true);

      try {
        setError(null);

        // Fetch room data
        const roomData = await SupabaseService.getRoomById(roomId);
        setRoom(roomData);

        // Fetch participants
        if (roomData) {
          const participantsData = await SupabaseService.getParticipantsWithNicknames(
            roomId,
            roomData.host_user_id
          );
          setParticipants(participantsData);
        }

        // Fetch all room answers for cumulative scoring
        await fetchAllRoomAnswers();

        // Fetch stamps
        // await fetchStamps();

        // Fetch latest question (only if room is active)
        if (roomData?.status === 'active') {
          const questionData = await SupabaseService.getLatestQuestion(roomId);
          setCurrentQuestion(questionData);

          if (questionData) {
            // Use fetchAnswersRef to avoid circular dependency
            const fetchAnswersFunc = fetchAnswersRef.current;
            if (fetchAnswersFunc) {
              await fetchAnswersFunc(true, questionData.id);
            }
          }
        } else if (roomData?.status === 'waiting' || roomData?.status === 'ready') {
          // Clear question state when room is waiting for new question
          setCurrentQuestion(null);
          setAnswers([]);
          setCurrentBuzzer(null);
        }
      } catch (err: any) {
        setError(err.message || 'クイズ情報の取得中にエラーが発生しました。');
        console.error('Quiz data fetch error:', err);
      } finally {
        if (force) setLoading(false);
      }
    },
    [roomId]
  );

  const fetchAnswers = useCallback(
    async (force = false, questionId?: string) => {
      const targetQuestionId = questionId || currentQuestion?.id;
      if (!roomId || !targetQuestionId) return;

      const now = Date.now();
      if (!force && now - lastAnswersFetchRef.current < 500) {
        return; // Debounce rapid calls
      }
      lastAnswersFetchRef.current = now;

      try {
        const answersData = await SupabaseService.getAnswersWithNicknames(targetQuestionId, roomId);
        setAnswers(answersData);
      } catch (err: any) {
        console.error('Answers fetch error:', err);
      }
    },
    [roomId] // Removed currentQuestion?.id from dependencies
  );

  const fetchAllRoomAnswers = useCallback(
    async (force = false) => {
      if (!roomId) return;

      try {
        const allAnswersData = await SupabaseService.getAllAnswersWithNicknamesForRoom(roomId);
        setAllRoomAnswers(allAnswersData);
      } catch (err: any) {
        console.error('All room answers fetch error:', err);
      }
    },
    [roomId]
  );

  const fetchStamps = useCallback(
    async (force = false) => {
      if (!roomId) return;

      try {
        const stampsData = await SupabaseService.getRecentStampsWithNicknames(roomId, 10);
        setStamps(stampsData);
      } catch (err: any) {
        console.error('Stamps fetch error:', err);
      }
    },
    [roomId]
  );

  // Create stable ref for fetchAnswers to avoid circular dependency
  const fetchAnswersRef = useRef(fetchAnswers);
  fetchAnswersRef.current = fetchAnswers;

  // Create stable refs for functions used in useEffect
  const fetchQuizDataRef = useRef(fetchQuizData);
  fetchQuizDataRef.current = fetchQuizData;

  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;

  const unsubscribeRef = useRef(unsubscribe);
  unsubscribeRef.current = unsubscribe;

  const createQuestion = useCallback(
    async (text: string, sampleSentenceId?: string) => {
      if (!roomId || !isHost) throw new Error('Invalid operation');

      setLoading(true);
      try {
        // Create question
        const questionData = await SupabaseService.createQuestion(
          roomId,
          text,
          'en-US',
          1.0,
          sampleSentenceId
        );

        // Update room status to active
        await SupabaseService.updateRoomStatus(roomId, 'active');

        setCurrentQuestion(questionData);
        setRoom((prev) => (prev ? { ...prev, status: 'active' } : null));

        // Refresh data
        await fetchQuizData(true);

        return questionData;
      } catch (err: any) {
        setError(err.message || '問題の作成中にエラーが発生しました。');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [roomId, isHost, fetchQuizData]
  );

  const submitAnswer = useCallback(
    async (answerText: string, isFirstCome = false, autoJudge = false) => {
      if (!roomId || !userId || !currentQuestion?.id) {
        throw new Error('Invalid operation');
      }

      setLoading(true);
      try {
        let judged = false;
        let judgmentResult: 'correct' | 'partial' | 'incorrect' | null = null;

        if (autoJudge) {
          judged = true;
          // ルームの設定に基づく詳細な判定を実行
          const partialThreshold = room?.partial_judgement_threshold || 70;
          const judgment = getJudgmentResult(answerText, currentQuestion.text, partialThreshold);

          switch (judgment) {
            case 'correct':
              judgmentResult = 'correct';
              break;
            case 'close':
              judgmentResult = 'partial';
              break;
            case 'incorrect':
              judgmentResult = 'incorrect';
              break;
          }
        }

        const answerData = await SupabaseService.submitAnswer(
          roomId,
          userId,
          currentQuestion.id,
          answerText,
          judged,
          judgmentResult
        );

        // Refresh answers
        const fetchAnswersFunc = fetchAnswersRef.current;
        if (fetchAnswersFunc) {
          await fetchAnswersFunc(true);
        }

        return answerData;
      } catch (err: any) {
        setError(err.message || '回答の送信中にエラーが発生しました。');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [roomId, userId, currentQuestion?.id] // Removed fetchAnswers from dependencies
  );

  const judgeAnswer = useCallback(
    async (answerId: string, judgmentResult: 'correct' | 'partial' | 'incorrect') => {
      if (!isHost) throw new Error('Invalid operation');

      // 楽観的UI更新：即座にUIを更新
      setAnswers((prevAnswers) =>
        prevAnswers.map((answer) =>
          answer.id === answerId
            ? {
                ...answer,
                judged: true,
                judge_result: judgmentResult,
              }
            : answer
        )
      );

      try {
        await SupabaseService.judgeAnswer(answerId, judgmentResult);

        // データベース更新後に最新データを取得（リアルタイム更新のバックアップ）
        const fetchAnswersFunc = fetchAnswersRef.current;
        if (fetchAnswersFunc) {
          await fetchAnswersFunc(true);
        }

        // 累積回答も更新
        await fetchAllRoomAnswers();
      } catch (err: any) {
        // エラー時は楽観的更新を戻す
        setAnswers((prevAnswers) =>
          prevAnswers.map((answer) =>
            answer.id === answerId ? { ...answer, judged: false, judge_result: null } : answer
          )
        );

        setError(err.message || '判定中にエラーが発生しました。');
        throw err;
      }
    },
    [isHost]
  );

  const buzzIn = useCallback(async () => {
    if (!roomId || !userId || !currentQuestion?.id) {
      throw new Error('Invalid operation');
    }

    setLoading(true);
    try {
      // Check existing buzz
      const existingBuzz = await SupabaseService.getExistingBuzz(roomId, currentQuestion.id);
      if (existingBuzz) {
        setLoading(false);
        return;
      }

      // Create buzz
      await SupabaseService.createBuzz(roomId, userId, currentQuestion.id);
      setCurrentBuzzer(userId);
    } catch (err: any) {
      setError(err.message || 'バズイン処理中にエラーが発生しました。');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roomId, userId, currentQuestion?.id]);

  const resetBuzz = useCallback(async () => {
    if (!roomId || !currentQuestion?.id || !isHost) {
      throw new Error('Invalid operation');
    }

    setLoading(true);
    try {
      await SupabaseService.resetBuzzes(roomId, currentQuestion.id);
      setCurrentBuzzer(null);
    } catch (err: any) {
      setError(err.message || 'バズインリセット中にエラーが発生しました。');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roomId, currentQuestion?.id, isHost]);

  const sendStamp = useCallback(
    async (stampType: string) => {
      if (!roomId || !userId) {
        throw new Error('Invalid operation');
      }

      try {
        await SupabaseService.sendStamp(roomId, userId, stampType);
        // Refresh stamps to show the new one
        // await fetchStamps(true);
      } catch (err: any) {
        setError(err.message || 'スタンプ送信中にエラーが発生しました。');
        throw err;
      }
    },
    [roomId, userId, fetchStamps]
  );

  const endQuiz = useCallback(async () => {
    if (!roomId || !isHost) throw new Error('Invalid operation');

    setLoading(true);
    try {
      // Update current question to inactive
      // if (currentQuestion?.id) {
      //   await SupabaseService.updateQuestion(currentQuestion.id, { is_active: false });
      // }

      // Update room status to ended
      await SupabaseService.updateRoomStatus(roomId, 'ended');

      // Clear local state
      setCurrentQuestion(null);
      setAnswers([]);
      setCurrentBuzzer(null);
      setRoom((prev) => (prev ? { ...prev, status: 'ended' } : null));
    } catch (err: any) {
      setError(err.message || 'クイズ終了処理中にエラーが発生しました。');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roomId, isHost, currentQuestion?.id]);

  const nextQuestion = useCallback(async () => {
    if (!roomId || !isHost) throw new Error('Invalid operation');

    setLoading(true);
    try {
      // 問題作成画面に戻るためにルームステータスを待機状態に戻す
      await SupabaseService.updateRoomStatus(roomId, 'waiting');

      // ローカル状態をクリア（新しい問題の準備）
      setCurrentQuestion(null);
      setAnswers([]);
      setCurrentBuzzer(null);
      setRoom((prev) => (prev ? { ...prev, status: 'waiting' } : null));

      // データ再取得は必要なし（問題作成画面に戻るため）
    } catch (err: any) {
      setError(err.message || '次の問題への移行中にエラーが発生しました。');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roomId, isHost]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!roomId || !enableRealtime) return;

    const subscriptions = [
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
        callback: (payload: any) => {
          console.log('Room changed:', payload);
          if (payload.new?.status !== room?.status) {
            fetchQuizDataRef.current(true);
          }
        },
      },
      {
        event: '*',
        schema: 'public',
        table: 'questions',
        filter: `room_id=eq.${roomId}`,
        callback: (payload: any) => {
          console.log('Question changed:', payload);
          fetchQuizDataRef.current(true);
        },
      },
      {
        event: '*',
        schema: 'public',
        table: 'answers',
        filter: `room_id=eq.${roomId}`,
        callback: (payload: any) => {
          console.log('Answer changed:', payload);
          fetchAnswersRef.current(true);
          fetchAllRoomAnswers(); // 累積回答も更新
        },
      },
      {
        event: '*',
        schema: 'public',
        table: 'buzzes',
        filter: `room_id=eq.${roomId}`,
        callback: (payload: any) => {
          console.log('Buzz changed:', payload);
          if (payload.eventType === 'INSERT') {
            setCurrentBuzzer(payload.new?.user_id);
          } else if (payload.eventType === 'DELETE') {
            setCurrentBuzzer(null);
          }
        },
      },
      {
        event: '*',
        schema: 'public',
        table: 'stamps',
        filter: `room_id=eq.${roomId}`,
        callback: (payload: any) => {
          console.log('Stamp changed:', payload);
          if (payload.eventType === 'INSERT') {
            // fetchStamps(true);
          }
        },
      },
    ];

    subscribeRef.current(subscriptions);

    return () => {
      unsubscribeRef.current();
    };
  }, [roomId, enableRealtime]);

  // Setup polling as backup
  useEffect(() => {
    if (!roomId) return;

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        fetchQuizDataRef.current(false);
      }, pollingInterval);
    };

    const startAnswersPolling = () => {
      if (answersIntervalRef.current) clearInterval(answersIntervalRef.current);

      answersIntervalRef.current = setInterval(() => {
        fetchAnswersRef.current(true);
      }, pollingInterval / 2);
    };

    startPolling();
    startAnswersPolling();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (answersIntervalRef.current) clearInterval(answersIntervalRef.current);
    };
  }, [roomId, pollingInterval]);

  // Initial fetch
  useEffect(() => {
    if (roomId) {
      fetchQuizDataRef.current(true);
    }
  }, [roomId]);

  const removeParticipant = useCallback(
    async (participantUserId: string) => {
      if (!roomId || !userId) return;

      try {
        if (isHost) {
          // ホストが退出する場合、ルームを終了
          await SupabaseService.endRoomByHost(roomId, userId);
        } else {
          // 参加者が退出する場合
          await SupabaseService.removeParticipant(roomId, participantUserId);
          // 参加者がいなくなったかチェックしてルーム終了判定
          await SupabaseService.checkAndEndRoomIfEmpty(roomId);
        }

        // データを再取得
        await fetchQuizDataRef.current(true);
      } catch (err: any) {
        setError(err.message || '退出処理中にエラーが発生しました。');
        throw err;
      }
    },
    [roomId, userId, isHost]
  );

  return {
    room,
    currentQuestion,
    answers,
    allRoomAnswers,
    currentBuzzer,
    participants,
    stamps,
    loading,
    error,
    connectionState,
    fetchQuizData,
    fetchAnswers,
    createQuestion,
    submitAnswer,
    judgeAnswer,
    buzzIn,
    resetBuzz,
    sendStamp,
    endQuiz,
    nextQuestion,
    removeParticipant,
    setError,
  };
};

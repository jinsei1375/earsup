// app/quiz.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';

// 定数定義
const POLLING_INTERVAL = 3000; // 3秒ごとにポーリング
const ANSWERS_DEBOUNCE_MS = 500; // 回答取得のデバウンス時間

export default function QuizScreen() {
  const params = useLocalSearchParams<{ roomId: string; role: string }>();
  const { roomId, role } = params;
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);
  const nickname = useUserStore((s) => s.nickname);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [questionText, setQuestionText] = useState('');
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [participants, setParticipants] = useState<Array<{ id: string; nickname: string }>>([]);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const [lastAnswersFetch, setLastAnswersFetch] = useState(0);
  const [answers, setAnswers] = useState<
    Array<{
      id: string;
      user_id: string;
      answer_text: string;
      is_correct: boolean | null;
      judged: boolean;
      nickname?: string; // nickname は後から追加するプロパティ
    }>
  >([]);
  // バズイン関連の状態
  const [currentBuzzer, setCurrentBuzzer] = useState<string | null>(null); // バズインしたユーザーのID

  const isHost = role === 'host' || room?.host_user_id === userId;

  // クイズモード（早押し/一斉回答）
  const quizMode = room?.quiz_mode || 'all-at-once';
  const isFirstComeMode = quizMode === 'first-come';
  const isAllAtOnceMode = quizMode === 'all-at-once';

  // ルーム情報と現在の問題を取得
  useEffect(() => {
    if (roomId) {
      console.log(`初期化: roomId=${roomId}, role=${role}, isHost=${isHost}`);

      // 初期データを強制的に取得
      fetchRoomAndQuestion(true);

      // リアルタイム更新を設定（改善版3.0）
      // タイムスタンプを含めない固定チャネル名で安定化
      const channelName = `room-quiz-${roomId}-stable`;
      console.log(
        `リアルタイムチャンネル設定: ${channelName} (${new Date().toLocaleTimeString()})`
      );

      // 既存のチャンネルクリーンアップはsupabaseが内部で処理

      const roomSubscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
          (payload: any) => {
            console.log('Room changed:', payload);
            const timestamp = new Date().toLocaleTimeString();

            // 状態が変わったら即時更新（改善版3.0）
            if (room?.status !== payload.new?.status) {
              console.log(
                `リアルタイム検知: statusが${room?.status}から${payload.new?.status}に変更されました`
              );

              // ended状態はクイズ終了専用ステータス
              if (payload.new?.status === 'ended') {
                console.log('ルームがended状態になりました。ホーム画面に戻ります。');

                // 参加者もホーム画面に戻る
                if (!isHost) {
                  // ステートをリセット
                  setCurrentQuestionId(null);
                  setQuestionText('');
                  setShowResult(false);
                  setAnswer('');
                  setIsCorrect(null);

                  console.log('参加者: ホストがクイズを終了したため、ホーム画面に戻ります');

                  // 複数のナビゲーション方法を試す（より確実に遷移させるため）
                  try {
                    // まず直接遷移を試みる
                    router.replace('/');

                    // バックアップとしてタイムアウトを設定
                    setTimeout(() => {
                      console.log('バックアップ: タイムアウトでのホーム画面遷移');
                      router.push('/');
                    }, 500);
                  } catch (e) {
                    console.error('ナビゲーションエラー:', e);
                    // エラー発生時は強制的にホーム画面へ
                    setTimeout(() => (location.href = '/'), 800);
                  }

                  return; // これ以上の処理はしない
                }
              }

              // それ以外の状態変更の場合は最新データを取得
              fetchRoomAndQuestion(true);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'questions', filter: `room_id=eq.${roomId}` },
          (payload: any) => {
            console.log('Question changed:', payload);
            const timestamp = new Date().toLocaleTimeString();

            // 新しい問題が作成された場合
            if (payload.eventType === 'INSERT') {
              console.log('新規問題が作成されました');
              fetchRoomAndQuestion(true);

              // 参加者のみ自動再生
              if (!isHost) {
                setAutoPlay(true);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'answers',
            filter: `room_id=eq.${roomId}`,
          },
          (payload: any) => {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`Answer changed (${timestamp}):`, payload);

            if (payload.eventType === 'INSERT') {
              console.log(
                `回答追加検知: ${timestamp} - ユーザーID: ${
                  payload.new?.user_id || 'unknown'
                }, 問題ID: ${payload.new?.question_id}`
              );

              // 追加された回答が現在の問題に対するものか確認
              if (payload.new?.question_id === currentQuestionId) {
                console.log('現在の問題への回答を検知しました。回答一覧を更新します。');
                // 明示的に回答を取得し直す (true でキャッシュを無視)
                fetchAnswers(true);
              } else {
                console.log('異なる問題IDへの回答です。無視します。');
              }
            } else if (payload.eventType === 'UPDATE') {
              console.log(
                `回答更新検知: ${timestamp} - ID: ${payload.new?.id}, 判定状態: ${payload.new?.judged}, 正誤: ${payload.new?.is_correct}`
              );
              fetchAnswers(true);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'buzzes',
            filter: `room_id=eq.${roomId}`,
          },
          (payload: any) => {
            console.log('Buzz changed:', payload);

            // バズイン情報が更新されたらバズインユーザーを更新
            if (payload.eventType === 'INSERT') {
              setCurrentBuzzer(payload.new?.user_id);
              console.log(`バズイン検知: ユーザーID=${payload.new?.user_id}`);
            } else if (payload.eventType === 'DELETE') {
              // バズインがリセットされた場合
              setCurrentBuzzer(null);
              console.log('バズインがリセットされました');
            }
          }
        )
        .subscribe((status) => {
          console.log(`Supabase realtime status: ${status}`);
          const isConnected = status === 'SUBSCRIBED';
          setRealtimeConnected(isConnected);

          if (isConnected) {
            setConnectionRetries(0); // リセット
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // 接続エラーの場合、ポーリング頻度を上げる
            console.log('リアルタイム接続エラー、ポーリング頻度を上げます');
          }
        });

      // リアルタイム更新が主要な手段、ポーリングはバックアップ（改善版）
      const basePollingFrequency = isHost ? 5000 : 3000; // ポーリング間隔を調整（頻度アップ）
      const answersPollingFrequency = isHost ? 2000 : 4000; // 回答データ用ポーリング間隔

      // ルーム/問題データ用ポーリング
      let lastPollTime = Date.now();
      const intervalId = setInterval(() => {
        // 最後のポーリングから1秒以内は実行しない（デバウンス効果）
        if (Date.now() - lastPollTime < 1000) return;

        lastPollTime = Date.now();
        const timestamp = new Date().toLocaleTimeString();
        console.log(`ポーリング実行: ${timestamp} - isHost=${isHost}`);

        // ルームと問題の情報を更新
        fetchRoomAndQuestion(false); // force=falseでローディングを表示しない
      }, basePollingFrequency);

      // 参加者専用: クイズ終了状態を検出するための追加ポーリング
      let lastStatusCheckTime = Date.now();
      const statusCheckIntervalId = !isHost
        ? setInterval(async () => {
            try {
              // 最後の確認から1.5秒以内は実行しない（デバウンス効果）
              if (Date.now() - lastStatusCheckTime < 1500) return;
              lastStatusCheckTime = Date.now();

              const { data, error } = await supabase
                .from('rooms')
                .select('status')
                .eq('id', roomId)
                .single();

              if (error) {
                console.error('ステータス確認エラー:', error);
                return;
              }

              // クイズ終了状態を検知
              if (data?.status === 'ended') {
                console.log('ポーリング検知: ルームがended状態です。ホーム画面に戻ります。');
                
                // roomステート更新（UI更新のため）
                setRoom((prev: any) => ({...prev, status: 'ended'}));

                // ステートをリセット
                setCurrentQuestionId(null);
                setQuestionText('');
                setShowResult(false);
                setAnswer('');
                setIsCorrect(null);

                // ナビゲーション (UI更新後に行うためタイムアウト設定)
                setTimeout(() => {
                  try {
                    console.log('ポーリングナビゲーション実行');
                    router.replace('/');
                  } catch (e) {
                    console.error('ナビゲーションエラー:', e);
                    setTimeout(() => (window.location.href = '/'), 800);
                  }
                }, 300);
              }
            } catch (err) {
              console.error('ステータス確認エラー:', err);
            }
          }, 2000)
        : null;

      // 回答データ専用のポーリング（特にホスト用）
      let lastAnswersPollTime = Date.now();
      const answersIntervalId = setInterval(() => {
        // ホストモードで現在問題がある場合は、回答データを定期的に強制更新
        if (
          (isHost || showResult) &&
          currentQuestionId &&
          Date.now() - lastAnswersPollTime > 1500
        ) {
          lastAnswersPollTime = Date.now();
          const timestamp = new Date().toLocaleTimeString();
          console.log(`回答データポーリング実行: ${timestamp}`);
          fetchAnswers(true); // 回答データを強制的に更新
        }
      }, answersPollingFrequency);

      return () => {
        console.log(`チャンネル${channelName}を解除します`);
        roomSubscription.unsubscribe();
        clearInterval(intervalId);
        clearInterval(answersIntervalId);
        if (statusCheckIntervalId) clearInterval(statusCheckIntervalId);
        console.log('すべてのポーリングとサブスクリプションを解除しました');
      };
    }
  }, [roomId]);

  // 自動再生用の効果 - 参加者用に強化
  useEffect(() => {
    if (questionText && !isHost) {
      // 参加者は自動再生を実行する (playCountに関わらず再生)
      console.log('参加者自動再生を開始します:', questionText);
      Speech.speak(questionText, {
        language: 'en-US',
        rate: 0.9, // 少しゆっくり目に
      });
      // 再生回数カウントをリセットしない (ホストの管理とは別にする)
    }
  }, [questionText, isHost]);

  // 自分の回答の判定状態を監視する（一斉回答モード用）
  useEffect(() => {
    if (isAllAtOnceMode && showResult && userId && currentQuestionId) {
      // 一斉回答モードで既に回答済みの場合、判定結果を確認し続ける
      console.log('参加者: 判定状況監視中...');

      // 自分の回答を見つけて判定結果を反映
      const myAnswer = answers.find((a) => a.user_id === userId);
      if (myAnswer) {
        console.log('自分の回答を検出:', {
          judged: myAnswer.judged,
          isCorrect: myAnswer.is_correct,
          id: myAnswer.id,
        });

        if (myAnswer.judged) {
          setIsCorrect(myAnswer.is_correct);
          console.log(`判定結果を更新: ${myAnswer.is_correct ? '正解' : '不正解'}`);
        }
      } else {
        // 回答がない場合は念のため回答リストを再取得
        console.log('自分の回答が見つかりません。データを再取得します。');
        fetchAnswers(true);
      }
    }
  }, [answers, isAllAtOnceMode, showResult, userId, currentQuestionId]);

  // 一斉回答モード用の追加ポーリング (判定結果取得用)
  useEffect(() => {
    // 一斉回答モードで回答済みの場合のみ定期的に回答状態を確認
    if (isAllAtOnceMode && showResult && !isHost) {
      console.log('判定結果確認用ポーリングを開始');
      const intervalId = setInterval(() => {
        fetchAnswers(true); // 強制的に回答データを更新
      }, 3000); // 3秒ごとに確認

      return () => clearInterval(intervalId);
    }
  }, [isAllAtOnceMode, showResult, isHost]);

  // 回答一覧を取得する関数（改善版）
  const fetchAnswers = async (force = false) => {
    if (!roomId || !currentQuestionId) return;

    const timestamp = new Date().toLocaleTimeString();
    console.log(
      `回答データ取得開始: roomId=${roomId}, questionId=${currentQuestionId}, 強制更新=${force}, 時刻=${timestamp}`
    );

    // デバウンス処理（強制更新でない場合のみ）
    const now = Date.now();
    if (!force && now - lastAnswersFetch < ANSWERS_DEBOUNCE_MS) {
      console.log(`デバウンス中のため取得をスキップ (${ANSWERS_DEBOUNCE_MS}ms未満)`);
      return;
    }

    // 最終取得時間を更新
    setLastAnswersFetch(now);

    try {
      // 現在の問題に対する回答を取得（キャッシュバスターを追加）
      const { data, error } = await supabase
        .from('answers')
        .select('id, user_id, answer_text, is_correct, judged')
        .eq('question_id', currentQuestionId)
        .eq('room_id', roomId) // roomIdによるフィルタを追加
        .order('created_at', { ascending: true });

      if (error) {
        console.error('回答取得エラー:', error);
        return;
      }

      // デバッグ：取得した回答データを詳細ログ
      console.log(
        `回答データ取得成功: ${data?.length || 0}件の回答 (時刻: ${timestamp})`,
        data.map((a) => ({
          id: a.id.slice(0, 8) + '...',
          user: a.user_id.slice(0, 8) + '...',
          answer: a.answer_text,
          judged: a.judged,
          correct: a.is_correct,
        }))
      );

      // データがない場合
      if (data.length === 0) {
        console.log('回答がまだありません');
        setAnswers([]);
        return;
      }

      // すべての回答に対するユーザー情報を取得
      const userIds = [...new Set(data.map((a) => a.user_id))]; // 重複を排除
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, nickname')
          .in('id', userIds);

        if (usersError) {
          console.error('ユーザー情報取得エラー:', usersError);
        }

        // ニックネーム情報を結合
        if (usersData && usersData.length > 0) {
          const userMap = new Map(usersData.map((u) => [u.id, u.nickname]));
          console.log('ユーザー情報を取得:', userMap.size, '件');

          // データにニックネームを追加
          const answersWithNickname = data.map((answer) => ({
            id: answer.id,
            user_id: answer.user_id,
            answer_text: answer.answer_text,
            is_correct: answer.is_correct,
            judged: answer.judged,
            nickname: userMap.get(answer.user_id) || '不明なユーザー',
          }));

          console.log('回答データをニックネーム付きでセット:', answersWithNickname.length, '件');
          setAnswers(answersWithNickname);
          return; // ここで終了
        }
      }

      // ユーザー情報が取得できなかった場合はそのまま設定
      const formattedAnswers = data.map((a) => ({
        id: a.id,
        user_id: a.user_id,
        answer_text: a.answer_text,
        is_correct: a.is_correct,
        judged: a.judged,
        nickname: undefined,
      }));

      console.log('ユーザー情報なしで回答データをセット:', formattedAnswers.length, '件');
      setAnswers(formattedAnswers);
    } catch (err) {
      console.error('回答データ取得エラー:', err);
    }
  };

  const fetchRoomAndQuestion = async (force = false) => {
    if (!roomId) return;

    // 出題中かどうかを判断
    const isActive = room?.status === 'active' || room?.status === 'judged';

    // 初回読み込みの場合のみローディングを表示し、定期的なポーリングでは表示しない
    // また、すでにデータがある場合やクイズ出題中は極力ローディングを表示しない
    const showLoading = !loading && force && (!room || !currentQuestionId) && !isActive;
    if (showLoading) setLoading(true);

    try {
      // キャッシュ無効化のためにタイムスタンプを追加
      const timestamp = new Date().getTime();

      // ルーム情報の取得
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()
        .throwOnError();

      if (roomError) throw roomError;

      // ルームステータスが変わったらログ出力
      const statusChanged = room?.status !== roomData.status;
      if (statusChanged) {
        console.log(
          `Room status changed from ${room?.status} to ${roomData.status} (${timestamp})`
        );
      }

      setRoom(roomData);

      // 最新の問題を取得 (キャッシュバスターを追加)
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .throwOnError();

      // 問題データの処理
      if (!questionError && questionData?.length > 0) {
        const newQuestionId = questionData[0].id;
        const questionChanged = currentQuestionId !== newQuestionId;

        // 問題IDが変わったらログ出力
        if (questionChanged) {
          console.log(`問題が変わりました: ${currentQuestionId} → ${newQuestionId} (${timestamp})`);

          // 問題が変わったら自動再生フラグを設定（参加者の場合）
          if (!isHost && (roomData.status === 'active' || roomData.status === 'judged')) {
            setAutoPlay(true);
          }
        }

        // フォース更新またはデータ変更時のみステート更新
        if (force || statusChanged || questionChanged || !currentQuestionId) {
          setCurrentQuestionId(newQuestionId);

          // 問題文の設定 - 参加者は状態条件を強化
          if (isHost || roomData.status === 'active' || roomData.status === 'judged') {
            setQuestionText(questionData[0].text);
            console.log(`問題文をセット: ${questionData[0].text.slice(0, 10)}... (${timestamp})`);

            // 問題が取得できたら回答も取得（改善版）
            if (questionData[0].id) {
              // 現在のcurrentQuestionIdに代入
              const questionIdChanged = currentQuestionId !== questionData[0].id;
              if (questionIdChanged) {
                console.log(`問題IDを更新: ${questionData[0].id}`);
                setCurrentQuestionId(questionData[0].id);

                // 問題が変わった場合は強制的に回答データを取得
                setTimeout(() => fetchAnswers(true), 300);
              } else {
                // 同じ問題の場合も念のため回答データを更新（特にホスト時）
                if (isHost) {
                  fetchAnswers(force);
                }
              }
            }
          }
        }
      } else if (questionError) {
        console.error('問題データ取得エラー:', questionError);
      } else {
        console.log(`問題データなし (${timestamp})`);
      }

      // 必要な場合のみ最新状態を反映（変更があった場合や強制更新時のみ）
      if (
        statusChanged ||
        force ||
        (questionData?.length > 0 && currentQuestionId !== questionData[0].id)
      ) {
        setLastUpdated(Date.now());
      }

      // 参加者かつactiveステータスなのに問題がない場合は念のため再取得
      // (ただしこの再取得もあまり頻繁に行わないように調整)
      if (
        !isHost &&
        roomData.status === 'active' &&
        !currentQuestionId &&
        !force &&
        Date.now() - lastUpdated > 3000
      ) {
        console.log('不整合を検出: active状態なのに問題IDがありません。再取得します。');
        setTimeout(() => fetchRoomAndQuestion(true), 1500);
      }
    } catch (err: any) {
      console.error('データ取得エラー:', err);
      setError(err.message || '情報の取得中にエラーが発生しました。');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!roomId || !questionText.trim() || !isHost) return;
    setLoading(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString();
      console.log(`問題作成を開始します... (${timestamp})`);

      // トランザクション的に処理するためバッチ処理を使用
      const updates = async () => {
        // 1. 新しい問題を作成
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert({
            room_id: roomId,
            text: questionText,
            speaker: 'en-US', // デフォルト設定
            speed: 1.0, // デフォルト設定
            created_at: timestamp,
          })
          .select()
          .single();

        if (questionError) {
          console.error('問題作成エラー:', questionError);
          throw questionError;
        }

        console.log(`問題を作成しました。ID: ${questionData.id}`);

        // 2. ルームのステータスを「出題中」に変更
        const { error: roomUpdateError } = await supabase
          .from('rooms')
          .update({
            status: 'active',
            updated_at: timestamp,
          })
          .eq('id', roomId);

        if (roomUpdateError) {
          console.error('ルームステータス更新エラー:', roomUpdateError);
          throw roomUpdateError;
        }

        console.log('ルームステータスを "active" に更新しました');

        return questionData;
      };

      // バッチ処理を実行
      const questionData = await updates();

      // ローカルステートを即時更新
      setCurrentQuestionId(questionData.id);
      console.log(`問題作成完了: ${new Date().toLocaleTimeString()}`);

      // 強制的にデータ再取得
      await fetchRoomAndQuestion(true);

      // 念のため200ms後にもう一度確認（非同期更新の反映を待つ）
      setTimeout(async () => {
        console.log('問題作成後の再確認を行います');
        await fetchRoomAndQuestion(true);

        // 音声再生
        handlePlayQuestion();
      }, 500);
    } catch (err: any) {
      setError(err.message || '問題の作成中にエラーが発生しました。');
      console.error('問題作成処理エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayQuestion = () => {
    if (playCount >= 3 || !questionText) return;

    Speech.speak(questionText, {
      language: 'en-US',
      rate: 1.0,
    });

    setPlayCount((c) => c + 1);
  };

  // バズインする（早押しモード用）
  const handleBuzzIn = async () => {
    if (!roomId || !currentQuestionId || !userId) return;
    setLoading(true);

    try {
      // 現在のバズイン状態を確認
      const { data: existingBuzz, error: checkError } = await supabase
        .from('buzzes')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('question_id', currentQuestionId)
        .maybeSingle();

      if (checkError) throw checkError;

      // 既にバズインがある場合は何もしない
      if (existingBuzz) {
        console.log('既にバズインがあります:', existingBuzz);
        setLoading(false);
        return;
      }

      // バズインを記録
      const { data, error } = await supabase
        .from('buzzes')
        .insert({
          room_id: roomId,
          user_id: userId,
          question_id: currentQuestionId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log('バズイン成功:', data);
      // バズイン成功後は回答入力フォームが表示される
    } catch (err: any) {
      setError(err.message || 'バズイン処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // バズインをリセット（ホスト専用）
  const handleResetBuzz = async () => {
    if (!roomId || !currentQuestionId || !isHost) return;
    setLoading(true);

    try {
      // バズインをすべて削除
      const { error } = await supabase
        .from('buzzes')
        .delete()
        .eq('room_id', roomId)
        .eq('question_id', currentQuestionId);

      if (error) throw error;

      setCurrentBuzzer(null);
      console.log('バズインをリセットしました');
    } catch (err: any) {
      setError(err.message || 'バズインリセット中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 回答を送信する
  const handleSubmitAnswer = async () => {
    if (!roomId || !currentQuestionId || !answer.trim()) return;
    // 回答送信時は明示的なユーザーアクションなので、ローディングを表示してフィードバックする
    setLoading(true);

    try {
      // 早押しモードで、自分がバズインしていない場合は回答できない
      if (isFirstComeMode && currentBuzzer !== userId) {
        throw new Error('回答権がありません。バズインしてください。');
      }

      // モードに応じて処理分岐
      if (isFirstComeMode) {
        // 早押しモードでは自動判定
        const isCorrectAnswer = answer.trim().toLowerCase() === questionText.toLowerCase();

        // ユーザーの回答を保存（自動判定付き）
        const { data, error } = await supabase
          .from('answers')
          .insert({
            room_id: roomId,
            user_id: userId,
            question_id: currentQuestionId,
            answer_text: answer,
            judged: true, // 自動判定を有効化
            is_correct: isCorrectAnswer,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        setShowResult(true);
        setIsCorrect(isCorrectAnswer);

        console.log('早押しモード: 回答を送信しました:', { answer, isCorrect: isCorrectAnswer });
      } else {
        // 一斉回答モードでは判定なしで保存するだけ
        const { data, error } = await supabase
          .from('answers')
          .insert({
            room_id: roomId,
            user_id: userId,
            question_id: currentQuestionId,
            answer_text: answer,
            judged: false, // ホストが判定するまで未判定
            is_correct: null, // 正誤はnull
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        setShowResult(true);
        // 判定結果はまだ表示しない（ホスト判定待ち）
        setIsCorrect(null);

        console.log('一斉回答モード: 回答を送信しました:', { answer });
      }

      // 回答データを再取得
      fetchAnswers(true);
    } catch (err: any) {
      setError(err.message || '回答の送信中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 回答の正誤を判定する（ホストのみ）- 改善版
  const handleJudgeAnswer = async (answerId: string, isCorrect: boolean) => {
    if (!roomId || !isHost) return;
    setLoading(true);

    const timestamp = new Date().toLocaleTimeString();
    console.log(
      `判定処理開始: ID=${answerId}, 判定=${isCorrect ? '正解' : '不正解'}, 時刻=${timestamp}`
    );

    try {
      // 回答の正誤を更新
      const { data, error } = await supabase
        .from('answers')
        .update({
          judged: true,
          is_correct: isCorrect,
        })
        .eq('id', answerId)
        .select() // 更新後のデータを取得
        .single();

      if (error) throw error;

      console.log(`回答ID ${answerId} を ${isCorrect ? '正解' : '不正解'} と判定しました:`, data);

      // 回答データを強制的に再取得
      fetchAnswers(true);

      // 成功フィードバックを表示
      const successMsg = isCorrect ? '正解と判定しました' : '不正解と判定しました';
      setError(null); // エラーをクリア

      // 念のため少し遅延させて回答リストを再取得（非同期更新が反映されるのを待つ）
      setTimeout(() => {
        console.log('判定後の遅延リロード実行');
        fetchAnswers(true);
      }, 500);
    } catch (err: any) {
      console.error('判定処理エラー:', err);
      setError(err.message || '正誤判定中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleEndQuiz = async () => {
    if (!roomId || !isHost) return;
    setLoading(true);

    try {
      const timestamp = new Date().toISOString();
      console.log(`クイズ終了処理開始: ${timestamp}`);

      // 現在の問題も終了状態にマークする（念のため）
      if (currentQuestionId) {
        try {
          await supabase
            .from('questions')
            .update({
              is_active: false,
              updated_at: timestamp,
            })
            .eq('id', currentQuestionId);
          console.log('現在の問題を非アクティブにしました');
        } catch (err) {
          // エラーは無視して続行
          console.error('問題状態更新エラー:', err);
        }
      }

      // クイズ終了専用のステータスに更新（参加者側でこのステータスを検知してホームに遷移する）
      console.log('クイズ終了ステータスに更新しています...');
      const { error } = await supabase
        .from('rooms')
        .update({
          status: 'ended', // クイズ終了専用のステータス
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      if (error) throw error;

      console.log('ルームのステータスを "ended" に更新しました');

      // ローカルステートをリセット
      setCurrentQuestionId(null);
      setQuestionText('');
      setAnswers([]);
      setPlayCount(0);
      setShowResult(false);
      setCurrentBuzzer(null);

      console.log('クイズ終了処理完了');

      // クイズ終了後にホーム画面に遷移
      setTimeout(() => {
        console.log('ホーム画面に遷移します');
        router.replace('/'); // replace を使うことでバック履歴に残らないようにする

        // 少し遅延させてからルームをリセット状態に戻す（全員が遷移後に実行する）
        setTimeout(async () => {
          try {
            // 念のため現在の質問やバズイン情報をクリア
            if (currentQuestionId) {
              try {
                // 現在の問題に関連するバズインをクリア
                await supabase
                  .from('buzzes')
                  .delete()
                  .eq('question_id', currentQuestionId);
                console.log('問題に関連するバズインをクリアしました');
              } catch (err) {
                console.error('バズインクリアエラー:', err);
              }
            }
            
            // 全員がホーム画面に戻った後でルームのステータスを「待機中」に戻す
            console.log('ルームをリセット状態に戻します');
            await supabase
              .from('rooms')
              .update({
                status: 'ready',
                updated_at: new Date().toISOString(),
              })
              .eq('id', roomId);
            console.log('ルームのステータスを "ready" に戻しました');
          } catch (resetErr) {
            console.error('ルームリセットエラー:', resetErr);
          }
        }, 2000); // 十分な時間を確保するために2000msに延長
      }, 800);
    } catch (err: any) {
      console.error('クイズ終了処理エラー:', err);
      setError(err.message || 'クイズ終了処理中にエラーが発生しました。');

      // エラー時でもホーム画面に強制的に戻る
      setTimeout(() => router.replace('/'), 1000);
    } finally {
      setLoading(false);
    }
  };

  // ホスト用の問題作成画面
  if (isHost && (!currentQuestionId || room?.status === 'ready')) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-4">問題を作成</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-lg my-4 w-full h-[120px]"
          style={{ textAlignVertical: 'top' }}
          placeholder="英語フレーズを入力してください"
          value={questionText}
          onChangeText={setQuestionText}
          multiline
          numberOfLines={4}
        />
        <Button
          title="この問題を出題する"
          onPress={handleCreateQuestion}
          disabled={!questionText.trim() || loading}
        />
        {loading && <ActivityIndicator className="mt-4" />}
        {error && <Text className="mt-4 text-red-500">{error}</Text>}
      </View>
    );
  }

  // ホスト用の問題表示・管理画面
  if (isHost && currentQuestionId) {
    // 既にクイズ画面でホストの画面は別処理されるので、この分岐は不要になりました
    // このコードブロックはそのまま残しておきます
  } // 参加者用の待機画面・回答画面
  if (!isHost) {
    // 強制的に状態を確認して、activeの場合は問題表示画面を表示
    // readyの場合は待機画面に戻る
    const isQuizActive = room?.status === 'active' || room?.status === 'judged';
    const isRoomReady = room?.status === 'ready';
    const isQuizEnded = room?.status === 'ended';
    const hasQuestion = !!currentQuestionId && !!questionText && isQuizActive;

    // 早押しモード関連の状態
    const canBuzzIn = isFirstComeMode && !currentBuzzer && isQuizActive;
    const hasBuzzedIn = isFirstComeMode && currentBuzzer === userId && isQuizActive;
    const otherHasBuzzed =
      isFirstComeMode && currentBuzzer && currentBuzzer !== userId && isQuizActive;

    console.log('参加者画面の状態:', {
      isQuizActive,
      isRoomReady,
      hasQuestion,
      status: room?.status,
      questionId: currentQuestionId,
      questionTextLength: questionText?.length || 0,
      quizMode,
      currentBuzzer,
    });

    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-4">リスニングクイズ</Text>

        {/* リアルタイム接続状況表示 */}
        <View className="flex-row items-center mb-3">
          <Text className={`text-sm ${realtimeConnected ? 'text-green-600' : 'text-gray-500'}`}>
            ● {realtimeConnected ? 'リアルタイム更新中' : 'ポーリング更新中'}
          </Text>
        </View>

        {!hasQuestion || isRoomReady || isQuizEnded ? (
          // 問題未作成、ホスト待機中、またはクイズ終了状態
          <>
            {isQuizEnded ? (
              <>
                <Text className="text-green-600 font-bold text-lg mb-3">クイズが終了しました</Text>
                <Text className="mb-3">ホーム画面に移動しています...</Text>
                <ActivityIndicator size="large" color="#0000ff" />
                {/* クイズ終了画面表示時に自動的にホームに遷移するロジック */}
                {React.useEffect(() => {
                  console.log('クイズ終了画面表示：自動的にホームに遷移します');
                  // 複数の方法で遷移を試行
                  const redirectTimer = setTimeout(() => {
                    try {
                      router.replace('/');
                    } catch (e) {
                      console.error('ナビゲーションエラー:', e);
                      setTimeout(() => window.location.href = '/', 500);
                    }
                  }, 1000);
                  return () => clearTimeout(redirectTimer);
                }, [])}
              </>
            ) : (
              <>
                <Text>ホストが問題を作成中です...</Text>
                <Button
                  title="状態を更新"
                  onPress={() => {
                    // 状態を強制的に更新
                    fetchRoomAndQuestion(true);
                    // クイズ終了後の状態をリセット
                    if (isRoomReady) {
                      setShowResult(false);
                      setAnswer('');
                      setIsCorrect(null);
                    }
                  }}
                />
              </>
            )}
          </>
        ) : (
          // 出題中・回答可能
          <>
            <Text className="text-lg font-bold text-green-500 my-4">問題が出題されました!</Text>

            {/* クイズモードによって異なる表示 */}
            {isFirstComeMode ? (
              // 早押しモードの場合
              <>
                {canBuzzIn ? (
                  // バズイン可能状態
                  <TouchableOpacity
                    onPress={handleBuzzIn}
                    disabled={loading}
                    className="bg-blue-500 p-6 rounded-full my-4"
                  >
                    <Text className="text-white text-center text-xl font-bold">押す!</Text>
                  </TouchableOpacity>
                ) : hasBuzzedIn ? (
                  // 自分がバズイン済みの場合
                  <>
                    <View className="bg-green-100 p-3 rounded-lg mb-4">
                      <Text className="text-green-800 text-center">
                        あなたが回答権を獲得しました！
                      </Text>
                    </View>

                    <TextInput
                      className="border border-gray-300 p-3 rounded-lg my-4 w-full"
                      placeholder="聞こえたフレーズを入力"
                      value={answer}
                      onChangeText={setAnswer}
                      editable={!showResult}
                    />

                    <Button
                      title="解答する"
                      onPress={handleSubmitAnswer}
                      disabled={!answer.trim() || showResult || loading}
                    />
                  </>
                ) : (
                  // 他の人がバズイン済みの場合
                  <View className="bg-red-100 p-3 rounded-lg">
                    <Text className="text-red-800 text-center">他の参加者が回答中です</Text>
                  </View>
                )}
              </>
            ) : // 一斉回答モード
            !showResult ? (
              // まだ回答していない場合
              <>
                <TextInput
                  className="border border-gray-300 p-3 rounded-lg my-4 w-full"
                  placeholder="聞こえたフレーズを入力"
                  value={answer}
                  onChangeText={setAnswer}
                  editable={!showResult}
                />

                <Button
                  title="解答する"
                  onPress={handleSubmitAnswer}
                  disabled={!answer.trim() || showResult || loading}
                />
              </>
            ) : (
              // 一斉回答モードで回答済みの場合
              <View className="bg-blue-100 p-4 rounded-lg my-4">
                {isCorrect === null ? (
                  // まだ判定されていない場合
                  <>
                    <Text className="text-center font-bold text-blue-800 mb-1">
                      回答を提出しました
                    </Text>
                    <Text className="text-center text-blue-600">ホストの判定をお待ちください</Text>
                  </>
                ) : isCorrect ? (
                  // 正解と判定された場合
                  <>
                    <Text className="text-center font-bold text-green-800 mb-1">正解！</Text>
                    <Text className="text-center text-green-600">
                      あなたの回答が正解と判定されました
                    </Text>
                  </>
                ) : (
                  // 不正解と判定された場合
                  <>
                    <Text className="text-center font-bold text-red-800 mb-1">不正解</Text>
                    <Text className="text-center text-red-600">
                      あなたの回答が不正解と判定されました
                    </Text>
                    <Text className="text-center text-black mt-2">正解: {questionText}</Text>
                  </>
                )}
              </View>
            )}

            {showResult && (
              <View className="mt-6 items-center">
                {isFirstComeMode ? (
                  // 早押しモード: 即時判定結果を表示
                  <>
                    <Text
                      className={
                        isCorrect
                          ? 'text-green-600 font-bold text-lg'
                          : 'text-red-600 font-bold text-lg'
                      }
                    >
                      {isCorrect ? '✓ 正解！' : '✗ 不正解'}
                    </Text>
                    <Text className="mt-2">正解: {questionText}</Text>
                  </>
                ) : // 一斉回答モード: 判定があれば結果を表示、なければ提出完了メッセージ
                isCorrect === true ? (
                  // 正解と判定された場合
                  <>
                    <Text className="text-green-600 font-bold text-lg">✓ 正解！</Text>
                    <Text className="mt-2">正解: {questionText}</Text>
                  </>
                ) : isCorrect === false ? (
                  // 不正解と判定された場合
                  <>
                    <Text className="text-red-600 font-bold text-lg">✗ 不正解</Text>
                    <Text className="mt-2">正解: {questionText}</Text>
                  </>
                ) : null}
              </View>
            )}
          </>
        )}

        {loading && <ActivityIndicator className="mt-4" />}
        {error && <Text className="mt-4 text-red-500">{error}</Text>}
      </View>
    );
  }

  // ホスト用の問題表示・管理画面（回答一覧付き）
  if (isHost && currentQuestionId) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-4">出題中</Text>

        {/* クイズモード表示 */}
        <View className="flex-row items-center mb-4">
          <Text className="text-sm bg-blue-100 px-3 py-1 rounded-full">
            {isFirstComeMode ? '早押しモード' : '一斉回答モード'}
          </Text>
        </View>

        <Text className="text-lg my-4 text-center">{questionText}</Text>
        <Button
          title={`音声を再生する (${3 - playCount}回残り)`}
          onPress={handlePlayQuestion}
          disabled={playCount >= 3 || !questionText}
        />

        {/* 早押しモード用のバズイン管理UI */}
        {isFirstComeMode && (
          <View className="w-full my-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold">バズイン状況:</Text>
              <Button
                title="バズインをリセット"
                onPress={handleResetBuzz}
                disabled={!currentBuzzer || loading}
              />
            </View>

            {currentBuzzer ? (
              <View className="bg-yellow-100 p-3 rounded-lg mt-2">
                <Text className="text-center">
                  {participants.find((p) => p.id === currentBuzzer)?.nickname || '不明な参加者'}
                  さんがバズインしました
                </Text>
              </View>
            ) : (
              <Text className="italic text-gray-600 text-center mt-2">
                まだバズインした人はいません
              </Text>
            )}
          </View>
        )}

        {/* 回答一覧 - 改善版 */}
        <View className="w-full my-4 max-h-[250px]">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-base font-bold">回答一覧 ({answers.length}件)</Text>
            <TouchableOpacity
              onPress={() => fetchAnswers(true)}
              className="bg-gray-200 px-3 py-1 rounded-lg"
            >
              <Text className="text-sm">更新</Text>
            </TouchableOpacity>
          </View>

          {answers.length === 0 ? (
            <View className="bg-gray-100 p-4 rounded-lg items-center">
              <Text className="italic text-gray-600 text-center">まだ回答がありません</Text>
              <Text className="text-xs text-gray-500 mt-1">
                最終更新: {new Date().toLocaleTimeString()}
              </Text>
            </View>
          ) : (
            <ScrollView className="w-full max-h-[230px]">
              {answers.map((answer) => (
                <View
                  key={answer.id}
                  className={`p-3 rounded-lg mb-2 border ${
                    answer.judged
                      ? answer.is_correct
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <View className="flex-row justify-between">
                    <Text className="font-bold">{answer.nickname || '不明なユーザー'}</Text>
                    <Text className="text-xs text-gray-500">
                      ID: {answer.id.substring(0, 6)}...
                    </Text>
                  </View>

                  <Text className="my-1">「{answer.answer_text}」</Text>

                  {isAllAtOnceMode && !answer.judged ? (
                    // 一斉回答モードで未判定の場合、判定ボタンを表示
                    <View className="flex-row justify-end mt-2">
                      <TouchableOpacity
                        onPress={() => handleJudgeAnswer(answer.id, true)}
                        disabled={loading}
                        className="bg-green-500 px-4 py-1 rounded mr-2"
                      >
                        <Text className="text-white font-bold">正解</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleJudgeAnswer(answer.id, false)}
                        disabled={loading}
                        className="bg-red-500 px-4 py-1 rounded"
                      >
                        <Text className="text-white font-bold">不正解</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // 判定済みか早押しモードの場合は判定結果を表示
                    <Text
                      className={
                        answer.is_correct
                          ? 'text-green-500 font-bold'
                          : answer.is_correct === false
                          ? 'text-red-500 font-bold'
                          : 'text-gray-500 italic'
                      }
                    >
                      {answer.judged ? (answer.is_correct ? '✓ 正解' : '✗ 不正解') : '判定待ち'}
                    </Text>
                  )}
                </View>
              ))}

              <Text className="text-xs text-gray-500 text-center italic mt-2 mb-4">
                最終更新: {new Date().toLocaleTimeString()}
              </Text>
            </ScrollView>
          )}
        </View>

        <View className="h-[30px]" />
        <Button title="クイズを終了する" onPress={handleEndQuiz} color="red" />
        {loading && <ActivityIndicator className="mt-4" />}
        {error && <Text className="mt-4 text-red-500">{error}</Text>}
      </View>
    );
  }

  // 想定外のケース
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-xl font-bold mb-4">エラー</Text>
      <Text>予期しない状態です。アプリを再起動してください。</Text>
      {/* デバッグ情報はすべて非表示にしました */}
      <Button title="ホームに戻る" onPress={() => router.push('/')} />
    </View>
  );
}

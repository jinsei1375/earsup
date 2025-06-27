// app/quiz.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';

// 定数定義
const POLLING_INTERVAL = 3000; // 3秒ごとにポーリング

export default function QuizScreen() {
  const params = useLocalSearchParams<{ roomId: string; role: string }>();
  const { roomId, role } = params;
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);

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
  const [answers, setAnswers] = useState<
    Array<{
      id: string;
      user_id: string;
      answer_text: string;
      is_correct: boolean;
      nickname?: string; // nickname は後から追加するプロパティ
    }>
  >([]);

  const isHost = role === 'host' || room?.host_user_id === userId;

  // ルーム情報と現在の問題を取得
  useEffect(() => {
    if (roomId) {
      console.log(`初期化: roomId=${roomId}, role=${role}, isHost=${isHost}`);

      // 初期データを強制的に取得
      fetchRoomAndQuestion(true);

      // リアルタイム更新を設定（改善版）
      const channelName = `room-quiz-${roomId}-${Date.now()}`;
      console.log(`リアルタイムチャンネル設定: ${channelName}`);

      const roomSubscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
          (payload: any) => {
            console.log('Room changed:', payload);
            const timestamp = new Date().toLocaleTimeString();

            // 状態が変わったら即時更新
            if (room?.status !== payload.new?.status) {
              console.log(`リアルタイム検知: statusが${payload.new?.status}に変更されました`);
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
            filter: currentQuestionId ? `question_id=eq.${currentQuestionId}` : undefined,
          },
          (payload: any) => {
            console.log('Answer changed:', payload);

            // 回答が変更されたら回答一覧を更新
            fetchAnswers();

            if (payload.eventType === 'INSERT') {
              const timestamp = new Date().toLocaleTimeString();
              console.log(
                `回答追加: ${timestamp} - ユーザーID: ${payload.new?.user_id || 'unknown'}`
              );
            }
          }
        )
        .subscribe((status) => {
          console.log(`Supabase realtime status: ${status}`);
        });

      // リアルタイム更新が主要な手段、ポーリングはバックアップ
      // ポーリング頻度を調整（ホストなら5秒、参加者なら3秒）
      const pollingFrequency = isHost ? 5000 : 3000;

      // ポーリングによる静かな状態確認（ローディング表示なし）
      let lastPollTime = Date.now();
      const intervalId = setInterval(() => {
        // 最後のポーリングから1秒以内は実行しない（デバウンス効果）
        if (Date.now() - lastPollTime < 1000) return;

        lastPollTime = Date.now();
        fetchRoomAndQuestion(false); // force=falseでローディングを表示しない
      }, pollingFrequency);

      return () => {
        console.log(`チャンネル${channelName}を解除します`);
        roomSubscription.unsubscribe();
        clearInterval(intervalId);
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

  // 回答一覧を取得する関数
  const fetchAnswers = async () => {
    if (!roomId || !currentQuestionId) return;

    // 回答取得ではローディングを表示しない（UIをスムーズに保つため）
    try {
      // 現在の問題に対する回答を取得
      const { data, error } = await supabase
        .from('answers')
        .select('id, user_id, answer_text, is_correct')
        .eq('question_id', currentQuestionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('回答取得エラー:', error);
        return;
      }

      // すべての回答に対するユーザー情報を取得
      const userIds = data.map((a) => a.user_id);
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, nickname')
          .in('id', userIds);

        // ニックネーム情報を結合
        if (usersData && usersData.length > 0) {
          const userMap = new Map(usersData.map((u) => [u.id, u.nickname]));
          // データにニックネームを追加
          const answersWithNickname = data.map((answer) => ({
            ...answer,
            nickname: userMap.get(answer.user_id) || '不明なユーザー',
          }));
          setAnswers(answersWithNickname);
          return; // ここで終了
        }
      }

      // ユーザー情報がない場合はそのまま設定
      setAnswers(data || []);
      console.log(`${data?.length || 0}件の回答を取得しました`);
    } catch (err) {
      console.error('回答データ取得エラー:', err);
    }
  };

  const fetchRoomAndQuestion = async (force = false) => {
    if (!roomId) return;

    // 初回読み込みの場合のみローディングを表示し、定期的なポーリングでは表示しない
    // また、すでにデータがある場合はローディングを表示しない
    const showLoading = !loading && force && (!room || !currentQuestionId);
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

            // 問題が取得できたら回答も取得
            if (questionData[0].id) {
              // 現在のcurrentQuestionIdに代入
              if (currentQuestionId !== questionData[0].id) {
                setCurrentQuestionId(questionData[0].id);
              }

              // 回答データを取得
              fetchAnswers();
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

  const handleSubmitAnswer = async () => {
    if (!roomId || !currentQuestionId || !answer.trim()) return;
    setLoading(true);

    try {
      // 正解判定（大文字小文字区別なし）
      const isCorrectAnswer = answer.trim().toLowerCase() === questionText.toLowerCase();

      // ユーザーの回答を保存
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

      console.log('回答を送信しました:', { answer, isCorrect: isCorrectAnswer });

      // 回答データを再取得
      fetchAnswers();
    } catch (err: any) {
      setError(err.message || '回答の送信中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleEndQuiz = async () => {
    if (!roomId || !isHost) return;

    try {
      // ルームのステータスを「終了」に変更
      await supabase.from('rooms').update({ status: 'judged' }).eq('id', roomId);

      // ホーム画面に戻る
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'クイズ終了処理中にエラーが発生しました。');
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
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-4">出題中</Text>
        <Text className="text-lg my-4 text-center">{questionText}</Text>
        <Button
          title={`音声を再生する (${3 - playCount}回残り)`}
          onPress={handlePlayQuestion}
          disabled={playCount >= 3 || !questionText}
        />
        <View className="h-[30px]" />
        <Button title="クイズを終了する" onPress={handleEndQuiz} color="red" />
        {loading && <ActivityIndicator className="mt-4" />}
        {error && <Text className="mt-4 text-red-500">{error}</Text>}
      </View>
    );
  }

  // 参加者用の待機画面・回答画面
  if (!isHost) {
    // 強制的に状態を確認して、activeの場合は問題表示画面を表示
    const isQuizActive = room?.status === 'active' || room?.status === 'judged';
    const hasQuestion = !!currentQuestionId && !!questionText;

    console.log('参加者画面の状態:', {
      isQuizActive,
      hasQuestion,
      status: room?.status,
      questionId: currentQuestionId,
      questionTextLength: questionText?.length || 0,
    });

    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-4">リスニングクイズ</Text>

        {/* デバッグ情報と状態表示を削除 */}

        {!isQuizActive || !hasQuestion ? (
          // 問題未作成またはホスト待機中
          <>
            <Text>ホストが問題を作成中です...</Text>
            <Button title="状態を更新" onPress={() => fetchRoomAndQuestion()} />
          </>
        ) : (
          // 出題中・回答可能
          <>
            <Text className="text-lg font-bold text-green-500 my-4">問題が出題されました!</Text>

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

            {showResult && (
              <View className="mt-6 items-center">
                <Text>{isCorrect ? '正解！' : '不正解'}</Text>
                <Text>正解: {questionText}</Text>
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

        <Text className="text-lg my-4 text-center">{questionText}</Text>
        <Button
          title={`音声を再生する (${3 - playCount}回残り)`}
          onPress={handlePlayQuestion}
          disabled={playCount >= 3 || !questionText}
        />

        {/* 回答一覧 */}
        <View className="w-full my-4 max-h-[200px]">
          <Text className="text-base font-bold mb-2">回答一覧 ({answers.length}件)</Text>
          {answers.length === 0 ? (
            <Text className="italic text-gray-600 text-center mt-2">まだ回答がありません</Text>
          ) : (
            <ScrollView className="w-full max-h-[180px]">
              {answers.map((answer) => (
                <View
                  key={answer.id}
                  className={`p-3 rounded-lg mb-2 border ${
                    answer.is_correct 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <Text className="font-bold mb-1">{answer.nickname || '不明なユーザー'}</Text>
                  <Text className="mb-1">「{answer.answer_text}」</Text>
                  <Text className={answer.is_correct ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {answer.is_correct ? '✓ 正解' : '✗ 不正解'}
                  </Text>
                </View>
              ))}
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



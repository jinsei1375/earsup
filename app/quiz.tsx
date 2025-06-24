// app/quiz.tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
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
  const [debugInfo, setDebugInfo] = useState<string>('');

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
            setDebugInfo(`Room更新: ${timestamp} - status: ${payload.new?.status || 'unknown'}`);

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
            setDebugInfo(`Question更新: ${timestamp} - id: ${payload.new?.id || 'unknown'}`);

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
        .subscribe((status) => {
          console.log(`Supabase realtime status: ${status}`);
        });

      // 参加者はより頻繁にポーリング
      const pollingFrequency = !isHost ? 2000 : POLLING_INTERVAL;

      // ポーリングによる定期的な状態確認（バックアップ）
      const intervalId = setInterval(() => {
        fetchRoomAndQuestion();
      }, pollingFrequency);

      return () => {
        console.log(`チャンネル${channelName}を解除します`);
        roomSubscription.unsubscribe();
        clearInterval(intervalId);
      };
    }
  }, [roomId]);

  // 自動再生用の効果
  useEffect(() => {
    if (autoPlay && questionText && !isHost && playCount === 0) {
      console.log('自動再生を開始します:', questionText);
      handlePlayQuestion();
      setAutoPlay(false);
    }
  }, [autoPlay, questionText, isHost, playCount]);

  const fetchRoomAndQuestion = async (force = false) => {
    if (!roomId) return;

    // 短い間隔での連続呼び出しの場合はローディングを表示しない
    const showLoading = !loading && force;
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
        setDebugInfo(
          `ステータス変更: ${new Date().toLocaleTimeString()} - ${room?.status} → ${
            roomData.status
          }`
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
          }
        }
      } else if (questionError) {
        console.error('問題データ取得エラー:', questionError);
      } else {
        console.log(`問題データなし (${timestamp})`);
      }

      // 最新の状態を反映するため強制的な再レンダリング
      setLastUpdated(Date.now());

      // 参加者かつactiveステータスなのに問題がない場合は念のため再取得
      if (!isHost && roomData.status === 'active' && !currentQuestionId && !force) {
        console.log('不整合を検出: active状態なのに問題IDがありません。再取得します。');
        setTimeout(() => fetchRoomAndQuestion(true), 1000);
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
      setDebugInfo(`問題作成完了: ${new Date().toLocaleTimeString()}`);

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
      // ユーザーの回答を保存
      const { error } = await supabase.from('answers').insert({
        room_id: roomId,
        user_id: userId,
        question_id: currentQuestionId,
        answer_text: answer,
        judged: false,
        is_correct: false,
      });

      if (error) throw error;

      setShowResult(true);
      // 仮判定 (簡易実装)
      setIsCorrect(answer.trim().toLowerCase() === questionText.toLowerCase());
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
      <View style={styles.container}>
        <Text style={styles.title}>問題を作成</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
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
        {loading && <ActivityIndicator style={styles.loader} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // ホスト用の問題表示・管理画面
  if (isHost && currentQuestionId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>出題中</Text>
        <Text style={styles.questionText}>{questionText}</Text>
        <Button
          title={`音声を再生する (${3 - playCount}回残り)`}
          onPress={handlePlayQuestion}
          disabled={playCount >= 3 || !questionText}
        />
        <View style={styles.spacer} />
        <Button title="クイズを終了する" onPress={handleEndQuiz} color="red" />
        {loading && <ActivityIndicator style={styles.loader} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
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
      <View style={styles.container}>
        <Text style={styles.title}>リスニングクイズ</Text>

        {/* デバッグ情報の表示 */}
        <Text style={styles.debugInfo}>{debugInfo}</Text>

        {/* ルームステータスと問題ID情報 */}
        <Text style={styles.statusText}>
          ステータス: {room?.status || 'loading...'} / 問題ID:{' '}
          {currentQuestionId?.slice(0, 8) || 'なし'}
        </Text>

        {!isQuizActive || !hasQuestion ? (
          // 問題未作成またはホスト待機中
          <>
            <Text>ホストが問題を作成中です...</Text>
            <Button title="状態を更新" onPress={() => fetchRoomAndQuestion()} />
          </>
        ) : (
          // 出題中・回答可能
          <>
            <Text style={styles.questionInfo}>問題が出題されました!</Text>

            <Button
              title={`音声を再生 (${3 - playCount}回残り)`}
              onPress={handlePlayQuestion}
              disabled={playCount >= 3}
            />

            <TextInput
              style={styles.input}
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
              <View style={styles.result}>
                <Text>{isCorrect ? '正解！' : '不正解'}</Text>
                <Text>正解: {questionText}</Text>
              </View>
            )}
          </>
        )}

        {loading && <ActivityIndicator style={styles.loader} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // ホスト用の問題作成画面
  if (isHost && (!currentQuestionId || room?.status === 'ready')) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>問題を作成</Text>

        {/* デバッグ情報の表示 */}
        <Text style={styles.debugInfo}>{debugInfo}</Text>

        {/* ルームステータスの表示 */}
        <Text style={styles.statusText}>ステータス: {room?.status || 'loading...'}</Text>

        <TextInput
          style={[styles.input, styles.textArea]}
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
        {loading && <ActivityIndicator style={styles.loader} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // ホスト用の問題表示・管理画面
  if (isHost && currentQuestionId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>出題中</Text>

        {/* デバッグ情報の表示 */}
        <Text style={styles.debugInfo}>{debugInfo}</Text>

        {/* ルームステータスの表示 */}
        <Text style={styles.statusText}>ステータス: {room?.status || 'loading...'}</Text>

        <Text style={styles.questionText}>{questionText}</Text>
        <Button
          title={`音声を再生する (${3 - playCount}回残り)`}
          onPress={handlePlayQuestion}
          disabled={playCount >= 3 || !questionText}
        />
        <View style={styles.spacer} />
        <Button title="クイズを終了する" onPress={handleEndQuiz} color="red" />
        {loading && <ActivityIndicator style={styles.loader} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // 想定外のケース
  return (
    <View style={styles.container}>
      <Text style={styles.title}>エラー</Text>
      <Text>予期しない状態です。アプリを再起動してください。</Text>
      <Text style={styles.debugInfo}>
        roomId: {roomId}, isHost: {String(isHost)}, status: {room?.status}, questionId:{' '}
        {currentQuestionId}
      </Text>
      <Button title="ホームに戻る" onPress={() => router.push('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    width: '100%',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  questionText: {
    fontSize: 18,
    marginVertical: 16,
    textAlign: 'center',
  },
  result: {
    marginTop: 24,
    alignItems: 'center',
  },
  spacer: {
    height: 30,
  },
  loader: {
    marginTop: 16,
  },
  errorText: {
    marginTop: 16,
    color: 'red',
  },
  statusText: {
    marginTop: 8,
    marginBottom: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  debugInfo: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
    fontSize: 12,
    width: '100%',
    textAlign: 'center',
  },
  questionInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 16,
  },
});

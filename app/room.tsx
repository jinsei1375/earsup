import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';

export default function RoomScreen() {
  const params = useLocalSearchParams<{ mode: string; roomId: string }>();
  const { mode, roomId: paramRoomId } = params;
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);
  const [code, setCode] = useState('');
  const [roomId, setRoomId] = useState<string | null>(paramRoomId || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Array<{ id: string; nickname: string }>>([]);
  const [room, setRoom] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);

  const isCreateMode = mode === 'create';
  const isJoinMode = mode === 'join';
  const isWaitingMode = roomId !== null;

  // 合言葉を自動生成（6文字の英数字）
  useEffect(() => {
    if (isCreateMode) {
      setCode(Math.random().toString(36).slice(-6).toUpperCase());
    }
  }, [isCreateMode]);

  // ルーム情報と参加者情報の取得
  useEffect(() => {
    if (roomId) {
      // 初回は強制的にローディングを表示
      fetchRoomAndParticipants(true);

      // リアルタイム更新を設定（改善版）
      const channelName = `room-participants-${roomId}-${Date.now()}`;
      console.log(`参加者リアルタイムチャンネル設定: ${channelName}`);

      const participantsSubscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'room_participants',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log('参加者変更検知:', payload);
            fetchRoomAndParticipants(false); // リアルタイム更新ではローディングを表示しない
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
          },
          () => {
            fetchRoomAndParticipants(false); // リアルタイム更新ではローディングを表示しない
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${roomId}`,
          },
          (payload: any) => {
            console.log('ルーム状態変更:', payload);

            // ルームステータスが変わったら更新
            if (payload.new?.status === 'ready' && !isHost) {
              console.log('クイズ開始を検知: 参加者画面へ遷移します');
              // 参加者がクイズ画面へ遷移
              router.push({
                pathname: '/quiz',
                params: { roomId, role: 'participant' },
              });
              return; // 画面遷移後は他の処理をスキップ
            }

            fetchRoomAndParticipants(false); // リアルタイム更新ではローディングを表示しない
          }
        )
        .subscribe((status) => {
          console.log(`参加者チャンネル状態: ${status}`);
        });

      // ポーリングによるバックアップ (ローディング表示なし)
      const intervalId = setInterval(() => {
        fetchRoomAndParticipants(false); // force=falseでローディングを表示しない
      }, 5000);

      return () => {
        console.log(`チャンネル${channelName}を解除します`);
        participantsSubscription.unsubscribe();
        clearInterval(intervalId);
      };
    }
  }, [roomId]);

  const fetchRoomAndParticipants = async (force = false) => {
    if (!roomId) return;

    // 初回読み込みの場合や明示的にforce=trueが指定された場合のみローディングを表示
    // ポーリングなどの定期更新ではローディングを表示しない
    const shouldShowLoading = force && !loading;
    if (shouldShowLoading) {
      setLoading(true);
    }

    try {
      // ルーム情報の取得
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);
      setIsHost(roomData.host_user_id === userId);

      // ルームのステータスが ready で自分がホストでない場合は参加者として画面遷移
      if (roomData.status === 'ready' && roomData.host_user_id !== userId) {
        console.log('クイズ開始状態を検知: 参加者画面へ遷移します');
        router.push({
          pathname: '/quiz',
          params: { roomId, role: 'participant' },
        });
        return; // 画面遷移後は他の処理をスキップ
      }

      // 参加者テーブルから取得 (ルームの参加者)
      const { data: participantsData, error: participantsError } = await supabase
        .from('room_participants')
        .select('user_id')
        .eq('room_id', roomId);

      if (participantsError) {
        console.error('参加者取得エラー:', participantsError);
      }

      // ホストユーザーも含めて表示するため
      const userIds = [roomData.host_user_id];

      // room_participantsテーブルにデータがある場合は追加
      if (participantsData && participantsData.length > 0) {
        participantsData.forEach((p) => {
          if (p.user_id && !userIds.includes(p.user_id)) {
            userIds.push(p.user_id);
          }
        });
      }

      // 各ユーザーの情報を取得
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, nickname')
          .in('id', userIds);

        if (usersError) {
          throw usersError;
        }

        setParticipants(usersData || []);
      } else {
        // ホストのみを取得
        const { data: hostData, error: hostError } = await supabase
          .from('users')
          .select('id, nickname')
          .eq('id', roomData.host_user_id);

        if (!hostError) {
          setParticipants(hostData || []);
        }
      }
    } catch (err: any) {
      setError(err.message || 'ルーム情報の取得中にエラーが発生しました。');
      console.error('参加者情報取得エラー:', err);
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  };

  const handleCreateRoom = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('rooms')
        .insert({
          code,
          host_user_id: userId,
          status: 'waiting',
        })
        .select()
        .single();

      if (createError) throw createError;
      setRoomId(data.id);
      // 待機画面にとどまる
    } catch (err: any) {
      setError(err.message || 'ルーム作成中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!userId || !code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // ルームを検索
      const { data, error: findError } = await supabase
        .from('rooms')
        .select()
        .eq('code', code.toUpperCase())
        .single();

      if (findError || !data) {
        setError('指定された合言葉のルームが見つかりません。');
        setLoading(false);
        return;
      }

      const roomId = data.id;

      // まず既存の参加者エントリをチェック
      const { data: existingParticipant, error: checkError } = await supabase
        .from('room_participants')
        .select()
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('参加者チェックエラー:', checkError);
      }

      // 既存のエントリが無い場合のみ挿入
      if (!existingParticipant) {
        const { error: participantError } = await supabase.from('room_participants').insert({
          room_id: roomId,
          user_id: userId,
          joined_at: new Date().toISOString(),
        });

        if (participantError) {
          console.error('参加者登録エラー:', participantError);
          // エラーがあっても続行（UI体験を優先）
        } else {
          console.log('参加者として登録しました:', roomId);
        }
      } else {
        console.log('既に参加者として登録されています:', roomId);
      }

      setRoomId(roomId);
      // 待機画面にとどまる
    } catch (err: any) {
      setError(err.message || 'ルーム参加中にエラーが発生しました。');
      console.error('ルーム参加エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!room || !isHost) return;

    try {
      setLoading(true);
      console.log('クイズを開始します: ルームステータスを更新');

      // ルームのステータスを更新
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ status: 'ready' })
        .eq('id', roomId);

      if (updateError) {
        throw updateError;
      }

      console.log('ルームステータス更新完了、出題者画面へ遷移します');

      // 出題者画面へ遷移
      router.push({ pathname: '/quiz', params: { roomId, role: 'host' } });
    } catch (err: any) {
      setError(err.message || 'クイズ開始中にエラーが発生しました。');
      console.error('クイズ開始エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRoom = async () => {
    if (!room || !isHost) return;

    try {
      // ルームを削除
      await supabase.from('rooms').delete().eq('id', roomId);

      // ホーム画面に戻る
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'ルーム削除中にエラーが発生しました。');
    }
  };

  // 待機画面の表示
  if (isWaitingMode) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <Text className="text-xl font-bold mb-6">ルーム待機中</Text>
        <Text className="text-[32px] font-bold tracking-[4px] my-5">{room?.code || ''}</Text>
        <View className="flex-row justify-between items-center w-full mt-2.5 mb-2.5">
          <Text>参加者 ({participants.length}名)</Text>
          <Button title="更新" onPress={() => fetchRoomAndParticipants(true)} disabled={loading} />
        </View>

        <ScrollView className="w-full max-h-[200px] my-5">
          {participants.map((participant) => (
            <View key={participant.id} className="p-3 border-b border-gray-200">
              <Text>
                {participant.nickname} {participant.id === room?.host_user_id ? '(ホスト)' : ''}
              </Text>
            </View>
          ))}
        </ScrollView>

        {isHost ? (
          <View className="flex-row mt-5">
            <Button title="クイズを開始" onPress={handleStartQuiz} disabled={loading} />
            <View className="w-4" />
            <Button
              title="ルームを中止"
              onPress={handleCancelRoom}
              disabled={loading}
              color="red"
            />
          </View>
        ) : (
          <Text className="mt-5 italic">ホストがクイズを開始するのを待っています...</Text>
        )}

        {loading && <ActivityIndicator className="mt-4" />}
        {error && <Text className="mt-4 text-red-500">{error}</Text>}
      </View>
    );
  }

  // ルーム作成・参加画面
  return (
    <View className="flex-1 p-6 items-center justify-center">
      <Text className="text-xl font-bold mb-6">{isCreateMode ? 'ルームを作成' : 'ルームに参加'}</Text>

      {isCreateMode ? (
        <>
          <Text>合言葉</Text>
          <Text className="text-[32px] font-bold tracking-[4px] my-5">{code}</Text>
          <Button title="ルームを作成" onPress={handleCreateRoom} disabled={loading} />
        </>
      ) : (
        <>
          <Text>合言葉を入力</Text>
          <TextInput
            className="w-full border border-gray-300 p-3 rounded-lg my-4 text-center text-2xl"
            placeholder="例: ABC123"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Button
            title="ルームに参加"
            onPress={handleJoinRoom}
            disabled={!code.trim() || loading}
          />
        </>
      )}

      {loading && <ActivityIndicator className="mt-4" />}
      {error && <Text className="mt-4 text-red-500">{error}</Text>}
    </View>
  );
}



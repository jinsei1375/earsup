import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
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
      fetchRoomAndParticipants();
      // リアルタイム更新を設定
      const participantsSubscription = supabase
        .channel('room-' + roomId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          fetchRoomAndParticipants();
        })
        .subscribe();

      return () => {
        participantsSubscription.unsubscribe();
      };
    }
  }, [roomId]);

  const fetchRoomAndParticipants = async () => {
    if (!roomId) return;
    setLoading(true);

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

      // 参加者情報の取得
      const { data: participantsData, error: participantsError } = await supabase
        .from('users')
        .select('id, nickname')
        .eq('id', roomData.host_user_id); // 将来的には参加者テーブルから取得

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);
    } catch (err: any) {
      setError(err.message || 'ルーム情報の取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
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

      setRoomId(data.id);
      // 待機画面にとどまる
    } catch (err: any) {
      setError(err.message || 'ルーム参加中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!room || !isHost) return;

    try {
      // ルームのステータスを更新
      await supabase.from('rooms').update({ status: 'ready' }).eq('id', roomId);

      // 出題者画面へ遷移
      router.push({ pathname: '/quiz', params: { roomId, role: 'host' } });
    } catch (err: any) {
      setError(err.message || 'クイズ開始中にエラーが発生しました。');
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
      <View style={styles.container}>
        <Text style={styles.title}>ルーム待機中</Text>
        <Text style={styles.codeDisplay}>{room?.code || ''}</Text>
        <Text>参加者 ({participants.length}名)</Text>

        <ScrollView style={styles.participantsList}>
          {participants.map((participant) => (
            <View key={participant.id} style={styles.participantItem}>
              <Text>
                {participant.nickname} {participant.id === room?.host_user_id ? '(ホスト)' : ''}
              </Text>
            </View>
          ))}
        </ScrollView>

        {isHost ? (
          <View style={styles.hostButtons}>
            <Button title="クイズを開始" onPress={handleStartQuiz} disabled={loading} />
            <View style={styles.buttonSpacer} />
            <Button
              title="ルームを中止"
              onPress={handleCancelRoom}
              disabled={loading}
              color="red"
            />
          </View>
        ) : (
          <Text style={styles.waitMessage}>ホストがクイズを開始するのを待っています...</Text>
        )}

        {loading && <ActivityIndicator style={styles.loader} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // ルーム作成・参加画面
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isCreateMode ? 'ルームを作成' : 'ルームに参加'}</Text>

      {isCreateMode ? (
        <>
          <Text>合言葉</Text>
          <Text style={styles.codeDisplay}>{code}</Text>
          <Button title="ルームを作成" onPress={handleCreateRoom} disabled={loading} />
        </>
      ) : (
        <>
          <Text>合言葉を入力</Text>
          <TextInput
            style={styles.input}
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

      {loading && <ActivityIndicator style={styles.loader} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    textAlign: 'center',
    fontSize: 24,
  },
  codeDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginVertical: 20,
  },
  participantsList: {
    width: '100%',
    maxHeight: 200,
    marginVertical: 20,
  },
  participantItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hostButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  buttonSpacer: {
    width: 16,
  },
  waitMessage: {
    marginTop: 20,
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 16,
  },
  errorText: {
    marginTop: 16,
    color: 'red',
  },
});

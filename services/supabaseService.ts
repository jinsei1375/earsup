// services/supabaseService.ts
import { supabase } from '@/lib/supabase';
import type {
  Room,
  Question,
  Answer,
  Buzz,
  RoomParticipant,
  User,
  ParticipantWithNickname,
  Stamp,
} from '@/types';

export class SupabaseService {
  // Room operations
  static async createRoom(
    code: string,
    hostUserId: string,
    quizMode: 'all-at-once-host' | 'all-at-once-auto',
    allowPartialPoints: boolean = true
  ): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        code,
        host_user_id: hostUserId,
        status: 'waiting',
        quiz_mode: quizMode,
        allow_partial_points: allowPartialPoints,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findRoomByCode(code: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from('rooms')
      .select()
      .eq('code', code.toUpperCase())
      .single();

    if (error) return null;
    return data;
  }

  static async getRoomById(roomId: string): Promise<Room | null> {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();

    if (error) {
      // ルームが見つからない場合（削除済みなど）はnullを返す
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  }

  static async updateRoomStatus(roomId: string, status: Room['status']): Promise<void> {
    const { error } = await supabase
      .from('rooms')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);

    if (error) throw error;
  }

  static async deleteRoom(roomId: string): Promise<void> {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) throw error;
  }

  // Question operations
  static async createQuestion(
    roomId: string,
    text: string,
    speaker: string = 'en-US',
    speed: number = 1.0,
    sampleSentenceId?: string
  ): Promise<Question> {
    const timestamp = new Date().toISOString();

    const { data, error } = await supabase
      .from('questions')
      .insert({
        room_id: roomId,
        text,
        speaker,
        speed,
        sample_sentence_id: sampleSentenceId,
        created_at: timestamp,
      })
      .select()
      .single();

    if (error) {
      console.error('Question creation error:', error);
      throw error;
    }
    
    return data;
  }

  static async getLatestQuestion(roomId: string): Promise<Question | null> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1)
      .throwOnError();

    if (error || !data?.length) return null;
    
    return data[0];
  }

  static async updateQuestion(questionId: string, updates: Partial<Question>): Promise<void> {
    const { error } = await supabase
      .from('questions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId);

    if (error) throw error;
  }

  // Answer operations
  static async submitAnswer(
    roomId: string,
    userId: string,
    questionId: string,
    answerText: string,
    judged: boolean = false,
    judgmentResult: 'correct' | 'partial' | 'incorrect' | null = null
  ): Promise<Answer> {
    const { data, error } = await supabase
      .from('answers')
      .insert({
        room_id: roomId,
        user_id: userId,
        question_id: questionId,
        answer_text: answerText,
        judged,
        judge_result: judgmentResult,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAnswersForQuestion(questionId: string, roomId: string): Promise<Answer[]> {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getAnswersWithNicknames(questionId: string, roomId: string): Promise<Answer[]> {
    const answers = await this.getAnswersForQuestion(questionId, roomId);

    if (answers.length === 0) return [];

    const userIds = [...new Set(answers.map((a) => a.user_id))];
    const { data: usersData } = await supabase
      .from('users')
      .select('id, nickname')
      .in('id', userIds);

    if (!usersData) return answers;

    const userMap = new Map(usersData.map((u) => [u.id, u.nickname]));

    return answers.map((answer) => ({
      ...answer,
      nickname: userMap.get(answer.user_id) || '不明なユーザー',
    }));
  }

  static async judgeAnswer(
    answerId: string,
    judgmentResult: 'correct' | 'partial' | 'incorrect'
  ): Promise<void> {
    const { error } = await supabase
      .from('answers')
      .update({
        judged: true,
        judge_result: judgmentResult,
      })
      .eq('id', answerId);

    if (error) throw error;
  }

  // Buzz operations
  static async createBuzz(roomId: string, userId: string, questionId: string): Promise<Buzz> {
    const { data, error } = await supabase
      .from('buzzes')
      .insert({
        room_id: roomId,
        user_id: userId,
        question_id: questionId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getExistingBuzz(roomId: string, questionId: string): Promise<Buzz | null> {
    const { data, error } = await supabase
      .from('buzzes')
      .select('*')
      .eq('room_id', roomId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  static async resetBuzzes(roomId: string, questionId: string): Promise<void> {
    const { error } = await supabase
      .from('buzzes')
      .delete()
      .eq('room_id', roomId)
      .eq('question_id', questionId);

    if (error) throw error;
  }

  // Participant operations
  static async addParticipant(roomId: string, userId: string): Promise<void> {
    // Check room status first - don't allow joining if quiz has started
    try {
      const room = await this.getRoomById(roomId);
      if (!room) {
        throw new Error('ルームが見つからないか、削除されています');
      }
      if (room.status !== 'waiting') {
        throw new Error('クイズが既に開始されているため、参加できません');
      }
    } catch (error) {
      // If room doesn't exist or other error
      throw new Error('ルームが見つからないか、アクセスできません');
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('room_participants')
      .select()
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) return; // Already exists

    const { error } = await supabase.from('room_participants').insert({
      room_id: roomId,
      user_id: userId,
      joined_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  static async getRoomParticipants(roomId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('room_participants')
      .select('user_id')
      .eq('room_id', roomId);

    if (error) throw error;
    return data?.map((p) => p.user_id) || [];
  }

  static async getParticipantsWithNicknames(
    roomId: string,
    hostUserId: string
  ): Promise<ParticipantWithNickname[]> {
    const participantIds = await this.getRoomParticipants(roomId);
    const userIds = [hostUserId, ...participantIds.filter((id) => id !== hostUserId)];

    if (userIds.length === 0) return [];

    const { data: usersData, error } = await supabase
      .from('users')
      .select('id, nickname')
      .in('id', userIds);

    if (error) throw error;
    return usersData || [];
  }

  // User operations
  static async getUsersByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];

    const { data, error } = await supabase.from('users').select('id, nickname').in('id', userIds);

    if (error) throw error;
    return data || [];
  }

  // Participant management
  static async removeParticipant(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async checkAndEndRoomIfEmpty(roomId: string): Promise<boolean> {
    try {
      // Get room info
      const room = await this.getRoomById(roomId);
      if (!room || room.status === 'ended') return false;

      // Get current participants (excluding host)
      const participantIds = await this.getRoomParticipants(roomId);
      const nonHostParticipants = participantIds.filter((id) => id !== room.host_user_id);

      // If no participants left, end the room
      if (nonHostParticipants.length === 0) {
        await this.updateRoomStatus(roomId, 'ended');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking room status:', error);
      return false;
    }
  }

  static async endRoomByHost(roomId: string, hostUserId: string): Promise<void> {
    // Verify the user is the host
    const room = await this.getRoomById(roomId);
    if (!room) {
      throw new Error('ルームが見つからないか、削除されています');
    }
    if (room.host_user_id !== hostUserId) {
      throw new Error('Only the host can end the room');
    }

    // End the room
    await this.updateRoomStatus(roomId, 'ended');
  }

  // New Answer operations
  static async getAllAnswersForRoom(roomId: string): Promise<Answer[]> {
    // Get all questions for this room
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('room_id', roomId)
      .throwOnError();

    if (questionsError || !questions?.length) return [];

    const questionIds = questions.map((q) => q.id);

    // Get all answers for all questions in this room
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .in('question_id', questionIds)
      .eq('judged', true) // Only get judged answers for scoring
      .order('created_at', { ascending: false })
      .throwOnError();

    if (answersError) return [];
    return answers || [];
  }

  static async getAllAnswersWithNicknamesForRoom(roomId: string): Promise<Answer[]> {
    const answers = await this.getAllAnswersForRoom(roomId);
    if (!answers.length) return [];

    // Get user nicknames
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, nickname')
      .in('id', [...new Set(answers.map((a) => a.user_id))])
      .throwOnError();

    if (usersError) return answers;

    const userMap = new Map(users?.map((user) => [user.id, user.nickname]) || []);

    return answers.map((answer) => ({
      ...answer,
      nickname: userMap.get(answer.user_id) || '不明なユーザー',
    }));
  }

  // Stamp operations
  static async sendStamp(roomId: string, userId: string, stampType: string): Promise<Stamp> {
    const { data, error } = await supabase
      .from('stamps')
      .insert({
        room_id: roomId,
        user_id: userId,
        stamp_type: stampType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getRecentStamps(roomId: string, limit: number = 10): Promise<Stamp[]> {
    const { data, error } = await supabase
      .from('stamps')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getRecentStampsWithNicknames(roomId: string, limit: number = 10): Promise<Stamp[]> {
    const stamps = await this.getRecentStamps(roomId, limit);

    if (!stamps.length) return stamps;

    // Get user nicknames
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, nickname')
      .in('id', [...new Set(stamps.map((s) => s.user_id))])
      .throwOnError();

    if (usersError) return stamps;

    const userMap = new Map(users?.map((user) => [user.id, user.nickname]) || []);

    return stamps.map((stamp) => ({
      ...stamp,
      nickname: userMap.get(stamp.user_id) || '不明なユーザー',
    }));
  }
}

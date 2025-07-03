// services/supabaseService.ts
import { supabase } from '@/lib/supabase';
import type { 
  Room, 
  Question, 
  Answer, 
  Buzz, 
  RoomParticipant, 
  User,
  ParticipantWithNickname 
} from '@/types';

export class SupabaseService {
  // Room operations
  static async createRoom(
    code: string, 
    hostUserId: string, 
    quizMode: 'first-come' | 'all-at-once'
  ): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        code,
        host_user_id: hostUserId,
        status: 'waiting',
        quiz_mode: quizMode,
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

  static async getRoomById(roomId: string): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()
      .throwOnError();

    if (error) throw error;
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
    speed: number = 1.0
  ): Promise<Question> {
    const timestamp = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('questions')
      .insert({
        room_id: roomId,
        text,
        speaker,
        speed,
        created_at: timestamp,
      })
      .select()
      .single();

    if (error) throw error;
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
    isCorrect: boolean | null = null
  ): Promise<Answer> {
    const { data, error } = await supabase
      .from('answers')
      .insert({
        room_id: roomId,
        user_id: userId,
        question_id: questionId,
        answer_text: answerText,
        judged,
        is_correct: isCorrect,
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
      .select('id, user_id, answer_text, is_correct, judged')
      .eq('question_id', questionId)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getAnswersWithNicknames(questionId: string, roomId: string): Promise<Answer[]> {
    const answers = await this.getAnswersForQuestion(questionId, roomId);
    
    if (answers.length === 0) return [];

    const userIds = [...new Set(answers.map(a => a.user_id))];
    const { data: usersData } = await supabase
      .from('users')
      .select('id, nickname')
      .in('id', userIds);

    if (!usersData) return answers;

    const userMap = new Map(usersData.map(u => [u.id, u.nickname]));
    
    return answers.map(answer => ({
      ...answer,
      nickname: userMap.get(answer.user_id) || '不明なユーザー',
    }));
  }

  static async judgeAnswer(answerId: string, isCorrect: boolean): Promise<void> {
    const { error } = await supabase
      .from('answers')
      .update({
        judged: true,
        is_correct: isCorrect,
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
      .select('user_id')
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
    return data?.map(p => p.user_id) || [];
  }

  static async getParticipantsWithNicknames(roomId: string, hostUserId: string): Promise<ParticipantWithNickname[]> {
    const participantIds = await this.getRoomParticipants(roomId);
    const userIds = [hostUserId, ...participantIds.filter(id => id !== hostUserId)];

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

    const { data, error } = await supabase
      .from('users')
      .select('id, nickname')
      .in('id', userIds);

    if (error) throw error;
    return data || [];
  }
}
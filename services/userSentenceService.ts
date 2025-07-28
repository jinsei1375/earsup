// services/userSentenceService.ts
import { supabase } from '@/lib/supabase';
import type { UserSentence } from '@/types';

export class UserSentenceService {
  /**
   * ユーザーの登録例文一覧を取得
   */
  static async getUserSentences(userId: string): Promise<UserSentence[]> {
    const { data, error } = await supabase
      .from('user_sentences')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('登録例文の取得に失敗しました');
    }

    return data || [];
  }

  /**
   * 新しい例文を登録
   */
  static async createUserSentence(
    userId: string,
    text: string,
    translation: string
  ): Promise<UserSentence> {
    const { data, error } = await supabase
      .from('user_sentences')
      .insert([
        {
          user_id: userId,
          text: text.trim(),
          translation: translation.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error('例文の登録に失敗しました');
    }

    return data;
  }

  /**
   * 例文を更新
   */
  static async updateUserSentence(
    sentenceId: string,
    text: string,
    translation: string
  ): Promise<UserSentence> {
    const { data, error } = await supabase
      .from('user_sentences')
      .update({
        text: text.trim(),
        translation: translation.trim(),
        // The `updated_at` field is now managed automatically by the database.
      })
      .eq('id', sentenceId)
      .select()
      .single();

    if (error) {
      throw new Error('例文の更新に失敗しました');
    }

    return data;
  }

  /**
   * 例文を削除
   */
  static async deleteUserSentence(sentenceId: string): Promise<void> {
    const { error } = await supabase.from('user_sentences').delete().eq('id', sentenceId);

    if (error) {
      throw new Error('例文の削除に失敗しました');
    }
  }

  /**
   * IDで例文を取得
   */
  static async getUserSentenceById(sentenceId: string): Promise<UserSentence | null> {
    const { data, error } = await supabase
      .from('user_sentences')
      .select('*')
      .eq('id', sentenceId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }
}

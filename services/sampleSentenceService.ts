// services/sampleSentenceService.ts
import { supabase } from '@/lib/supabase';
import type { SampleSentence, SampleCategory } from '@/types';

export class SampleSentenceService {
  /**
   * すべてのカテゴリを取得
   */
  static async getCategories(): Promise<SampleCategory[]> {
    const { data, error } = await supabase.from('sample_categories').select('*').order('name');

    if (error) {
      throw new Error('カテゴリの取得に失敗しました');
    }

    return data || [];
  }

  /**
   * 指定されたカテゴリのサンプル文を取得
   */
  static async getSentencesByCategory(categoryId: string): Promise<SampleSentence[]> {
    const { data, error } = await supabase
      .from('sample_sentences')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at');

    if (error) {
      throw new Error('サンプル文の取得に失敗しました');
    }

    return data || [];
  }

  /**
   * IDでサンプル文を取得
   */
  static async getSentenceById(sentenceId: string): Promise<SampleSentence | null> {
    const { data, error } = await supabase
      .from('sample_sentences')
      .select('*')
      .eq('id', sentenceId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * すべてのサンプル文を取得
   */
  static async getAllSentences(): Promise<SampleSentence[]> {
    const { data, error } = await supabase
      .from('sample_sentences')
      .select(
        `
        *,
        sample_categories (
          id,
          name
        )
      `
      )
      .order('created_at');

    if (error) {
      throw new Error('サンプル文の取得に失敗しました');
    }

    return data || [];
  }
}

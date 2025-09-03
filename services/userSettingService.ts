import { UserSettings } from '@/types';
import { supabase } from '@/lib/supabase';

export default class UserSettingService {
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // レコードが存在しない場合
        return null;
      }
      throw error;
    }

    return data;
  }

  async createUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .insert([
        {
          user_id: userId,
          ...settings,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserSettings(
    settingsId: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('id', settingsId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

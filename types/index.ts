// ユーザー
export interface User {
  id: string;
  nickname: string;
}

export type VoiceGender = 'male' | 'female';

export interface VoiceSettings {
  gender: VoiceGender;
  speed: number;
}

// ルーム
export interface Room {
  id: string;
  code: string;
  host_user_id: string;
  status: 'waiting' | 'ready' | 'active' | 'judged' | 'ended';
  quiz_mode: 'all-at-once-host' | 'all-at-once-auto';
  quiz_input_type?: 'sentence' | 'word_separate' | 'word_selection'; // 新しく追加
  allow_partial_points?: boolean; // 惜しい判定を許可するか
  partial_judgement_threshold?: number; // 惜しい判定の閾値（%）
  voice_settings?: VoiceSettings; // 音声設定
  max_replay_count?: number; // 最大リプレイ回数
  created_at: string;
  updated_at: string;
}

// 問題
export interface Question {
  id: string;
  room_id: string;
  text: string;
  speaker: string;
  speed: number;
  sample_sentence_id?: string; // For linking back to sample sentence for translation
  created_at: string;
  updated_at?: string;
}

export interface QuestionWithTranslation extends Question {
  translation?: string; // Japanese translation from sample sentence
}

// 回答
export interface Answer {
  id: string;
  room_id: string;
  user_id: string;
  question_id: string;
  answer_text: string;
  judged: boolean;
  judge_result: 'correct' | 'partial' | 'incorrect' | null; // 判定結果を直接表現
  created_at: string;
  nickname?: string;
}

// マイセンテンス
export interface UserSentence {
  id: string;
  user_id: string;
  text: string;
  translation: string;
  created_at: string;
  updated_at?: string;
}

export interface Buzz {
  id: string;
  room_id: string;
  user_id: string;
  question_id: string;
  created_at: string;
}

// ルーム参加者
export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

// サンプルセンテンス
export interface SampleSentence {
  id: string;
  category_id: string;
  text: string;
  translation: string;
  created_at: string;
}

// サンプルセンテンスカテゴリ
export interface SampleCategory {
  id: string;
  name: string;
  created_at: string;
}

// ユーザー設定
export interface UserSettings {
  id: string;
  user_id: string;
  default_voice_gender: 'male' | 'female';
  user_icon_url: string | null;
  theme: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large';
  push_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsContextType {
  settings: UserSettings | null;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface ParticipantWithNickname extends User {
  id: string;
  nickname: string;
}

// Component props types
export interface QuizScreenParams extends Record<string, string | undefined> {
  roomId: string;
  role: string; // 'host' | 'participant'
}

export interface RoomScreenParams extends Record<string, string | undefined> {
  mode: string; // 'create' | 'join'
  roomId?: string;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

// Real-time subscription types
export type RealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED';

export interface RealtimeConnectionState {
  connected: boolean;
  retries: number;
  lastUpdate: Date | null;
}

// Stamp types
export interface Stamp {
  id: string;
  room_id: string;
  user_id: string;
  stamp_type: string;
  created_at: string;
  nickname?: string;
}

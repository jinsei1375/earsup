// types/index.ts
export interface User {
  id: string;
  nickname: string;
}

export interface Room {
  id: string;
  code: string;
  host_user_id: string;
  status: 'waiting' | 'ready' | 'active' | 'judged' | 'ended';
  quiz_mode: 'first-come' | 'all-at-once';
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  room_id: string;
  text: string;
  speaker: string;
  speed: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Answer {
  id: string;
  room_id: string;
  user_id: string;
  question_id: string;
  answer_text: string;
  judged: boolean;
  is_correct: boolean | null;
  created_at: string;
  nickname?: string;
}

export interface Buzz {
  id: string;
  room_id: string;
  user_id: string;
  question_id: string;
  created_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export interface ParticipantWithNickname extends User {
  id: string;
  nickname: string;
}

// Component props types
export interface QuizScreenParams {
  roomId: string;
  role: 'host' | 'participant';
}

export interface RoomScreenParams {
  mode: 'create' | 'join';
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
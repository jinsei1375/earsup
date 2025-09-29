// services/audioService.ts
import * as Speech from 'expo-speech';
import type { VoiceSettings } from '@/types';

class AudioService {
  private currentSpeech: string | null = null;

  async playText(
    text: string,
    settings: VoiceSettings = { gender: 'female', speed: 1.0 },
    callbacks?: { onDone?: () => void; onError?: (error: any) => void }
  ) {
    try {
      // 既に再生中の音声があれば停止
      if (this.currentSpeech) {
        await this.stop();
      }

      this.currentSpeech = text;

      // 利用可能な音声を取得
      const availableVoices = await Speech.getAvailableVoicesAsync();

      // 英語の音声を優先的に選択
      const englishVoices = availableVoices.filter(
        (voice) => voice.language.startsWith('en-US') || voice.language.startsWith('en-')
      );

      // 性別に基づいて音声を選択（実際の利用可能音声に基づく）
      let selectedVoice = englishVoices.find((voice) => {
        const voiceName = voice.name.toLowerCase();

        if (settings.gender === 'male') {
          // 男性音声の判定（実際に利用可能な音声）
          return (
            voiceName.includes('daniel') ||
            voiceName.includes('rishi') ||
            voiceName.includes('albert') ||
            voiceName.includes('fred') ||
            voiceName.includes('ralph')
          );
        } else {
          // 女性音声の判定（実際に利用可能な音声）
          return (
            voiceName.includes('karen') ||
            voiceName.includes('moira') ||
            voiceName.includes('samantha') ||
            voiceName.includes('kathy') ||
            voiceName.includes('tessa')
          );
        }
      });

      // 性別に合う音声が見つからない場合、高品質な標準音声を選択
      if (!selectedVoice) {
        if (settings.gender === 'male') {
          // 男性音声の優先順位: Daniel (en-GB) -> Fred (en-US) -> その他
          selectedVoice =
            englishVoices.find((v) => v.name.toLowerCase().includes('daniel')) ||
            englishVoices.find((v) => v.name.toLowerCase().includes('fred')) ||
            englishVoices.find((v) => v.language === 'en-US');
        } else {
          // 女性音声の優先順位: Samantha (en-US) -> Karen (en-AU) -> その他
          selectedVoice =
            englishVoices.find((v) => v.name.toLowerCase().includes('samantha')) ||
            englishVoices.find((v) => v.name.toLowerCase().includes('karen')) ||
            englishVoices.find((v) => v.language === 'en-US');
        }
      }

      // 最終的にフォールバック
      if (!selectedVoice && englishVoices.length > 0) {
        selectedVoice = englishVoices[0];
      }

      const speechOptions: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: settings.speed,
        voice: selectedVoice?.identifier,
        onDone: () => {
          this.currentSpeech = null;
          callbacks?.onDone?.();
        },
        onError: (error: any) => {
          this.currentSpeech = null;
          callbacks?.onError?.(error);
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      this.currentSpeech = null;
      console.error('Audio playback error:', error);
      callbacks?.onError?.(error);
      throw error;
    }
  }

  async stop() {
    try {
      await Speech.stop();
      this.currentSpeech = null;
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  isPlaying(): boolean {
    return this.currentSpeech !== null;
  }

  // 利用可能な音声の一覧を取得（デバッグ用）
  async getAvailableVoices() {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('Error getting available voices:', error);
      return [];
    }
  }

  // 英語テキストかどうかをバリデーション
  validateEnglishText(text: string): { isValid: boolean; error?: string } {
    // 空文字チェック
    if (!text || text.trim().length === 0) {
      return { isValid: false, error: 'テキストが入力されていません' };
    }

    // 日本語文字（ひらがな、カタカナ、漢字）が含まれているかチェック
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    if (japanesePattern.test(text)) {
      return {
        isValid: false,
        error: '英語フレーズには、英語のみ入力してください（日本語文字が含まれています）',
      };
    }

    // 基本的な英語文字のみかチェック（英字、数字、基本的な記号のみ許可）
    const englishPattern = /^[a-zA-Z0-9\s.,;:!?'’"()\-\n\r]+$/;
    if (!englishPattern.test(text)) {
      return {
        isValid: false,
        error: '英語のフレーズのみ入力してください（使用できない文字が含まれています）',
      };
    }

    return { isValid: true };
  }
}

export const audioService = new AudioService();

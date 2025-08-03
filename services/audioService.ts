// services/audioService.ts
import * as Speech from 'expo-speech';
import type { VoiceSettings } from '@/types';

class AudioService {
  private currentSpeech: string | null = null;

  async playText(text: string, settings: VoiceSettings = { gender: 'male', speed: 1.0 }) {
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
        pitch: settings.gender === 'male' ? 0.8 : 1.0,
        rate: settings.speed,
        voice: selectedVoice?.identifier,
      };

      await Speech.speak(text, speechOptions);
      this.currentSpeech = null; // 再生完了
    } catch (error) {
      console.error('Audio playback error:', error);
      this.currentSpeech = null;
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
      return await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.error('Error getting available voices:', error);
      return [];
    }
  }
}

export const audioService = new AudioService();

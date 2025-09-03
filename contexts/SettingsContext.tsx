// contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SettingsContextType, UserSettings } from '@/types';
import { useUserStore } from '@/stores/userStore';
import UserSettingService from '@/services/userSettingService';

const userSettingService = new UserSettingService();

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Partial<UserSettings> = {
  default_voice_gender: 'female',
  user_icon_url: null,
  theme: 'light',
  font_size: 'medium',
  push_notifications_enabled: true,
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useUserStore((s) => s.userId);

  useEffect(() => {
    if (userId) {
      loadSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [userId]);

  const loadSettings = async () => {
    if (!userId) return;

    try {
      let userSettings = await userSettingService.getUserSettings(userId);

      if (!userSettings) {
        // ユーザー設定が存在しない場合、デフォルト設定を作成
        userSettings = await userSettingService.createUserSettings(userId, DEFAULT_SETTINGS);
      }

      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };
  const updateSettings = async (updatedSettings: Partial<UserSettings>) => {
    if (!userId || !settings) return;

    try {
      const newSettings = await userSettingService.updateUserSettings(settings.id, updatedSettings);

      if (newSettings) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        loading,
        error,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

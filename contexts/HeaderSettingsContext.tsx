// contexts/HeaderSettingsContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface HeaderSettingsConfig {
  showSettings?: boolean;
  onSettingsPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showAddButton?: boolean;
  onAddPress?: () => void;
  addButtonTitle?: string;
}

interface HeaderSettingsContextType {
  settingsConfig: HeaderSettingsConfig;
  setSettingsConfig: (config: HeaderSettingsConfig) => void;
  // InfoModal関連を追加
  isInfoModalVisible: boolean;
  setIsInfoModalVisible: (visible: boolean) => void;
  showInfoModal: () => void;
  hideInfoModal: () => void;
}

const HeaderSettingsContext = createContext<HeaderSettingsContextType | undefined>(undefined);

export const HeaderSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settingsConfig, setSettingsConfig] = useState<HeaderSettingsConfig>({});
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  // useCallbackで関数の参照を安定させる
  const showInfoModal = useCallback(() => setIsInfoModalVisible(true), []);
  const hideInfoModal = useCallback(() => setIsInfoModalVisible(false), []);

  return (
    <HeaderSettingsContext.Provider
      value={{
        settingsConfig,
        setSettingsConfig,
        isInfoModalVisible,
        setIsInfoModalVisible,
        showInfoModal,
        hideInfoModal,
      }}
    >
      {children}
    </HeaderSettingsContext.Provider>
  );
};

export const useHeaderSettings = () => {
  const context = useContext(HeaderSettingsContext);
  if (context === undefined) {
    throw new Error('useHeaderSettings must be used within a HeaderSettingsProvider');
  }
  return context;
};

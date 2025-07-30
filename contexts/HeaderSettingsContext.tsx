// contexts/HeaderSettingsContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

const HeaderSettingsContext = createContext<HeaderSettingsContextType | undefined>(undefined);

export const HeaderSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settingsConfig, setSettingsConfig] = useState<HeaderSettingsConfig>({});

  return (
    <HeaderSettingsContext.Provider value={{ settingsConfig, setSettingsConfig }}>
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

import React, { createContext, useContext, useEffect, useState } from 'react';

interface TelegramContextType {
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  } | null;
  initData: string;
  theme: 'dark' | 'light';
  isReady: boolean;
  haptic: {
    impact: (style: 'light' | 'medium' | 'heavy') => void;
    notification: (type: 'success' | 'error' | 'warning') => void;
  };
  mainButton: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    setColor: (color: string) => void;
  };
}

const TelegramContext = createContext<TelegramContextType | null>(null);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<TelegramContextType['user']>(null);
  const [initData, setInitData] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      tg.ready();
      tg.expand();
      
      setUser(tg.initDataUnsafe.user || null);
      setInitData(tg.initData);
      setTheme(tg.colorScheme || 'dark');
      setIsReady(true);

      // Listen for theme changes
      tg.onEvent?.('themeChanged', () => {
        setTheme(tg.colorScheme || 'dark');
      });
    }
  }, []);

  const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy') => {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    },
    notification: (type: 'success' | 'error' | 'warning') => {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
    },
  };

  const mainButton = {
    setText: (text: string) => {
      window.Telegram?.WebApp?.MainButton?.setText(text);
    },
    show: () => {
      window.Telegram?.WebApp?.MainButton?.show();
    },
    hide: () => {
      window.Telegram?.WebApp?.MainButton?.hide();
    },
    onClick: (callback: () => void) => {
      window.Telegram?.WebApp?.MainButton?.onClick(callback);
    },
    setColor: (color: string) => {
      window.Telegram?.WebApp?.MainButton?.setParams({ color });
    },
  };

  return (
    <TelegramContext.Provider value={{ user, initData, theme, isReady, haptic, mainButton }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
}

import React from 'react';
import { useTelegram } from '../context/TelegramContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isReady } = useTelegram();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-vendy-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-lg mx-auto pb-safe">
        {children}
      </main>
    </div>
  );
}

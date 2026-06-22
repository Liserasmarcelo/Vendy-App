import React from 'react';
import { useTranslation } from 'react-i18next';

// ==========================================
// LOCALIZED TEXT COMPONENT
// ==========================================
interface LocalizedTextProps {
  key: string;
  namespace?: string;
  fallback?: string;
  values?: Record<string, string | number>;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'label';
}

export function LocalizedText({
  key: translationKey,
  namespace = 'common',
  fallback,
  values,
  className,
  as: Component = 'span',
}: LocalizedTextProps) {
  const { t } = useTranslation(namespace);
  
  const text = t(translationKey, {
    ...values,
    defaultValue: fallback || translationKey,
  });

  return <Component className={className}>{text}</Component>;
}

// Shortcut components for common elements
export function T({ children, ...props }: { children: string } & Omit<LocalizedTextProps, 'key'>) {
  return <LocalizedText key={children} {...props} />;
}

export function TButton({ label, ...props }: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useTranslation('common');
  return (
    <button {...props}>
      {t(label, { defaultValue: label })}
    </button>
  );
}

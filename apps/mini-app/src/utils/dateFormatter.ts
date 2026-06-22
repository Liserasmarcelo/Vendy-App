import { format, formatDistance, Locale } from 'date-fns';
import { es, enUS, pt } from 'date-fns/locale';
import { SupportedLocale } from '../i18n';

// ==========================================
// DATE FORMATTER
// ==========================================
const DATE_FNS_LOCALES: Record<SupportedLocale, Locale> = {
  es: es,
  en: enUS,
  pt: pt,
};

export function formatDate(date: Date | string | number, locale: SupportedLocale = 'es'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, 'PPP', { locale: DATE_FNS_LOCALES[locale] });
}

export function formatDateTime(date: Date | string | number, locale: SupportedLocale = 'es'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, 'PPP p', { locale: DATE_FNS_LOCALES[locale] });
}

export function formatRelative(date: Date | string | number, locale: SupportedLocale = 'es'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatDistance(d, new Date(), { 
    addSuffix: true, 
    locale: DATE_FNS_LOCALES[locale] 
  });
}

export function formatShortDate(date: Date | string | number, locale: SupportedLocale = 'es'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: DATE_FNS_LOCALES[locale] });
}

export function formatCurrency(amount: number, currency: string = 'USD', locale: SupportedLocale = 'es'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number, locale: SupportedLocale = 'es'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-ES').format(num);
}

export function formatPercent(value: number, locale: SupportedLocale = 'es'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-ES', {
    style: 'percent',
    minimumFractionDigits: 2,
  }).format(value / 100);
}

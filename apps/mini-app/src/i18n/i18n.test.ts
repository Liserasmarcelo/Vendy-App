import { describe, it, expect } from 'vitest';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_NAMES, LOCALE_FLAGS } from './index';
import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

describe('i18n configuration', () => {
  it('has supported locales', () => {
    expect(SUPPORTED_LOCALES).toContain('es');
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('pt');
    expect(SUPPORTED_LOCALES).toHaveLength(3);
  });

  it('has default locale', () => {
    expect(DEFAULT_LOCALE).toBe('es');
  });

  it('has locale names', () => {
    expect(LOCALE_NAMES.es).toBe('Español');
    expect(LOCALE_NAMES.en).toBe('English');
    expect(LOCALE_NAMES.pt).toBe('Português');
  });

  it('has locale flags', () => {
    expect(LOCALE_FLAGS.es).toBe('🇪🇸');
    expect(LOCALE_FLAGS.en).toBe('🇬🇧');
    expect(LOCALE_FLAGS.pt).toBe('🇧🇷');
  });
});

describe('locale files', () => {
  it('spanish has all required keys', () => {
    expect(es.common).toBeDefined();
    expect(es.auth).toBeDefined();
    expect(es.shop).toBeDefined();
    expect(es.product).toBeDefined();
    expect(es.order).toBeDefined();
    expect(es.payment).toBeDefined();
    expect(es.support).toBeDefined();
    expect(es.help).toBeDefined();
    expect(es.notification).toBeDefined();
    expect(es.errors).toBeDefined();
  });

  it('english has same structure as spanish', () => {
    const esKeys = Object.keys(es);
    const enKeys = Object.keys(en);
    expect(enKeys).toEqual(esKeys);
  });

  it('portuguese has same structure as spanish', () => {
    const esKeys = Object.keys(es);
    const ptKeys = Object.keys(pt);
    expect(ptKeys).toEqual(esKeys);
  });

  it('all locales have common keys', () => {
    const esCommonKeys = Object.keys(es.common);
    const enCommonKeys = Object.keys(en.common);
    const ptCommonKeys = Object.keys(pt.common);

    expect(enCommonKeys).toEqual(esCommonKeys);
    expect(ptCommonKeys).toEqual(esCommonKeys);
  });

  it('spanish translations are not empty', () => {
    expect(es.common.loading).toBeTruthy();
    expect(es.auth.login).toBeTruthy();
    expect(es.shop.title).toBeTruthy();
  });

  it('english translations are not empty', () => {
    expect(en.common.loading).toBeTruthy();
    expect(en.auth.login).toBeTruthy();
    expect(en.shop.title).toBeTruthy();
  });

  it('portuguese translations are not empty', () => {
    expect(pt.common.loading).toBeTruthy();
    expect(pt.auth.login).toBeTruthy();
    expect(pt.shop.title).toBeTruthy();
  });

  it('spanish has interpolation keys', () => {
    expect(es.order.number).toContain('{{number}}');
    expect(es.notification.lowStock).toContain('{{product}}');
    expect(es.notification.subscriptionExpiring).toContain('{{days}}');
  });

  it('english has same interpolation keys', () => {
    expect(en.order.number).toContain('{{number}}');
    expect(en.notification.lowStock).toContain('{{product}}');
    expect(en.notification.subscriptionExpiring).toContain('{{days}}');
  });

  it('portuguese has same interpolation keys', () => {
    expect(pt.order.number).toContain('{{number}}');
    expect(pt.notification.lowStock).toContain('{{product}}');
    expect(pt.notification.subscriptionExpiring).toContain('{{days}}');
  });
});

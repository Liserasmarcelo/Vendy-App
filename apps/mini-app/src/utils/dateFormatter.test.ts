import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatRelative, formatShortDate, formatCurrency, formatNumber, formatPercent } from './dateFormatter';

describe('dateFormatter', () => {
  const testDate = new Date('2024-06-15T10:30:00');

  describe('formatDate', () => {
    it('formats date in Spanish', () => {
      const result = formatDate(testDate, 'es');
      expect(result).toContain('15');
      expect(result).toContain('junio');
    });

    it('formats date in English', () => {
      const result = formatDate(testDate, 'en');
      expect(result).toContain('June');
      expect(result).toContain('15');
    });

    it('formats date in Portuguese', () => {
      const result = formatDate(testDate, 'pt');
      expect(result).toContain('15');
      expect(result).toContain('junho');
    });

    it('accepts string dates', () => {
      const result = formatDate('2024-06-15', 'es');
      expect(result).toContain('15');
    });

    it('accepts number timestamps', () => {
      const result = formatDate(testDate.getTime(), 'es');
      expect(result).toContain('15');
    });
  });

  describe('formatDateTime', () => {
    it('formats datetime in Spanish', () => {
      const result = formatDateTime(testDate, 'es');
      expect(result).toContain('15');
      expect(result).toContain('10:30');
    });
  });

  describe('formatRelative', () => {
    it('returns relative time', () => {
      const yesterday = new Date(Date.now() - 86400000);
      const result = formatRelative(yesterday, 'es');
      expect(result).toContain('ayer');
    });
  });

  describe('formatShortDate', () => {
    it('formats short date', () => {
      const result = formatShortDate(testDate, 'es');
      expect(result).toBe('15/06/2024');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD in Spanish', () => {
      const result = formatCurrency(1234.56, 'USD', 'es');
      expect(result).toContain('$');
      expect(result).toContain('1.234,56');
    });

    it('formats USD in English', () => {
      const result = formatCurrency(1234.56, 'USD', 'en');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('formats PYG in Spanish', () => {
      const result = formatCurrency(50000, 'PYG', 'es');
      expect(result).toContain('Gs');
    });
  });

  describe('formatNumber', () => {
    it('formats number in Spanish', () => {
      const result = formatNumber(1234567.89, 'es');
      expect(result).toContain('1.234.567,89');
    });

    it('formats number in English', () => {
      const result = formatNumber(1234567.89, 'en');
      expect(result).toContain('1,234,567.89');
    });
  });

  describe('formatPercent', () => {
    it('formats percent in Spanish', () => {
      const result = formatPercent(15.5, 'es');
      expect(result).toContain('15,50');
      expect(result).toContain('%');
    });
  });
});

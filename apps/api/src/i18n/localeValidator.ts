import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// ==========================================
// LOCALE VALIDATOR
// ==========================================
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingKeys: string[];
  extraKeys: string[];
}

export class LocaleValidator {
  private referenceLocale: string;
  private localesDir: string;

  constructor(localesDir: string, referenceLocale: string = 'es') {
    this.localesDir = localesDir;
    this.referenceLocale = referenceLocale;
  }

  validateAll(): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};
    const files = readdirSync(this.localesDir).filter(f => f.endsWith('.json'));

    const reference = this.loadLocale(this.referenceLocale);

    for (const file of files) {
      const locale = file.replace('.json', '');
      if (locale === this.referenceLocale) continue;

      results[locale] = this.validateLocale(locale, reference);
    }

    return results;
  }

  validateLocale(locale: string, reference?: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingKeys: string[] = [];
    const extraKeys: string[] = [];

    try {
      const target = this.loadLocale(locale);
      const ref = reference || this.loadLocale(this.referenceLocale);

      const refKeys = this.flattenKeys(ref);
      const targetKeys = this.flattenKeys(target);

      // Find missing keys
      for (const key of refKeys) {
        if (!targetKeys.includes(key)) {
          missingKeys.push(key);
          errors.push(`Missing key: ${key}`);
        }
      }

      // Find extra keys
      for (const key of targetKeys) {
        if (!refKeys.includes(key)) {
          extraKeys.push(key);
          warnings.push(`Extra key: ${key}`);
        }
      }

      // Check for empty translations
      for (const key of targetKeys) {
        const value = this.getValue(target, key);
        if (value === '' || value === null || value === undefined) {
          errors.push(`Empty translation: ${key}`);
        }
      }

      // Check interpolation consistency
      for (const key of refKeys) {
        if (targetKeys.includes(key)) {
          const refValue = this.getValue(ref, key);
          const targetValue = this.getValue(target, key);

          if (typeof refValue === 'string' && typeof targetValue === 'string') {
            const refInterpolations = this.extractInterpolations(refValue);
            const targetInterpolations = this.extractInterpolations(targetValue);

            if (refInterpolations.length !== targetInterpolations.length) {
              warnings.push(`Interpolation mismatch: ${key}`);
            }
          }
        }
      }

    } catch (error) {
      errors.push(`Failed to load locale: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingKeys,
      extraKeys,
    };
  }

  private loadLocale(locale: string): Record<string, any> {
    const path = join(this.localesDir, `${locale}.json`);
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  }

  private flattenKeys(obj: Record<string, any>, prefix: string = ''): string[] {
    const keys: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.flattenKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }

    return keys;
  }

  private getValue(obj: Record<string, any>, key: string): any {
    const parts = key.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }

    return current;
  }

  private extractInterpolations(value: string): string[] {
    const matches = value.match(/\{\{[^}]+\}\}/g);
    return matches || [];
  }
}

// CLI usage
if (require.main === module) {
  const validator = new LocaleValidator('./locales');
  const results = validator.validateAll();

  let hasErrors = false;

  for (const [locale, result] of Object.entries(results)) {
    console.log(`
=== ${locale} ===`);
    console.log(`Valid: ${result.valid}`);
    
    if (result.errors.length > 0) {
      hasErrors = true;
      console.log(`
Errors (${result.errors.length}):`);
      result.errors.forEach(e => console.log(`  ❌ ${e}`));
    }

    if (result.warnings.length > 0) {
      console.log(`
Warnings (${result.warnings.length}):`);
      result.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log('  ✅ All good!');
    }
  }

  process.exit(hasErrors ? 1 : 0);
}

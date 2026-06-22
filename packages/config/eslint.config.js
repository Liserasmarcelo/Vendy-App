import type { Linter } from 'eslint';

const config: Linter.Config = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'import/order': ['warn', { alphabetize: { order: 'asc' } }],
    'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.config.js'],
};

export default config;

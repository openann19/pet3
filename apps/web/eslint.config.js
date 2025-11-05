import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import promise from 'eslint-plugin-promise';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/dist/**', '**/build/**', '**/.next/**', '**/coverage/**', '**/node_modules/**', '**/kyc-native.ts'] },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map(c => ({ ...c, files: ['**/*.{ts,tsx}'] })),
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: { project: ['tsconfig.json'], tsconfigRootDir: import.meta.dirname },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
      unicorn,
      sonarjs,
      promise,
      security,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'smart'],
      'unicorn/prefer-optional-catch-binding': 'error',
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
      'promise/catch-or-return': 'error',
      'security/detect-object-injection': 'off',
      // ❌ PRODUCTION BLOCKER: Ban spark.kv usage
      'no-restricted-globals': [
        'error',
        {
          name: 'spark',
          message: '❌ PRODUCTION BLOCKER: spark.kv mocks are banned in production. Use real API endpoints instead.'
        }
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'spark',
          message: '❌ PRODUCTION BLOCKER: window.spark.kv mocks are banned. Use APIClient with real endpoints instead.'
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.name="window"][property.name="spark"]',
          message: '❌ PRODUCTION BLOCKER: window.spark usage detected. Migrate to real API endpoints.'
        },
        {
          selector: 'MemberExpression[property.name="kv"]',
          message: '❌ PRODUCTION BLOCKER: .kv usage detected. Use real database/API storage instead.'
        },
        {
          selector: 'CallExpression[callee.type="MemberExpression"][callee.property.name="get"][callee.object.property.name="kv"]',
          message: '❌ PRODUCTION BLOCKER: spark.kv.get() calls are banned. Use APIClient.get() instead.'
        },
        {
          selector: 'CallExpression[callee.type="MemberExpression"][callee.property.name="set"][callee.object.property.name="kv"]',
          message: '❌ PRODUCTION BLOCKER: spark.kv.set() calls are banned. Use APIClient.post/put() instead.'
        },
        {
          selector: 'CallExpression[callee.type="MemberExpression"][callee.property.name="delete"][callee.object.property.name="kv"]',
          message: '❌ PRODUCTION BLOCKER: spark.kv.delete() calls are banned. Use APIClient.delete() instead.'
        }
      ]
    },
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
    {
    files: ['src/core/**/*.{ts,tsx}', 'src/api/**/*.{ts,tsx}', 'design-system/**/*.{ts,tsx}'],                                                                  
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Property[value.type="Identifier"][value.name="undefined"]',
          message: 'Optional props must be omitted. If you truly need undefined, declare `T | undefined` explicitly.',                                          
        },
      ],
    },
  },
  {
    files: ['**/*.mjs', 'scripts/**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
    {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  }
];

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/prefer-optional-chain': 'warn',
      curly: ['error', 'all'],
      'capitalized-comments': ['warn', 'never', { ignorePattern: 'JSON' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/function-component-definition': ['error', { namedComponents: 'function-declaration' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      eqeqeq: 'error',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-shadow': ['warn', { ignoreTypeValueShadow: true }],
      'no-unneeded-ternary': 'error',
    },
  },
  prettier,
]);

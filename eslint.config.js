'use strict';

const globals = require('globals');

module.exports = [
  {
    ignores: ['gas/**', 'node_modules/**', 'test-results/**'],
  },
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        gtag: 'readonly',
        showNotification: 'readonly',
        initAccordion: 'readonly',
        initChapterRail: 'readonly',
        initWebsiteTabs: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
];

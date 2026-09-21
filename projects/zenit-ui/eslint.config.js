// @ts-check
const { defineConfig } = require('eslint/config');
const rootConfig = require('../../eslint.config.js');

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'z',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'z',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // Button ist laut API-Tabelle eine Komponente mit Attribut-Selektor
    // (button[zBtn], a[zBtn]).
    files: ['**/button.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'z',
          style: 'camelCase',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
]);

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
      // Die API-Tabelle schreibt fuer die ganze Library beide Selektor-Arten vor:
      // Element (z-badge, z-panel) und Attribut (button[zBtn], button[zMenuItem],
      // button[zGameTile], a[zRow]). Die Regel nimmt dafuer je Art eine Konfiguration,
      // weil "style" sonst nur zu einer der beiden passt.
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: 'z', style: 'kebab-case' },
          { type: 'attribute', prefix: 'z', style: 'camelCase' },
        ],
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
]);

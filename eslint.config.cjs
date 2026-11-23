const { defineConfig } = require('eslint/config');
const angular = require('@angular-eslint/eslint-plugin');
const template = require('@angular-eslint/eslint-plugin-template');
const templateParser = require('@angular-eslint/template-parser');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = defineConfig(
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: typescriptParser },
    plugins: {
      '@angular-eslint': angular,
      '@angular-eslint/template': template,
    },
    processor: '@angular-eslint/template/extract-inline-html',
    rules: {
      ...angular.configs.recommended.rules,
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Page', 'Component'] }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
    },
  },
  {
    files: ['src/**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { '@angular-eslint/template': template },
    rules: template.configs.recommended.rules,
  },
);

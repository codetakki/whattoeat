/**
 * .eslint.js
 *
 * ESLint configuration file.
 */

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'vuetify',
    '@vue/eslint-config-typescript',
    './.eslintrc-auto-import.json',

  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    'space-before-function-paren': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/html-closing-bracket-no-newline': 'on',
  },
}

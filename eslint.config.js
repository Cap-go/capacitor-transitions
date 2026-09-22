const ionic = require('@ionic/eslint-config/recommended');

module.exports = [
  {
    ignores: [
      'build',
      'dist',
      'examples',
      'example-app',
      'docs',
      'android',
      'ios',
      'scripts/check-cap9-deprecated.mjs',
    ],
  },
  ...ionic,
];

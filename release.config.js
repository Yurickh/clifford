module.exports = {
  branches: ['main'],
  plugins: [
    'semantic-release-gitmoji',
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'lib/index.js', label: 'Standard distribution' },
          { path: 'lib/index.mjs', label: 'ES6 modules distribution' },
          { path: 'lib/index.modern.js', label: 'Modern JS distribution' },
          { path: 'lib/index.umd.js', label: 'UMD distribution' },
        ],
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['package.json'],
        message: '🔖 ${nextRelease.version}\n\n${nextRelease.notes}',
      },
    ],
  ],
}

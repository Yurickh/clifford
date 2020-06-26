module.exports = {
  branches: ['main'],
  plugins: [
    'semantic-release-gitmoji',
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'lib/clifford.js', label: 'Standard distribution' },
          { path: 'lib/clifford.mjs', label: 'ES6 modules distribution' },
          { path: 'lib/clifford.modern.js', label: 'Modern JS distribution' },
          { path: 'lib/clifford.umd.js', label: 'UMD distribution' },
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

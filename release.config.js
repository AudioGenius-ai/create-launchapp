module.exports = {
  git: {
    tagName: 'v${version}',
    commitMessage: 'chore: release ${version}',
    addFiles: ['CHANGELOG.md']
  },
  npm: {
    publish: false
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'conventionalcommits',
      infile: 'CHANGELOG.md'
    }
  },
  hooks: {
    'before:init': ['pnpm test'],
    'after:bump': ['pnpm run build']
  }
};

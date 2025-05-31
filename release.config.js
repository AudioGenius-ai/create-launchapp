module.exports = {
  git: {
    tagName: 'v${version}',
    commitMessage: 'chore: release ${version}'
  },
  npm: {
    publish: false
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'conventionalcommits'
    }
  },
  hooks: {
    'before:init': ['pnpm test'],
    'after:bump': ['pnpm run build']
  }
};

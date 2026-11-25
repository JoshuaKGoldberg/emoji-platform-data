import { defineConfig, type OxfmtConfig } from 'oxfmt';

const config: OxfmtConfig = defineConfig({
  ignorePatterns: [
    '**/CHANGELOG.md',
    '.all-contributorsrc',
    'coverage',
    'packages/*/dist',
    'packages/*/lib',
    'packages/generator/android.json',
    'packages/generator/discord.json',
    'packages/generator/emoji.yml',
    'packages/generator/gnome.json',
    'packages/generator/macos.json',
    'packages/generator/slack.json',
    'packages/generator/wechat.json',
    'packages/generator/windows.json',
    'pnpm-lock.yaml',
  ],
  overrides: [
    {
      files: ['.nvmrc'],
      options: { parser: 'yaml' },
    },
  ],
  singleQuote: true,
  sortImports: true,
  sortPackageJson: false,
});

export default config;

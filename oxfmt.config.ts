import { defineConfig, type OxfmtConfig } from 'oxfmt';

const config: OxfmtConfig = defineConfig({
  ignorePatterns: [
    '**/CHANGELOG.md',
    '.all-contributorsrc',
    'coverage',
    'packages/*/dist',
    'packages/*/lib',
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

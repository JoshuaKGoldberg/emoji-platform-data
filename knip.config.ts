import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreExportsUsedInFile: { interface: true, type: true },
  workspaces: {
    '.': {
      ignoreDependencies: ['@changesets/cli'],
    },
    'packages/generator': {
      ignore: ['scripts/extractMacOS.ts'],
      ignoreDependencies: ['fluemoji'],
    },
  },
};

export default config;

import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreExportsUsedInFile: { interface: true, type: true },
  workspaces: {
    '.': {
      ignoreDependencies: ['@changesets/cli'],
    },
  },
};

export default config;

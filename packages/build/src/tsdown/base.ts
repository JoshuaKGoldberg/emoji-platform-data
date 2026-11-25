// Managed by create-typescript-monorepo-bingo: changes here are replaced on transitions.

import type { UserConfig } from 'tsdown';

export const base: UserConfig = {
  attw: {
    enabled: 'ci-only',
    profile: 'esm-only',
  },
  clean: ['./node_modules/.cache/tsbuild/'],
  // Building referenced packages first keeps their types from being `any`
  dts: { tsc: { build: true, incremental: true } },
  entry: ['src/index.ts'],
  exports: {
    devExports: true,
  },
  publint: 'ci-only',
};

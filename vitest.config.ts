// Managed by create-typescript-monorepo-bingo: changes here are replaced on transitions.

import { readdirSync } from 'node:fs';
import path from 'node:path';

import { defaultExclude, defineConfig } from 'vitest/config';

// Untyped to work with all Vitest versions that have projects
const config = defineConfig({
  test: {
    coverage: {
      exclude: [...defaultExclude, '**/config.ts'],
      include: ['packages/*/src/**/*.ts'],
      reporter: ['html', 'lcov', 'text'],
    },
    passWithNoTests: true,

    projects: readdirSync(path.join(import.meta.dirname, 'packages'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map(({ name }) => ({
        test: {
          clearMocks: true,
          include: ['**/src/**/*.test.ts'],
          name,
          root: path.join(import.meta.dirname, 'packages', name),
          setupFiles: ['console-fail-test/setup'],
        },
      })),
  },
});

export default config;

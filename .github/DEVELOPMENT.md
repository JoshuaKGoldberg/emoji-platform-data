# Development

After [forking the repo from GitHub](https://help.github.com/articles/fork-a-repo) and [installing pnpm](https://pnpm.io/installation):

```shell
git clone https://github.com/(your-name-here)/emoji-platform-data
cd emoji-platform-data
pnpm install
```

Each package is under `packages/`, with shared build configuration in `packages/build`.

## Building

Run [**tsdown**](https://tsdown.dev) through pnpm to build each package's `src/` into `dist/`:

```shell
pnpm build
```

## Formatting

[Oxfmt](https://oxc.rs/docs/guide/usage/formatter) is used to format code.
It should be applied automatically when you save files in VS Code or make a Git commit.

To manually reformat all files, you can run:

```shell
pnpm format --write
```

## Linting

[ESLint](https://eslint.org) is used with [typescript-eslint](https://typescript-eslint.io) to lint source files:

```shell
pnpm lint
```

Other linters include [CSpell](https://cspell.org) for spelling and [Knip](https://knip.dev) for unused files, dependencies, and code exports:

```shell
pnpm lint:spelling
pnpm knip
```

## Testing

[Vitest](https://vitest.dev) is used for tests:

```shell
pnpm test
```

Run `pnpm test:coverage` to compute test coverage across all packages and place reports in the `coverage/` directory.

## Type Checking

Run the [TypeScript](https://typescriptlang.org) command-line to type check all packages:

```shell
pnpm typecheck
```

The `typescript` dependency is aliased to TypeScript 6 for tools that use its JavaScript API.

## Releasing

Releases are managed with [Changesets](https://github.com/changesets/changesets).
Add a changeset describing your change with:

```shell
pnpm changeset
```

The release workflow will send a _`chore: version packages`_ PR, then publish once it's merged.

# Development

After [forking the repo from GitHub](https://help.github.com/articles/fork-a-repo) and [installing pnpm](https://pnpm.io/installation):

```shell
git clone https://github.com/(your-name-here)/emoji-platform-data
cd emoji-platform-data
pnpm install
```

> This repository includes a list of suggested VS Code extensions.
> It's a good idea to use [VS Code](https://code.visualstudio.com) and accept its suggestion to install them, as they'll help with development.

## Packages

This repository is a [pnpm workspace](https://pnpm.io/workspaces) containing several packages under `packages/`:

- `generator` (`@emoji-platform-data/generator`): the TypeScript source code that reads each upstream emoji source and generates data
- `emoji-platform-data`: the combined data package, with every emoji's data across all sources
- `android`, `discord`, `emoji-mart`, `emojipedia`, `fluemoji`, `gemoji`, `gnome`, `joypixels`, `macos`, `slack`, `twemoji`, `wechat`, `windows` (`@emoji-platform-data/*`): one data package per upstream source

The data packages contain no source code of their own.
Each has a small `build.ts` that calls the generator's source to regenerate its `lib/` directory, which is gitignored.

`packages/build` (`@emoji-platform-data/build`) holds shared build configuration and isn't published.

## Building

Run `pnpm build` to build the generator with [**tsdown**](https://tsdown.dev) and then regenerate every data package's `lib/`:

```shell
pnpm build
```

The data packages run the generator's source, but read the type declarations it builds, so the generator must be built before them.
`pnpm build` runs the packages in dependency order.
To rebuild only the generator after editing its `src/`, run:

```shell
pnpm --filter @emoji-platform-data/generator build
```

## Refreshing Data

Most sources are dependencies of the generator, which Renovate keeps up to date.
The rest aren't published anywhere, so a script in `packages/generator/scripts/` reads them out of each platform's own app, web client, or system files.
Those are committed as snapshots, such as `packages/generator/discord.json`, so that building the packages never depends on a network fetch or on a particular operating system.

Each data package's own `DEVELOPMENT.md` explains where its data comes from, and, for snapshots, how to refresh it:

- [`android`](../packages/android/DEVELOPMENT.md): snapshot read out of Gboard in Google's Android emulator images
- [`discord`](../packages/discord/DEVELOPMENT.md): snapshot read out of Discord's web client
- [`emoji-mart`](../packages/emoji-mart/DEVELOPMENT.md): npm dependency
- [`emojipedia`](../packages/emojipedia/DEVELOPMENT.md): npm dependency
- [`fluemoji`](../packages/fluemoji/DEVELOPMENT.md): Git dependency
- [`gemoji`](../packages/gemoji/DEVELOPMENT.md): npm dependency
- [`gnome`](../packages/gnome/DEVELOPMENT.md): snapshot read out of GTK's repository
- [`joypixels`](../packages/joypixels/DEVELOPMENT.md): npm dependency
- [`macos`](../packages/macos/DEVELOPMENT.md): snapshot read out of macOS's system frameworks, which needs a Mac
- [`slack`](../packages/slack/DEVELOPMENT.md): snapshot read out of Slack's web client
- [`twemoji`](../packages/twemoji/DEVELOPMENT.md): static copy
- [`wechat`](../packages/wechat/DEVELOPMENT.md): snapshot read out of WeChat's Android app
- [`windows`](../packages/windows/DEVELOPMENT.md): snapshot read out of Windows' language features

A daily `Refresh Data` workflow runs every snapshot's script, each platform in its own job, and opens a pull request for each platform whose data changed.
When a platform's job fails, it opens a `🛠 Tooling: Refresh <platform> Data is failing` issue with the end of the script's output, or comments on that issue if it's already open, and closes the issue once that platform refreshes cleanly again.

## Formatting

[Oxfmt](https://oxc.rs/docs/guide/usage/formatter) is used to format code.
It should be applied automatically when you save files in VS Code or make a Git commit.

To manually reformat all files, you can run:

```shell
pnpm format --write
```

Run this once to leave commits that only format code out of `git blame`:

```shell
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

## Linting

[ESLint](https://eslint.org) is used with [typescript-eslint](https://typescript-eslint.io) to lint source files:

```shell
pnpm lint
```

Add `--fix` to auto-fix some lint rule complaints.

Other linters include [CSpell](https://cspell.org) for spelling, [Knip](https://knip.dev) for unused files, dependencies, and code exports, and [pnpm dedupe](https://pnpm.io/cli/dedupe) for unnecessarily duplicated packages in the `pnpm-lock.yaml` file:

```shell
pnpm lint:spelling
pnpm knip
pnpm dedupe --check
```

## Testing

[Vitest](https://vitest.dev) runs end-to-end tests against the built data packages, so build them first:

```shell
pnpm build
pnpm test
```

`packages/generator/src/packages.test.ts` loads each data package through its `package.json` export, the way a consumer would, with Node.js's own loader rather than Vite's.
It checks that `byEmoji` and `byTitle` agree, that every `byTitle` entry has a data file of its own, and that each single-platform package matches that platform's data in `emoji-platform-data`.
Data packages are found by reading `packages/*`, so a new platform is tested as soon as it has a package.

Each other `packages/generator/src/*.test.ts` file unit tests the module it's next to, such as `utils.test.ts` for `utils.ts`, with small synthetic entries in place of upstream data.

Run `pnpm test:coverage` to compute test coverage and place reports in the `coverage/` directory.

## Type Checking

You should be able to see suggestions from [TypeScript](https://typescriptlang.org) in your editor for all open files.

Run the TypeScript command-line to type check all packages:

```shell
pnpm typecheck
```

The `typescript` dependency is aliased to TypeScript 6 for tools that use its JavaScript API.

## Releasing

[Changesets](https://changesets.dev) versions and publishes the packages in this repository.
Releasing is fully automated: apart from a new package's first publish, no maintainer runs `pnpm publish` by hand.

Any pull request that changes what a package publishes should include a changeset describing the change:

```shell
pnpm changeset
```

That creates a Markdown file in `.changeset/` naming the affected package(s), the semver bump for each, and a summary that becomes their `CHANGELOG.md` entry.
Changes that don't affect published packages, such as CI or repository tooling, don't need one.

The `Merge Changesets PR`, `Refresh Data`, `Release`, and `Transitions` workflows use a [GitHub App](https://docs.github.com/en/apps/creating-github-apps) with **Contents**, **Pull requests**, and **Workflows** write permissions.
They're skipped until its client ID is added as a `RELEASEBOT_APP_CLIENT_ID` Actions variable, which also needs a private key as a `RELEASEBOT_APP_PRIVATE_KEY` Actions secret.

Every push to `main` runs the `Release` workflow, which does one of two things:

1. If any changesets are pending, it opens or updates a _`chore: version packages`_ pull request
2. If no changesets are pending but some package version in the repository isn't on npm yet, it publishes those packages, then pushes a Git tag and GitHub release for each

That version pull request applies each pending changeset: it bumps the affected packages' versions, writes their `CHANGELOG.md` entries, and deletes the changesets it consumed.
Merging it is therefore what triggers a release.
A `Merge Changesets PR` workflow runs each Monday and enables auto-merge on the version PR once it's at least three days old, so releases batch up rather than going out on every merge.
You can also merge it yourself at any time, or run that workflow manually from the Actions tab.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers).
Each published package must be configured on npm to trust this repository's `release.yml` workflow, which is also what earns the packages their [provenance](https://docs.npmjs.com/generating-provenance-statements) attestations.
npm can't yet enable trusted publishing for a package that doesn't exist on the registry ([npm/cli#8544](https://github.com/npm/cli/issues/8544)), so a new package needs one manual `pnpm publish` from a maintainer's machine before its trusted publisher can be configured.
Every release after that goes through this workflow.

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
- `emojipedia`, `fluemoji`, `gemoji`, `macos`, `twemoji` (`@emoji-platform-data/*`): one data package per upstream source

The data packages contain no source code of their own.
Each has a small `build.ts` that calls the generator to regenerate its `lib/` directory, which is gitignored.

## Building

Run `pnpm build` to build the generator and then regenerate every data package's `lib/`:

```shell
pnpm build
```

The data packages depend on the generator's built `lib/`, so the generator must be built before them.
`pnpm build` runs the packages in dependency order.
To rebuild only the generator after editing its `src/`, run:

```shell
pnpm --filter @emoji-platform-data/generator build
```

## Refreshing macOS Data

Every other source is an npm or Git dependency that `pnpm build` can read on any machine.
macOS is not: its emoji keywords live in a search index inside `CoreEmoji.framework`, a private system framework.
Reading it needs a Mac.

So `@emoji-platform-data/macos` is built from a snapshot, `packages/generator/macos.json`, that is committed to this repository.
Building the packages reads that file and never touches the system frameworks, which is why contributors on Linux and Windows can build everything.

To refresh the snapshot on any Mac:

```shell
pnpm --filter @emoji-platform-data/generator refresh:macos
```

That compiles `packages/generator/scripts/extractMacOS.ts` and runs it under `osascript`, as [JavaScript for Automation](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/Introduction.html), whose Objective-C bridge can call private frameworks.
It loads `EmojiFoundation.framework` -the framework macOS's own emoji picker uses- where each `EMFEmojiToken` knows its emoji and the document ID for that emoji in the search index, and `EMFInvertedIndex` turns that ID into the emoji's keywords and their search weights.
`packages/generator/scripts/refreshMacOS.ts` then keeps the emoji that have keywords, sorts each emoji's keywords by weight, drops the weights themselves, and records the macOS and CoreEmoji versions it read.

Every class and selector the extraction uses is private API, so it checks all of them up front and names any that a macOS update has moved.
The refresh then validates what came back before writing anything: how many emoji have keywords, that each picker category is well represented, that a few known emoji still have known keywords, and that the count hasn't fallen sharply since the last snapshot.
Those checks exist because these frameworks can keep their method names and quietly start returning nothing, which would otherwise overwrite the snapshot with a smaller, wrong one.

The snapshot is byte-for-byte reproducible: refreshing twice on one Mac, or on two Macs running the same macOS version, produces the same file.
Apple changes these keywords between macOS releases, so a refresh belongs in its own pull request, with a changeset, describing which macOS version it came from.
A `Refresh macOS Data` workflow does exactly that automatically each month, on a `macos-latest` runner.
It skips opening a pull request when that runner is on an older macOS than the committed snapshot, so a lagging runner image can't roll the data back.

Both files are unusually low-level for this repository, and they depend on private frameworks that Apple can rename or restructure in any release.
If a future macOS breaks the extraction, the failure will name the missing class or selector, and the `required` map at the top of `extractMacOS.ts` lists every symbol it depends on.
Its type declarations for the bridge describe the same API surface, but only the `required` map is checked at runtime, so the two are meant to be kept in step.

## Formatting

[Prettier](https://prettier.io) is used to format code.
It should be applied automatically when you save files in VS Code or make a Git commit.

To manually reformat all files, you can run:

```shell
pnpm format --write
```

## Linting

This package includes several forms of linting to enforce consistent code quality and styling.
Each should be shown in VS Code, and can be run manually on the command-line:

- `pnpm lint` ([ESLint](https://eslint.org) with [typescript-eslint](https://typescript-eslint.io)): Lints JavaScript and TypeScript source files
- `pnpm lint:knip` ([knip](https://github.com/webpro/knip)): Detects unused files, dependencies, and code exports
- `pnpm lint:packages` ([pnpm dedupe --check](https://pnpm.io/cli/dedupe)): Checks for unnecessarily duplicated packages in the `pnpm-lock.yml` file
- `pnpm lint:spelling` ([cspell](https://cspell.org)): Spell checks across all source files

Read the individual documentation for each linter to understand how it can be configured and used best.

For example, ESLint can be run with `--fix` to auto-fix some lint rule complaints:

```shell
pnpm run lint --fix
```

## Type Checking

You should be able to see suggestions from [TypeScript](https://typescriptlang.org) in your editor for all open files.

However, it can be useful to run the TypeScript command-line (`tsc`) to type check all files:

```shell
pnpm tsc
```

Add `--watch` to keep the type checker running in a watch mode that updates the display as you save files:

```shell
pnpm tsc --watch
```

## Releasing

[Changesets](https://changesets.dev) versions and publishes the packages in this repository.
Releasing is fully automated: no maintainer runs `pnpm publish` by hand.

Any pull request that changes what a package publishes should include a changeset describing the change:

```shell
pnpm changeset
```

That creates a Markdown file in `.changeset/` naming the affected package(s), the semver bump for each, and a summary that becomes their `CHANGELOG.md` entry.
Changes that don't affect published packages, such as CI or repository tooling, don't need one.

Every push to `main` runs the `Release` workflow, which does one of two things:

1. If any changesets are pending, it opens or updates a _`chore: version packages`_ pull request
2. If no changesets are pending but some package version in the repository isn't on npm yet, it publishes those packages, then pushes a Git tag and GitHub release for each

That version pull request applies each pending changeset: it bumps the affected packages' versions, writes their `CHANGELOG.md` entries, and deletes the changesets it consumed.
Merging it is therefore what triggers a release.
A `Merge Changesets PR` workflow runs each Monday and enables auto-merge on the version PR once it's at least three days old, so releases batch up rather than going out on every merge.
You can also merge it yourself at any time, or run that workflow manually from the Actions tab.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers).
Each published package is configured on npm to trust this repository's `release.yml` workflow, which is also what earns the packages their [provenance](https://docs.npmjs.com/generating-provenance-statements) attestations.
npm can't yet enable trusted publishing for a package that doesn't exist on the registry ([npm/cli#8544](https://github.com/npm/cli/issues/8544)), so a new package needs one manual `pnpm publish` from a maintainer's machine before its trusted publisher can be configured.
Every release after that goes through this workflow.

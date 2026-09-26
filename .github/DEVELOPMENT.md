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
- `discord`, `emoji-mart`, `emojipedia`, `fluemoji`, `gemoji`, `macos`, `slack`, `twemoji`, `wechat` (`@emoji-platform-data/*`): one data package per upstream source

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

## Refreshing Discord Data

Discord doesn't publish its emoji list anywhere.
It's inside the web client's JavaScript bundle, which the desktop app loads too -the app itself is an Electron shell that ships no emoji data of its own.

Reading it needs nothing but a network connection, so, unlike macOS, any machine can refresh it:

```shell
pnpm --filter @emoji-platform-data/generator refresh:discord
```

The script can also be pointed at another page listing the client's scripts, such as a canary build's:

```shell
pnpm --filter @emoji-platform-data/generator refresh:discord https://canary.discord.com/app
```

`packages/generator/scripts/refreshDiscord.ts` fetches <https://discord.com/app> and collects the `/assets/*.js` it lists.
Two of those matter, and each JSON blob it wants sits inside a single-quoted JavaScript string literal, so the script scans to that literal's first unescaped quote and converts the two escapes the bundler emits that JSON doesn't share.
It finds a blob by parsing every literal in a script and asking what each one holds, rather than by where it sits or what its first key is, since neither is Discord's to keep stable.

The emoji themselves are in a chunk Discord names `vnd-emoji.*`, which the script tries first, falling back to reading every script.
That gives each emoji's shortcodes, and the `emojisByCategory` ranges that say which category and picker position it has.

The keywords the picker actually searches on are not in there.
They're a separate set per locale, in a chunk loaded on demand, so finding the `en-US` one means reading the client's own minified code.
The client chunk is identified by carrying both halves of what that takes -a locale-to-chunk-id map, and the bundler's chunk-to-file map- rather than by its `web.*` name or by any function in it.
From there the script prefers a shortcut: the emoji store's search method, `nameMatchesChain`, sits in the module that references the locale map, which names the chunk id directly.

Every one of those lookups is a guess about minified code, so each insists on matching exactly once.
A pattern that starts matching twice is as much a sign of the code having moved on as one that stops matching, and quietly taking the first of two would be a coin flip.
When the shortcut doesn't match, the script says so and falls back to trying every locale chunk the client loads, keeping whichever turns out to hold term lists for emoji that exist.
That fallback is what makes renaming `nameMatchesChain`, or moving the module it lives in, a non-event.

Turning a chunk id into a file name has the same shape.
The bundler writes some chunks with their id in the file name and the rest as a bare hash, in the same build, and which of the two a given chunk gets isn't stable across builds.
Rather than reimplement that choice, the script offers every form the client spells out for the id and lets the fetch decide.

The data lists every skin tone variant of the emoji that have them, but only so that shortcodes like `wave_tone3` resolve.
Their names are mechanical suffixes on the base emoji's, unlike the macOS variants that carry real search terms, so they're dropped rather than folded in.
What's left is the 1,932 emoji the picker lists, 1,557 of which have keywords; the rest are almost all country flags, which the picker finds by name alone.

The result is committed as a snapshot, `packages/generator/discord.json`, the same way macOS is, so that building the packages never depends on a network fetch.
Discord rebuilds its bundle many times a day and every deploy renames the chunks, so the script rewrites the snapshot only when the emoji themselves changed, and validates what it read before writing anything: how many emoji came back, how many of them have keywords, that every picker category is well represented, that a few known emoji still have known shortcodes _and_ known keywords, and that neither count has fallen sharply since the last snapshot.
The keywords come from a different script than the emoji and are matched up by name, so those canaries are what catch the two coming apart as well as either going missing.

A `Refresh Discord Data` workflow runs the same thing monthly and opens a pull request when the data changed.

## Refreshing macOS Data

Most other sources are an npm or Git dependency that `pnpm build` can read on any machine.
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

## Refreshing Slack Data

Slack doesn't publish its emoji list either.
Like Discord's, its desktop app is an Electron shell that loads the web client and ships no emoji data of its own, so the data comes from the web client's bundle.

Reading it needs nothing but a network connection, so any machine can refresh it:

```shell
pnpm --filter @emoji-platform-data/generator refresh:slack
```

`packages/generator/scripts/refreshSlack.ts` fetches <https://app.slack.com/client>, which serves the full client page even to a signed-out visitor, as long as the request looks like it comes from a browser Slack supports.
Fetch's own user agent gets an older build instead, so the script sends a current Chrome one.
The page names the CDN it loads from in a `data-cdn` attribute, lists the scripts it loads up front, and maps each locale to its translation file.

Everything but the translations is in one module, which Slack bundles into a chunk named `gantry-v2-shared.*` that the script tries first, falling back to every script the page loads up front.
The module holds three things:

- The emoji data: every shortcode, the code points it stands for, and which shortcodes are aliases of which
- The picker's categories, each listing its emoji by shortcode in picker order
- The English name of each emoji and the English keywords the picker searches on

The first two are JSON blobs inside single-quoted string literals, found the same way Discord's are: by parsing every literal and asking what each one holds.
The names and keywords are code rather than data -object literals like `{octopus:[c.t("animal"),c.t("creature"),…]}`, where `c` is the client's translator for one namespace- so the script reads them as text, never evaluating anything the bundle contains.
Each namespace's translator is created from a string, such as `new o.Ay("emoji_keywords")`, that the client has to keep since it names the translations too, so the map is found through that rather than through a variable or function name.
The map is then read an entry at a time, and anything that isn't a key followed by a translator call or an array of them stops the refresh rather than being skipped.

The translations are one file per locale, each with an `emoji_names` and an `emoji_keywords` namespace.
Those don't key a translation by its English text, but by the first seven characters of the SHA-1 of that text, or ten, twenty, or all forty when seven would collide within the locale; the client tries each in turn, and so does the script.
A value of `0` means the translation is the same as the English.
Every locale has a key for every English term as of writing, so validation insists on 95% of them being found, which is what catches the hashing changing.
Anything not found falls back to the English, as it does in the client.

The emoji data lists every skin tone variant of the emoji that have them, but only so that shortcodes like `wave::skin-tone-3` resolve, so those are dropped just as Discord's are.
It also lists 52 emoji the picker doesn't, mostly the gender-neutral forms of older people emoji such as 👮 `cop`, which the picker shows only as their man and woman variants; those are kept, without a category or order.
The keyword map has a stray `undefined` key, which is dropped with a warning.

The result is committed as a snapshot, `packages/generator/slack.json`, the same way Discord's is.
The script rewrites the snapshot only when the emoji or the locales changed, and validates what it read before writing anything: how many emoji came back, how many of them have keywords, that every picker category is well represented, that every expected locale is there with its terms found, that a few known emoji still have known shortcodes and keywords in English _and_ in another locale, and that neither count has fallen sharply since the last snapshot.

A `Refresh Slack Data` workflow runs the same thing monthly and opens a pull request when the data changed.

## Refreshing WeChat Data

WeChat doesn't publish its emoji list either, and for a long time it looked as though it didn't have one to publish.
Its desktop clients -Windows, Linux, and macOS all build from the same Qt code- hold 452 emoji as bare string literals, which is enough to draw them and nothing else: no names, no keywords, no categories.
The `NgEmojiMap.bundle/gemoji.json` that older macOS builds shipped is a 2016 copy of [gemoji](https://github.com/wooorm/gemoji)'s own list, so it adds nothing this repository doesn't already have.

The Android app is the one that carries real data, in two files:

- `system_emoji_category.json`, the picker's category listing, in picker order
- `emoji_map.csv`, the search index, written a term at a time

Reading them needs nothing but a network connection, so, unlike macOS, any machine can refresh it:

```shell
pnpm --filter @emoji-platform-data/generator refresh:wechat
```

The script can also be pointed at a specific build, or at another page listing them:

```shell
pnpm --filter @emoji-platform-data/generator refresh:wechat https://dldir1v6.qq.com/weixin/android/weixin8078android3180_0x28004e32_arm64.apk
```

`packages/generator/scripts/refreshWeChat.ts` scrapes <https://weixin.qq.com> for the Android builds it offers and takes the newest, since Tencent lists several at once including years-old ones kept for older devices.

That build is a ~280MB file, and downloading it monthly to read 220KB out of it would be silly.
It's a zip, though, and the CDN serves ranges, so the script reads it the way a zip is meant to be read: the last few kilobytes hold a record pointing at the central directory, the central directory says where every file inside sits, and only the two files that matter are fetched and inflated.
That comes to under 2MB.
Each of the two is looked up by exact name and has to appear exactly once -a name that starts matching twice is as much a sign of the app having moved on as one that stops matching- and a zip that turns out to be Zip64, or whose index runs past its own end, is refused rather than read as garbage.

The two files are joined by glyph, which is the only thing they share.
They disagree about which emoji they cover: 57 the picker lists aren't searchable at all, and 531 the search knows aren't in the picker, so entries keep whatever either file knows rather than only their intersection.
The search index also reaches into the private use area, for Apple's logo; anything there is dropped, since it isn't a unicode emoji.
Variation selectors are normalized away when matching, since the search index writes ❤️ as _U+2764 U+FE0F_ while the listing has _U+2764_.
Rows of the search index that match only one of WeChat's own stickers, rather than a unicode emoji, are dropped: those are images, with no glyph to key them by.

The picker also gives each emoji a description, such as `笑出眼泪的脸` for 😂.
Those are deliberately not kept.
They read as translations of the emoji's Unicode name rather than as anything a person would type, CLDR already publishes Chinese names for every emoji, and this repository was burned once already by shipping a WeChat file that turned out to be a copy of another source.
The keywords are the opposite: 84% of them appear in no CLDR Chinese annotation, and they run to things like `摸摸哒`, `xoxo` and `keep it up`.

The result is committed as a snapshot, `packages/generator/wechat.json`, the same way Discord and macOS are, so that building the packages never depends on a network fetch.
Tencent ships a new build every few weeks and the file name carries its version, so the script rewrites the snapshot only when the emoji themselves changed, and validates what it read before writing anything: how many emoji came back, how many of them have keywords, that every picker category is well represented, that a few known emoji still carry a known term in _both_ scripts, and that neither count has fallen sharply since the last snapshot.
The categories and the keywords come from different files, so those bilingual canaries are what catch the two coming apart as well as either going missing.

A `Refresh WeChat Data` workflow runs the same thing monthly and opens a pull request when the data changed.

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

## Testing

[Vitest](https://vitest.dev) runs end-to-end tests against the built data packages, so build them first:

```shell
pnpm build
pnpm test
```

`test/packages.test.ts` imports each data package through its `package.json` export, the way a consumer would, and has Node itself load it rather than Vite.
It checks that `byEmoji` and `byTitle` agree, that every `byTitle` entry has a data file of its own, and that each single-platform package matches that platform's data in `emoji-platform-data`.
Data packages are found by reading `packages/*`, so a new platform is tested as soon as it has a package.

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

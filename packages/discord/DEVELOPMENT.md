# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

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

[`packages/generator/scripts/refreshDiscord.ts`](../generator/scripts/refreshDiscord.ts) fetches <https://discord.com/app> and collects the `/assets/*.js` it lists.
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
What's left is the emoji the picker lists, most of which have keywords; the rest, which the picker finds by name alone, are mostly country flags, along with keycaps, regional indicators, and some sequences, such as most families.

The result is committed as a snapshot, [`packages/generator/discord.json`](../generator/discord.json), the same way macOS is, so that building the packages never depends on a network fetch.
Discord rebuilds its bundle many times a day and every deploy renames the chunks, so the script rewrites the snapshot only when the emoji themselves changed, and validates what it read before writing anything: how many emoji came back, how many of them have keywords, that every picker category is well represented, that a few known emoji still have known shortcodes _and_ known keywords, and that neither count has fallen sharply since the last snapshot.
The keywords come from a different script than the emoji and are matched up by name, so those canaries are what catch the two coming apart as well as either going missing.

The daily `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.

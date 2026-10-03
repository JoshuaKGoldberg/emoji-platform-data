# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing Discord Data

Discord's emoji list is only in its web client's JavaScript bundle, which the desktop app loads too.

Reading it needs nothing but a network connection, so, unlike macOS, any machine can refresh it:

```shell
pnpm --filter @emoji-platform-data/generator refresh:discord
```

The script can also be pointed at another page listing the client's scripts, such as a canary build's:

```shell
pnpm --filter @emoji-platform-data/generator refresh:discord https://canary.discord.com/app
```

[`packages/generator/scripts/refreshDiscord.ts`](../generator/scripts/refreshDiscord.ts) fetches <https://discord.com/app> and finds the JSON it needs in the `/assets/*.js` it lists by parsing every single-quoted string literal and checking what each one holds.

The shortcodes and the `emojisByCategory` picker ranges come from the `vnd-emoji.*` chunk, falling back to every script.

The keywords, keyed by emoji name, are in a per-locale chunk loaded on demand, found by lookups into minified code that must each match exactly once:

- The client chunk is the one with both a locale-to-chunk-id map and the bundler's chunk-to-file map
- The module with `nameMatchesChain`, the emoji search method, references the locale map that names the `en-US` chunk id
- If that doesn't match, the script warns and tries every locale chunk, keeping the one with term lists for emoji that exist
- A chunk's file name may or may not include its id, so the script tries every form the client spells out

Only the emoji the picker lists are kept, dropping skin tone variants such as `wave_tone3`, and the ones without keywords are mostly country flags, plus keycaps, regional indicators, and some sequences such as most families.

The snapshot, [`packages/generator/discord.json`](../generator/discord.json), is rewritten only when the emoji changed, and the script fails without writing it if:

- Too few emoji came back or have keywords, or either count fell sharply since the last snapshot
- A picker category has too few emoji
- A known emoji lost a known shortcode or keyword

The daily `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.

# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing Windows Data

The Windows emoji panel, the one <kbd>Win</kbd> + <kbd>.</kbd> opens, reads its keywords from `datamap.0409.dat` in the `Microsoft-Windows-LanguageFeatures-Basic-en-us` feature on demand, not from the [Fluent UI emoji](https://github.com/microsoft/fluentui-emoji) metadata that `fluemoji` reads.

Reading it needs a network connection and [7-Zip](https://7-zip.org), but not Windows:

```shell
pnpm --filter @emoji-platform-data/generator refresh:windows
```

[`packages/generator/scripts/refreshWindows.ts`](../generator/scripts/refreshWindows.ts) gets the file in three steps:

1. [UUP dump](https://uupdump.net) gives the retail Windows 11 release with the newest build number, which can be a new-hardware release such as 26H1, and Windows Update's link for its feature on demand
2. The ~22MB cabinet downloads from Microsoft's CDN and is checked against Windows Update's SHA-256
3. 7-Zip extracts the LZX-compressed file, as `7zz` or `7z` (`brew install sevenzip` on a Mac; GitHub's Ubuntu runners come with `7z`)

The undocumented file opens with a hash table, then interleaves two kinds of record:

- Strings, as null-terminated UTF-16, each written once, where first used
- Pairs of an emoji and one of its terms, as the offsets of those two strings, then an ID counting down from -2

Each emoji's first pair is its name and the rest are its keywords, and the script fails unless the pairs end exactly where the hash table's lookup lists start.

Skin tone variants are dropped, which the data only has for emoji showing more than one person, such as 🫱🏻‍🫲🏼.

The snapshot, [`packages/generator/windows.json`](../generator/windows.json), is rewritten only when its data changed, not just the source it was read from, and the script fails without writing it if:

- Too few emoji came back or have keywords, or either count fell sharply since the last snapshot
- An emoji has no name
- A known emoji lost a known keyword that CLDR doesn't have

The daily `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.

# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing Windows Data

The Windows emoji panel, the one <kbd>Win</kbd> + <kbd>.</kbd> opens, has its own keywords, and they aren't the [Fluent UI emoji](https://github.com/microsoft/fluentui-emoji) metadata that `fluemoji` reads.
The panel asks `AdvancedEmojiDS.dll` for them, which reads them from `datamap.0409.dat`: `0409` is the locale ID for en-US, and each display language installs its own.
That file ships in the `Microsoft-Windows-LanguageFeatures-Basic-en-us` feature on demand, the language's basic typing features, rather than in Windows itself.

Reading it needs a network connection and [7-Zip](https://7-zip.org), but not Windows:

```shell
pnpm --filter @emoji-platform-data/generator refresh:windows
```

[`packages/generator/scripts/refreshWindows.ts`](../generator/scripts/refreshWindows.ts) asks [UUP dump](https://uupdump.net), which reads Windows Update's own listings, for the newest retail release of Windows 11 and the link Windows Update gives for that release's feature on demand.
Newest is by build number rather than by release name or date: a release for new hardware, such as 26H1, can be a newer build than the release that existing PCs get later in the same year, and it carries the newer data.
The ~22MB cabinet then downloads straight from Microsoft's CDN and is checked against the SHA-256 that Windows Update lists for it, so UUP dump only brokers the link.
It's LZX-compressed, which Node can't inflate, so the script has 7-Zip extract the one file, whichever of `7zz` or `7z` is installed.
GitHub's Ubuntu runners come with `7z`; on a Mac, `brew install sevenzip`.

The file itself is undocumented, but it isn't complicated.
It opens with a hash table, then interleaves two kinds of record:

- Strings, as null-terminated UTF-16, each written once, where first used
- Pairs of an emoji and one of its terms, as the offsets of those two strings, then an ID counting down from -2

Each emoji's first pair is its name, and the rest are its keywords, in order.
Past the last pair are the lists the hash table points to, which index those same pairs for lookup rather than adding any.
The script reads up to where the first of those lists starts, and insists on landing exactly there, which is what catches the layout changing.

The data lists each skin tone combination of the emoji that show more than one person, such as 🫱🏻‍🫲🏼.
Their keywords are their base emoji's plus the names of their skin tones, so they're dropped.

The result is committed as a snapshot, [`packages/generator/windows.json`](../generator/windows.json), the same way Discord, macOS, Slack, and WeChat are, so that building the packages never depends on a network fetch.
Windows ships a cumulative update every month, but this feature on demand only changes with a new release -26H2 still ships the same one as 24H2- so the script rewrites the snapshot only when the emoji themselves changed.
It validates what it read before writing anything: how many emoji came back, how many of them have keywords, that each has a name, that a few known emoji still carry known keywords that CLDR doesn't have, and that neither count has fallen sharply since the last snapshot.

The monthly `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.

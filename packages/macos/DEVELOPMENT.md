# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing macOS Data

macOS's emoji keywords are in a search index inside `CoreEmoji.framework`, a private system framework, so reading them needs a Mac.

Building reads the committed snapshot, [`packages/generator/macos.json`](../generator/macos.json), so it works on any OS.

To refresh the snapshot on any Mac:

```shell
pnpm --filter @emoji-platform-data/generator refresh:macos
```

That compiles [`packages/generator/scripts/extractMacOS.ts`](../generator/scripts/extractMacOS.ts) and runs it under `osascript`, as [JavaScript for Automation](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/Introduction.html), whose Objective-C bridge loads `EmojiFoundation.framework`, the one macOS's own emoji picker uses:

- `EMFEmojiToken` gives each emoji's document ID in the search index, which `EMFInvertedIndex` turns into keywords and search weights
- `EMFEmojiCategory` gives each emoji its `category` and `order` in the picker, skipping Recents, though a few such as ⚕️ have neither

[`packages/generator/scripts/refreshMacOS.ts`](../generator/scripts/refreshMacOS.ts) then keeps the emoji with keywords, folds skin tone variants the picker doesn't list into their base emoji, sorts keywords by their strongest weight, drops the weights, and records the macOS and CoreEmoji versions.

The snapshot is reproducible on a given macOS version and rewritten only when the emoji changed, and the refresh fails without writing it if:

- A private class or selector in the `required` map at the top of `extractMacOS.ts` is missing, which the error names
- Too few emoji have keywords, or that count fell sharply since the last snapshot
- A picker category has too few emoji, or an unrecognized one appeared
- An emoji is missing its names or keywords
- A known emoji lost a known keyword

Each refresh goes in its own pull request with a changeset naming its macOS version, as the daily `Refresh Data` workflow does on `macos-latest` unless the runner's macOS is older than the snapshot's.

Keep the bridge's type declarations in `extractMacOS.ts` in step with its `required` map, since only the map is checked at runtime.

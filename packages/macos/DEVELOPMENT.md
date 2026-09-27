# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing macOS Data

Most other sources are an npm or Git dependency that `pnpm build` can read on any machine.
macOS is not: its emoji keywords live in a search index inside `CoreEmoji.framework`, a private system framework.
Reading it needs a Mac.

So `@emoji-platform-data/macos` is built from a snapshot, [`packages/generator/macos.json`](../generator/macos.json), that is committed to this repository.
Building the packages reads that file and never touches the system frameworks, which is why contributors on Linux and Windows can build everything.

To refresh the snapshot on any Mac:

```shell
pnpm --filter @emoji-platform-data/generator refresh:macos
```

That compiles [`packages/generator/scripts/extractMacOS.ts`](../generator/scripts/extractMacOS.ts) and runs it under `osascript`, as [JavaScript for Automation](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/Introduction.html), whose Objective-C bridge can call private frameworks.
It loads `EmojiFoundation.framework` -the framework macOS's own emoji picker uses- where each `EMFEmojiToken` knows its emoji and the document ID for that emoji in the search index, and `EMFInvertedIndex` turns that ID into the emoji's keywords and their search weights.
[`packages/generator/scripts/refreshMacOS.ts`](../generator/scripts/refreshMacOS.ts) then keeps the emoji that have keywords, sorts each emoji's keywords by weight, drops the weights themselves, and records the macOS and CoreEmoji versions it read.

Every class and selector the extraction uses is private API, so it checks all of them up front and names any that a macOS update has moved.
The refresh then validates what came back before writing anything: how many emoji have keywords, that each picker category is well represented, that a few known emoji still have known keywords, and that the count hasn't fallen sharply since the last snapshot.
Those checks exist because these frameworks can keep their method names and quietly start returning nothing, which would otherwise overwrite the snapshot with a smaller, wrong one.

The snapshot is byte-for-byte reproducible: refreshing twice on one Mac, or on two Macs running the same macOS version, produces the same file.
Apple changes these keywords between macOS releases, so a refresh belongs in its own pull request, with a changeset, describing which macOS version it came from.
The monthly `Refresh Data` workflow does exactly that automatically, on a `macos-latest` runner.
It skips opening a pull request when that runner is on an older macOS than the committed snapshot, so a lagging runner image can't roll the data back.

Both files are unusually low-level for this repository, and they depend on private frameworks that Apple can rename or restructure in any release.
If a future macOS breaks the extraction, the failure will name the missing class or selector, and the `required` map at the top of `extractMacOS.ts` lists every symbol it depends on.
Its type declarations for the bridge describe the same API surface, but only the `required` map is checked at runtime, so the two are meant to be kept in step.

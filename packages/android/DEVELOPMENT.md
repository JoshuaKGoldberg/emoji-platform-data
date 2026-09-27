# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing Android Data

Android's own open source keyboard, AOSP's LatinIME, has emoji categories but no emoji search, and [AndroidX's emoji picker](https://developer.android.com/develop/ui/views/text-and-emoji/emoji-picker) only lists emoji by category.
The search that people use on Android is Gboard's, which is closed source.
Google doesn't offer Gboard's app for download outside of the Play Store, but it does publish it inside the Android emulator's system images with Google Play, on the same public repository the Android SDK installs from.

Gboard carries its English emoji search data in the app itself, as `assets/emoji_en_us_<timestamp>.zip`; other languages, and newer English data, are downloaded after it's installed.
That zip holds two files:

- `en_us`: the search index, a [marisa trie](https://github.com/s-yata/marisa-trie) of every term, then which emoji each term finds
- `en_us.shortcuts`: a protobuf listing a few terms for each emoji, all of which are also in `en_us`

Reading it needs a network connection and [erofs-utils](https://github.com/erofs/erofs-utils) 1.8.5 or newer, for `dump.erofs --cat`, but not Android or its SDK:

```shell
brew install erofs-utils
pnpm --filter @emoji-platform-data/generator refresh:android
```

[`packages/generator/scripts/refreshAndroid.ts`](../generator/scripts/refreshAndroid.ts) reads the SDK's system image listing for the newest stable x86_64 image with Google Play, leaving out extension builds, betas, and the 16KB page size images, whose partitions are ext4 rather than EROFS.
Google's CDN gzips responses for clients that accept it and then reports the gzipped size, so every request to it asks for the file as-is.

The image is a ~2.3GB zip, and Gboard is inside `system.img`, a disk image in it that's deflated as one ~2.8GB stream.
That can't be read piecemeal the way WeChat's app is, but it doesn't need to be on disk all at once either:

1. The zip's central directory, read with range requests, says where `system.img` is
2. `system.img` streams in and inflates, and its CRC-32 is checked against the zip's at the end
3. Its first few megabytes hold a GPT partition table, whose `super` partition holds [Android's dynamic partitions](https://source.android.com/docs/core/ota/dynamic_partitions), whose metadata says which ranges of `super` make up the `product` partition
4. Only those ranges are written to disk, as a ~1.75GB `product.img`

`product.img` is EROFS, which is compressed, so `dump.erofs --cat` reads `/app/LatinIMEGooglePrebuilt/LatinIMEGooglePrebuilt.apk` out of it.
The app is a zip, and the emoji data is a zip inside that, so both are read in memory.

`en_us` opens with a 16-byte header of Gboard's own, then a marisa trie of 6,877 terms.
[`packages/generator/scripts/marisa.ts`](../generator/scripts/marisa.ts) reads just enough of marisa's format to list those terms in ID order: its LOUDS bit vectors, the labels on each edge, and the tails or nested tries that longer runs of labels are stored in.
After the trie, for each term in ID order, is a list of indexes into the list of emoji that comes last, each list preceded by its size in bytes.
Every step insists on landing exactly where the next one starts, which is what catches the layout changing.

Terms are sorted for each emoji, since the order they come in is only the trie's.
`en_us.shortcuts` is left out, since everything in it is in `en_us` too.

The result is committed as a snapshot, [`packages/generator/android.json`](../generator/android.json), the same way Discord, macOS, Slack, and WeChat are, so that building the packages never depends on a network fetch.
Google rebuilds the system images every few months, but the emoji data bundled in Gboard changes less often, so the script rewrites the snapshot only when the emoji themselves changed.
It validates what it read before writing anything: how many emoji and keywords came back, that every emoji has keywords, that a few known emoji still carry known keywords that CLDR doesn't have, and that neither count has fallen sharply since the last snapshot.

The monthly `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.
Ubuntu 24.04's own erofs-utils is 1.7, so it installs a newer one with the Homebrew that GitHub's Ubuntu runners come with.

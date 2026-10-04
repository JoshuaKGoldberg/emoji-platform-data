# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing Android Data

The data is Gboard's emoji search, from the Android emulator's Google Play system images on the public repository the Android SDK installs from.

Gboard bundles only its English data, as `assets/emoji_en_us_<timestamp>.zip`, which holds two files:

- `en_us`: the search index, a [marisa trie](https://github.com/s-yata/marisa-trie) of every term, then which emoji each term finds
- `en_us.shortcuts`: a protobuf listing a few terms for each emoji, all of which are also in `en_us`

Reading it needs a network connection, [erofs-utils](https://github.com/erofs/erofs-utils) 1.8.5 or newer, for `dump.erofs --cat`, and e2fsprogs, for `debugfs`, but not Android or its SDK:

```shell
brew install e2fsprogs erofs-utils
export PATH="$(brew --prefix e2fsprogs)/sbin:$PATH"
pnpm --filter @emoji-platform-data/generator refresh:android
```

[`packages/generator/scripts/refreshAndroid.ts`](../generator/scripts/refreshAndroid.ts) takes the newest stable x86_64 Google Play image from the SDK's listing, other than extension builds and betas, preferring the 4KB page size image over the 16KB one when an API level has both, and asks Google's CDN for the image as-is, since it reports gzipped sizes otherwise.

The image is a ~2.3GB zip whose `system.img`, deflated as one ~2.8GB stream, is read without being on disk all at once:

1. The zip's central directory, read with range requests, says where `system.img` is
2. `system.img` streams in and inflates, and its CRC-32 is checked against the zip's at the end
3. Its first few megabytes hold a GPT partition table, whose `super` partition holds [Android's dynamic partitions](https://source.android.com/docs/core/ota/dynamic_partitions), whose metadata says which ranges of `super` make up the `product` partition
4. Only those ranges are written to disk, as a ~1.75GB `product.img`

`/app/LatinIMEGooglePrebuilt/LatinIMEGooglePrebuilt.apk` is read out of `product.img` by `dump.erofs --cat` when it's EROFS, as in 4KB page size images, or by `debugfs -R cat` when it's ext4, as in 16KB ones, and the emoji zip inside that app is read in memory.

`en_us` is laid out as follows, and the script fails if any part doesn't end exactly where the next starts:

- A 16-byte header of Gboard's own
- A marisa trie of the terms, which [`packages/generator/scripts/marisa.ts`](../generator/scripts/marisa.ts) reads just enough of to list them in ID order
- For each term in ID order, how many emoji it finds, then their indexes into the emoji list
- The emoji list

Each emoji's terms are sorted, and `en_us.shortcuts` is ignored.

The snapshot, [`packages/generator/android.json`](../generator/android.json), is rewritten only when its data changed, not just the source it was read from, and the script fails without writing it if:

- Too few emoji or keywords came back, or either count fell sharply since the last snapshot
- An emoji has no keywords
- A known emoji lost a known keyword that CLDR doesn't have
- Gboard's emoji data was built before the snapshot's, such as when the newest image's API level went backwards

The daily `Refresh Data` workflow runs the same thing and opens a pull request when the data changed, installing erofs-utils with Homebrew since Ubuntu 24.04's is 1.7, and using the `debugfs` Ubuntu comes with.

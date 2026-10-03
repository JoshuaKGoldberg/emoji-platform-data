# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing WeChat Data

WeChat's desktop clients have only bare emoji glyphs, and the `NgEmojiMap.bundle/gemoji.json` in older macOS builds is a 2016 copy of [gemoji](https://github.com/wooorm/gemoji)'s list.

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

[`packages/generator/scripts/refreshWeChat.ts`](../generator/scripts/refreshWeChat.ts) scrapes <https://weixin.qq.com> for the Android builds it offers and takes the newest, since Tencent lists several at once including years-old ones kept for older devices.

The script range-requests only the ~280MB build's zip central directory and those two files, under 2MB in all, and fails if either name doesn't appear exactly once or the zip's index runs past its own end.

The two files are joined by glyph, ignoring variation selectors, keeping every emoji either one has but dropping private use area characters such as Apple's logo and search rows that only match WeChat's own stickers.

The picker's descriptions, such as `笑出眼泪的脸` for 😂, are deliberately left out, since they read as translations of the Unicode names.

The snapshot, [`packages/generator/wechat.json`](../generator/wechat.json), is rewritten only when the emoji changed, and the script fails without writing it if:

- Too few emoji came back or have keywords, or either count fell sharply since the last snapshot
- A picker category has too few emoji
- A known emoji lost a known Chinese or English term

The daily `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.

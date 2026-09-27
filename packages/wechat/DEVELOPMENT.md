# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

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

[`packages/generator/scripts/refreshWeChat.ts`](../generator/scripts/refreshWeChat.ts) scrapes <https://weixin.qq.com> for the Android builds it offers and takes the newest, since Tencent lists several at once including years-old ones kept for older devices.

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

The result is committed as a snapshot, [`packages/generator/wechat.json`](../generator/wechat.json), the same way Discord and macOS are, so that building the packages never depends on a network fetch.
Tencent ships a new build every few weeks and the file name carries its version, so the script rewrites the snapshot only when the emoji themselves changed, and validates what it read before writing anything: how many emoji came back, how many of them have keywords, that every picker category is well represented, that a few known emoji still carry a known term in _both_ scripts, and that neither count has fallen sharply since the last snapshot.
The categories and the keywords come from different files, so those bilingual canaries are what catch the two coming apart as well as either going missing.

A `Refresh WeChat Data` workflow runs the same thing monthly and opens a pull request when the data changed.

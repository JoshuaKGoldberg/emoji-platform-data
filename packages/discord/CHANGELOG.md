# @emoji-platform-data/discord

## 0.3.0

### Minor Changes

- [#1060](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1060) [`ccb577c`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ccb577cd651c7651d5bc86bc3823b653bbcf7fca) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added every glyph platforms write an emoji as to `byEmoji`, with and without the U+FE0F variation selector, so that `byEmoji["⚓️"]` as macOS writes it finds the same entry as `byEmoji["⚓"]`.

- [#1059](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1059) [`804f2bb`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/804f2bbe34b2bb6ac5287558b1e2286ed2aa105a) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Renamed the `byTitle` exports that had underscores before digits: `Keycap_10` is now `Keycap10`, `Pool_8Ball` is `Pool8Ball`, `SkinTone_2` through `SkinTone_6` are `SkinTone2` through `SkinTone6`, and the emoji titled by their code points, such as `U_1F468U_200DU_1F430U_200DU_1F468`, drop their underscores too.

- [#1061](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1061) [`a5b108b`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/a5b108babee6e5e001cc7705064468a01af33126) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Typed `byTitle` by its export names rather than as `Record<string, …>`, so `byTitle.SparklingHeart` autocompletes and a misspelled title is a type error.

## 0.2.1

### Patch Changes

- [#1035](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1035) [`c373f9e`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/c373f9e2def8f0b7e7bd41d82871b9151e4201b1) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added 🤵‍♂️ and 👯, which were dropped because Emojipedia titles them the same as 🤵 and 👯‍♀️.

- [#1039](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1039) [`b54fbef`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/b54fbefd7ee77cdde2018cfddfd9317890b000de) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed 🧕 being split across two entries, one keyed by Emojipedia's non-standard 🧕‍♀️, by keying emoji by the glyph platforms know them by when Emojipedia's matches none of them.

## 0.2.0

### Minor Changes

- [#1006](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1006) [`5bb49ac`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/5bb49ac0d844101a6afad19eba5ac794318cc6a5) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `@emoji-platform-data/discord`, with the shortcodes, search keywords, categories, and picker order Discord's emoji picker uses.

### Patch Changes

- [#1017](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1017) [`52a7b69`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/52a7b69af379fe6d35197a3f1c4975720fbe6e66) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed the build failing on Slack's emoji, and merged emoji that platforms title two ways under different slugs, such as 🇨🇶, which `byEmoji` could only reach one of.

- [#1014](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1014) [`ffaedaa`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ffaedaac44d0a525681386d1301198c99eb5cf88) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed `emoji-platform-data` and `@emoji-platform-data/wechat` throwing a SyntaxError on import, by merging emoji that platforms title two ways and titling WeChat-only emoji by their code points.

# @emoji-platform-data/twemoji

## 0.5.0

### Minor Changes

- [#1076](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1076) [`5c5c494`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/5c5c49470a9086c28ba35f81248d4cbaad65c4f1) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Left out the empty keywords that emoji-mart has for 😐, 😑, #️⃣, and *️⃣ and that Twemoji has for 👨‍👩‍👧.

## 0.4.0

### Minor Changes

- [#1074](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1074) [`84aa34f`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/84aa34f1aa1dec040026ac1c786dc45563eee6ef) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Exported `byTitle`'s entries on their own from each package's `/byTitle` entry point, such as `import { SparklingHeart } from "emoji-platform-data/byTitle"`, so that bundlers such as esbuild can include only the emoji that are used.

- [#1070](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1070) [`4103297`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/410329726799bb8016ec77c7eb7365fff57a1d21) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Typed `TwemojiItem` as the one shape its data has, with `keywords` always present, every `type` Twemoji uses, such as `"flag"`, and its `multi_diversity_*` fields.
  The `TwemojiItemBase`, `TwemojiItemExcluded`, and `TwemojiItemIncluded` types are gone, since excluded items never make it into the data.

### Patch Changes

- [#1083](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1083) [`b52e073`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/b52e073381b2cff62cdef688ae500ed6f0aec188) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Corrected the `JoyPixelsItem.aliases` docs' example, which JoyPixels writes as "+1" and "thumbs_up" for 👍.

## 0.3.0

### Minor Changes

- [#1064](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1064) [`d828011`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/d82801166ad72428b039b2a2a672c4213ca28fa6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Placed ⏩, ⏪, ⏫, and ⏬ in macOS's Symbols category, which lists them with a U+FE0F variation selector that their tokens don't have.

## 0.2.0

### Minor Changes

- [#1060](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1060) [`ccb577c`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ccb577cd651c7651d5bc86bc3823b653bbcf7fca) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added every glyph platforms write an emoji as to `byEmoji`, with and without the U+FE0F variation selector, so that `byEmoji["⚓️"]` as macOS writes it finds the same entry as `byEmoji["⚓"]`.

- [#1059](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1059) [`804f2bb`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/804f2bbe34b2bb6ac5287558b1e2286ed2aa105a) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Renamed the `byTitle` exports that had underscores before digits: `Keycap_10` is now `Keycap10`, `Pool_8Ball` is `Pool8Ball`, `SkinTone_2` through `SkinTone_6` are `SkinTone2` through `SkinTone6`, and the emoji titled by their code points, such as `U_1F468U_200DU_1F430U_200DU_1F468`, drop their underscores too.

- [#1061](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1061) [`a5b108b`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/a5b108babee6e5e001cc7705064468a01af33126) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Typed `byTitle` by its export names rather than as `Record<string, …>`, so `byTitle.SparklingHeart` autocompletes and a misspelled title is a type error.

## 0.1.3

### Patch Changes

- [#1035](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1035) [`c373f9e`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/c373f9e2def8f0b7e7bd41d82871b9151e4201b1) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added 🤵‍♂️ and 👯, which were dropped because Emojipedia titles them the same as 🤵 and 👯‍♀️.

- [#1039](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1039) [`b54fbef`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/b54fbefd7ee77cdde2018cfddfd9317890b000de) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed 🧕 being split across two entries, one keyed by Emojipedia's non-standard 🧕‍♀️, by keying emoji by the glyph platforms know them by when Emojipedia's matches none of them.

- [#1038](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1038) [`bd3b884`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/bd3b8840c7a30bcfc50bdb8ef5083e78132f4753) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed Twemoji data being attached to the wrong emoji, such as 😁's to 😄, or dropped, such as ☃️'s, by matching Twemoji's code points before its descriptions.

- [#1036](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1036) [`930d1ff`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/930d1ffc3a630b8457bccf4c977127bbdb313525) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed emoji only Twemoji has, such as 🕴️‍♀️, having their code points as their `emoji` and `byEmoji` key instead of their glyph.

## 0.1.2

### Patch Changes

- [#1003](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1003) [`03ab722`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/03ab722a35516c5297ec0404a04a72e1a82745fb) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - The bundled type declarations now also describe `EmojiMartItem` and `EmojiPlatformData`'s `emojiMart` property, from the new [`@emoji-platform-data/emoji-mart`](https://www.npmjs.com/package/@emoji-platform-data/emoji-mart) package.
  This package's own data is unchanged.

## 0.1.1

### Patch Changes

- [#999](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/999) [`d63f46e`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/d63f46e78026e7d6d737bb1ac2f7ec190a3bd499) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Declared `sideEffects: false` so bundlers can tree-shake, and updated dependencies

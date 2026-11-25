# @emoji-platform-data/gnome

## 0.7.0

### Minor Changes

- [#1210](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1210) [`737a6f0`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/737a6f06c763079d0257f61d6663260abce24edf) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Made `byEmoji` a null-prototype object, so looking up `Object.prototype`'s keys such as `"constructor"` or `"toString"` finds nothing. `Object.prototype`'s methods are gone from it too, such as `byEmoji.hasOwnProperty()`, so check for an emoji with `Object.hasOwn(byEmoji, glyph)` or `glyph in byEmoji` instead.

- [#1187](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1187) [`d575dd0`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/d575dd06ce93c0b21e4674fb19068e4ff5c847e7) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Declared only the types each package's entries refer to in its `index.d.mts`, so that, for example, `@emoji-platform-data/twemoji` no longer exports `AndroidItem`.
  The `All*Data` record types are gone from every data package, including `emoji-platform-data`, since no entry refers to them.

### Patch Changes

- [#1194](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1194) [`9bf532f`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/9bf532fa2f24fd538df93558cc3c3043b26aaab6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Corrected the `DiscordItem`, `GnomeItem`, `MacOSItem`, and `TwemojiItem` docs that didn't match their data.

## 0.6.0

### Minor Changes

- [#1072](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1072) [`8c06aab`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/8c06aab1f8eb15ba824f02c4e64f0c21eba9e762) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added each glyph with only some of its U+FE0F variation selectors to `byEmoji`, so that minimally-qualified forms Unicode lists, such as 🏳️‍⚧ (U+1F3F3 U+FE0F U+200D U+26A7), find the same entry as 🏳️‍⚧️.

- [#1066](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1066) [`660f871`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/660f871658a5b900a6ba4657296170e588978ab4) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Gave 👯‍♂️, 👯‍♀️, 🤼‍♂️, and 🤼‍♀️ GNOME's names and keywords in its other locales, which write them as the templates for their skin tone variants, and removed the four entries those templates made, such as `U1F468U200DU1F430U200DU1F468` for 👨‍🐰‍👨.

## 0.5.0

### Minor Changes

- [#1074](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1074) [`84aa34f`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/84aa34f1aa1dec040026ac1c786dc45563eee6ef) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Exported `byTitle`'s entries on their own from each package's `/byTitle` entry point, such as `import { SparklingHeart } from "emoji-platform-data/byTitle"`, so that bundlers such as esbuild can include only the emoji that are used.

- [#1070](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1070) [`4103297`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/410329726799bb8016ec77c7eb7365fff57a1d21) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Typed `TwemojiItem` as the one shape its data has, with `keywords` always present, every `type` Twemoji uses, such as `"flag"`, and its `multi_diversity_*` fields.
  The `TwemojiItemBase`, `TwemojiItemExcluded`, and `TwemojiItemIncluded` types are gone, since excluded items never make it into the data.

### Patch Changes

- [#1083](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1083) [`b52e073`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/b52e073381b2cff62cdef688ae500ed6f0aec188) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Corrected the `JoyPixelsItem.aliases` docs' example, which JoyPixels writes as "+1" and "thumbs_up" for 👍.

## 0.4.0

### Minor Changes

- [#1064](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1064) [`d828011`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/d82801166ad72428b039b2a2a672c4213ca28fa6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Placed ⏩, ⏪, ⏫, and ⏬ in macOS's Symbols category, which lists them with a U+FE0F variation selector that their tokens don't have.

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

- [#1020](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1020) [`880874a`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/880874ac15e1bb096d1e1ecf045c0fbb795afbe6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `@emoji-platform-data/gnome`, with the names, search keywords, categories, and picker order of GTK's emoji chooser, in English and 24 other locales.

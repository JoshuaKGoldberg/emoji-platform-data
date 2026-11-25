# @emoji-platform-data/generator

## 0.12.0

### Minor Changes

- [#1210](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1210) [`737a6f0`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/737a6f06c763079d0257f61d6663260abce24edf) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Made `byEmoji` a null-prototype object, so looking up `Object.prototype`'s keys such as `"constructor"` or `"toString"` finds nothing. `Object.prototype`'s methods are gone from it too, such as `byEmoji.hasOwnProperty()`, so check for an emoji with `Object.hasOwn(byEmoji, glyph)` or `glyph in byEmoji` instead.

- [#1187](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1187) [`d575dd0`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/d575dd06ce93c0b21e4674fb19068e4ff5c847e7) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Declared only the types each package's entries refer to in its `index.d.mts`, so that, for example, `@emoji-platform-data/twemoji` no longer exports `AndroidItem`.
  The `All*Data` record types are gone from every data package, including `emoji-platform-data`, since no entry refers to them.

### Patch Changes

- [#1172](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1172) [`6092ee3`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/6092ee31b1189f0bf4c14bd9f8a56fb57aafcc9b) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Removed the replacement of "’s Symbol" with "’s Room" in titles that fall back to a platform's own name, which no title reached.

- [#1153](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1153) [`9680ebb`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/9680ebb499f63620766521137033da1df8639619) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Removed the lookup of emoji by their code points that ran after their glyphs and names, which scanned every Emojipedia item for each emoji yet never matched one the glyph lookup hadn't.

- [#1194](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1194) [`9bf532f`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/9bf532fa2f24fd538df93558cc3c3043b26aaab6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Corrected the `DiscordItem`, `GnomeItem`, `MacOSItem`, and `TwemojiItem` docs that didn't match their data.

- [#1157](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1157) [`25909a1`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/25909a10f30f8903d05bdece8c15aae2d9126e0f) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Resolved each Emojipedia title to its own emoji when another emoji has that title as an alternate name, such as "Snowman", which had resolved to ⛄ "Snowman Without Snow" rather than ☃️.

- [#1229](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1229) [`6327d01`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/6327d019a7fef2d1ce4326c610b6f97ddfb50fd6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Read fluemoji's metadata files one at a time, so `generateFluemoji` no longer fails with `EMFILE` where a process can't open over 1,600 files at once.

- [#1184](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1184) [`53cd708`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/53cd7089cd7bb2ea76c39e3798737b4cdd119502) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Failed generation with an error when two emoji-mart entries resolve to the same title, as with every other platform, rather than warning and keeping one of them, and removed code that never ran.

- [#1156](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1156) [`d1afcd1`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/d1afcd1819a1bb104355a2c298915bf4e4cd8ca7) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Shared the generator's snapshot reading, code point parsing, variation selector stripping, and title counting between platforms, without changing any data it generates.

- [#1164](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1164) [`3fbf86f`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/3fbf86feaa5e9ea8a0f5b6fe7022c6c2dc60e80d) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Failed generation with an error when two of one platform's emoji resolve to the same title, rather than warning and keeping only the last.

- [#1165](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1165) [`514a424`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/514a4249ecaf99c87eb9e6d0263756e9f7112cfd) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Sorted the keys of every object in each data file, not only its top-level ones, so that a change in a source's key order no longer reorders the published data.

- [#1204](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1204) [`5abd550`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/5abd550c5df477a011c6c0031c647ba811f20fb6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Corrected the `DiscordItem.unicodeVersion` and `JoyPixelsItem.unicodeVersion` docs, which called every value a Unicode version, though nearly all emoji from Emoji 11.0 on have their Emoji version.

## 0.11.0

### Minor Changes

- [#1072](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1072) [`8c06aab`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/8c06aab1f8eb15ba824f02c4e64f0c21eba9e762) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added each glyph with only some of its U+FE0F variation selectors to `byEmoji`, so that minimally-qualified forms Unicode lists, such as 🏳️‍⚧ (U+1F3F3 U+FE0F U+200D U+26A7), find the same entry as 🏳️‍⚧️.

- [#1066](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1066) [`660f871`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/660f871658a5b900a6ba4657296170e588978ab4) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Gave 👯‍♂️, 👯‍♀️, 🤼‍♂️, and 🤼‍♀️ GNOME's names and keywords in its other locales, which write them as the templates for their skin tone variants, and removed the four entries those templates made, such as `U1F468U200DU1F430U200DU1F468` for 👨‍🐰‍👨.

## 0.10.0

### Minor Changes

- [#1076](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1076) [`5c5c494`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/5c5c49470a9086c28ba35f81248d4cbaad65c4f1) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Left out the empty keywords that emoji-mart has for 😐, 😑, #️⃣, and *️⃣ and that Twemoji has for 👨‍👩‍👧.

### Patch Changes

- [#1102](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1102) [`389d661`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/389d661c53bf98d432dd38aaac7f6e31221521ee) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Read the compiled `dataTypes.d.ts` from the generator's `lib` by a path that also resolves from its `src`, so that `rebuildDirectory()` can run from the TypeScript source.

## 0.9.0

### Minor Changes

- [#1070](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1070) [`4103297`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/410329726799bb8016ec77c7eb7365fff57a1d21) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Typed `TwemojiItem` as the one shape its data has, with `keywords` always present, every `type` Twemoji uses, such as `"flag"`, and its `multi_diversity_*` fields.
  The `TwemojiItemBase`, `TwemojiItemExcluded`, and `TwemojiItemIncluded` types are gone, since excluded items never make it into the data.

### Patch Changes

- [#1083](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1083) [`b52e073`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/b52e073381b2cff62cdef688ae500ed6f0aec188) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Corrected the `JoyPixelsItem.aliases` docs' example, which JoyPixels writes as "+1" and "thumbs_up" for 👍.

## 0.8.0

### Minor Changes

- [#1093](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1093) [`a7cc332`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/a7cc33284a735a9cbfa5bc8cf5e2fd8a0f05ccc7) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Updated Slack emoji data from the web client bundle.

### Patch Changes

- [#1068](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1068) [`12dbe4c`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/12dbe4ce8f0db77fd92c5f28beb52ec775bfa4df) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Sorted emoji and data keys by code unit rather than with `localeCompare`, so that building in another locale, such as `cs_CZ`, writes the same files.

## 0.7.0

### Minor Changes

- [#1064](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1064) [`d828011`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/d82801166ad72428b039b2a2a672c4213ca28fa6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Placed ⏩, ⏪, ⏫, and ⏬ in macOS's Symbols category, which lists them with a U+FE0F variation selector that their tokens don't have.

## 0.6.0

### Minor Changes

- [#1060](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1060) [`ccb577c`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ccb577cd651c7651d5bc86bc3823b653bbcf7fca) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added every glyph platforms write an emoji as to `byEmoji`, with and without the U+FE0F variation selector, so that `byEmoji["⚓️"]` as macOS writes it finds the same entry as `byEmoji["⚓"]`.

- [#1059](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1059) [`804f2bb`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/804f2bbe34b2bb6ac5287558b1e2286ed2aa105a) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Renamed the `byTitle` exports that had underscores before digits: `Keycap_10` is now `Keycap10`, `Pool_8Ball` is `Pool8Ball`, `SkinTone_2` through `SkinTone_6` are `SkinTone2` through `SkinTone6`, and the emoji titled by their code points, such as `U_1F468U_200DU_1F430U_200DU_1F468`, drop their underscores too.

- [#1061](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1061) [`a5b108b`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/a5b108babee6e5e001cc7705064468a01af33126) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Typed `byTitle` by its export names rather than as `Record<string, …>`, so `byTitle.SparklingHeart` autocompletes and a misspelled title is a type error.

## 0.5.1

### Patch Changes

- [#1047](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1047) [`7e94562`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/7e945622fc3736c22856f5b4a5fb0e88ab7a8f9b) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Sorted the WeChat snapshot's unlisted emoji by code point, so its order doesn't depend on the ICU version it was refreshed with.

- [#1035](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1035) [`c373f9e`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/c373f9e2def8f0b7e7bd41d82871b9151e4201b1) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added 🤵‍♂️ and 👯, which were dropped because Emojipedia titles them the same as 🤵 and 👯‍♀️.

- [#1039](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1039) [`b54fbef`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/b54fbefd7ee77cdde2018cfddfd9317890b000de) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed 🧕 being split across two entries, one keyed by Emojipedia's non-standard 🧕‍♀️, by keying emoji by the glyph platforms know them by when Emojipedia's matches none of them.

- [#1038](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1038) [`bd3b884`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/bd3b8840c7a30bcfc50bdb8ef5083e78132f4753) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed Twemoji data being attached to the wrong emoji, such as 😁's to 😄, or dropped, such as ☃️'s, by matching Twemoji's code points before its descriptions.

- [#1036](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1036) [`930d1ff`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/930d1ffc3a630b8457bccf4c977127bbdb313525) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed emoji only Twemoji has, such as 🕴️‍♀️, having their code points as their `emoji` and `byEmoji` key instead of their glyph.

- [#1037](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1037) [`ba80c61`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ba80c61a3b489a414f22fabc3fbde1e60ede51b6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed titles that come from Discord, JoyPixels, and Slack shortcodes, such as `Regional_indicator_a`, keeping their underscores.

## 0.5.0

### Minor Changes

- [#1021](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1021) [`dbabe9d`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/dbabe9d6d2c381f00ae1ce34ac8342abb822d41b) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `generateAndroid`, the `AndroidItem` type, and `android` on `EmojiPlatformData`.

- [#1020](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1020) [`880874a`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/880874ac15e1bb096d1e1ecf045c0fbb795afbe6) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `generateGnome`, the `GnomeItem` type, and `gnome` on `EmojiPlatformData`.

- [#1019](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1019) [`ee04dc5`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ee04dc547bda6555f0e7751ab0c1bcf82d63faf8) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `generateWindows`, the `WindowsItem` type, and `windows` on `EmojiPlatformData`.

## 0.4.0

### Minor Changes

- [#1006](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1006) [`5bb49ac`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/5bb49ac0d844101a6afad19eba5ac794318cc6a5) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `generateDiscord`, the `DiscordItem` type, and `discord` on `EmojiPlatformData`.

- [#1018](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1018) [`90e6925`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/90e692568ac90a8cca92468d7ab8b4823922dcb4) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `generateJoyPixels`, the `JoyPixelsItem` type, and `joypixels` on `EmojiPlatformData`.

- [#1012](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1012) [`e766927`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/e766927b12c76a8d404434d4c13d9f9e74c053fe) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `generateSlack`, the `SlackItem` type, and `slack` on `EmojiPlatformData`.

- [#1008](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1008) [`c95460f`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/c95460f91ec0b9e1020523f27eb3fe55140f618b) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `generateWeChat`, the `WeChatItem` type, and `wechat` on `EmojiPlatformData`.

### Patch Changes

- [#1017](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1017) [`52a7b69`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/52a7b69af379fe6d35197a3f1c4975720fbe6e66) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed the build failing on Slack's emoji, and merged emoji that platforms title two ways under different slugs, such as 🇨🇶, which `byEmoji` could only reach one of.

- [#1014](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1014) [`ffaedaa`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ffaedaac44d0a525681386d1301198c99eb5cf88) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed `emoji-platform-data` and `@emoji-platform-data/wechat` throwing a SyntaxError on import, by merging emoji that platforms title two ways and titling WeChat-only emoji by their code points.

## 0.3.0

### Minor Changes

- [#1003](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1003) [`03ab722`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/03ab722a35516c5297ec0404a04a72e1a82745fb) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added emoji-mart data, as a new `@emoji-platform-data/emoji-mart` package and an `emojiMart` property on `EmojiPlatformData`.

  Each `EmojiMartItem` holds the keywords [emoji-mart](https://github.com/missive/emoji-mart)'s picker searches, along with the emoji's shortcode, name, skin tone variants, picker category, and picker order.
  Around 1390 emoji gain roughly 3200 keywords no other source had, counting only keywords that aren't plurals or other variants of one the emoji already had.
  The gains are largest for abstract emoji: 📝 is also `exam`, `quiz`, and `study`, and ⚰️ is also `vampire`, `rip`, and `graveyard`.

  emoji-mart last published in April 2024, so its data stops at Unicode 15.
  It adds keywords rather than emoji: every emoji it knows was already known to another source, and it doesn't cover the 45 newest.

## 0.2.0

### Minor Changes

- [#1001](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1001) [`8ec2228`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/8ec22285b75b68f0452a1bf3550c1a7e2ec01805) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added macOS emoji data, as a new `@emoji-platform-data/macos` package and a `macos` property on `EmojiPlatformData`.

  Each `MacOSItem` holds the keywords macOS's emoji picker searches, along with the emoji's Apple name, VoiceOver and speech names, picker category, and picker order.
  This also adds 20 emoji that none of the other sources know yet, such as 🫩, 🫆, 🪉, and 🫜.

## 0.1.1

### Patch Changes

- [#999](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/999) [`d63f46e`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/d63f46e78026e7d6d737bb1ac2f7ec190a3bd499) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Declared `sideEffects: false` so bundlers can tree-shake, and updated dependencies

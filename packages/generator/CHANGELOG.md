# @emoji-platform-data/generator

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

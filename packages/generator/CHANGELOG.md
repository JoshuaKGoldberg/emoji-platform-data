# @emoji-platform-data/generator

## 0.4.0

### Minor Changes

- [#1006](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1006) [`5bb49ac`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/5bb49ac0d844101a6afad19eba5ac794318cc6a5) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `generateDiscord`, the `DiscordItem` type, and `discord` on `EmojiPlatformData`.

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

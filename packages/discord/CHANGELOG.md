# @emoji-platform-data/discord

## 0.2.0

### Minor Changes

- [#1006](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1006) [`5bb49ac`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/5bb49ac0d844101a6afad19eba5ac794318cc6a5) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `@emoji-platform-data/discord`, with the shortcodes, search keywords, categories, and picker order Discord's emoji picker uses.

### Patch Changes

- [#1017](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1017) [`52a7b69`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/52a7b69af379fe6d35197a3f1c4975720fbe6e66) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed the build failing on Slack's emoji, and merged emoji that platforms title two ways under different slugs, such as 🇨🇶, which `byEmoji` could only reach one of.

- [#1014](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1014) [`ffaedaa`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ffaedaac44d0a525681386d1301198c99eb5cf88) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed `emoji-platform-data` and `@emoji-platform-data/wechat` throwing a SyntaxError on import, by merging emoji that platforms title two ways and titling WeChat-only emoji by their code points.

# @emoji-platform-data/wechat

## 0.2.0

### Minor Changes

- [#1008](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1008) [`c95460f`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/c95460f91ec0b9e1020523f27eb3fe55140f618b) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added `@emoji-platform-data/wechat`, with the search keywords, categories, and picker order WeChat's emoji picker uses.

### Patch Changes

- [#1018](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1018) [`90e6925`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/90e692568ac90a8cca92468d7ab8b4823922dcb4) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Titled 🦰, 🦱, and 🦲 by their names, `Red Hair`, `Curly Hair`, and `Bald`, rather than by their code points, now that JoyPixels names them: `byTitle.U_1F9B2` is now `byTitle.Bald`.

- [#1017](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1017) [`52a7b69`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/52a7b69af379fe6d35197a3f1c4975720fbe6e66) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed the build failing on Slack's emoji, and merged emoji that platforms title two ways under different slugs, such as 🇨🇶, which `byEmoji` could only reach one of.

- [#1014](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1014) [`ffaedaa`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ffaedaac44d0a525681386d1301198c99eb5cf88) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Fixed `emoji-platform-data` and `@emoji-platform-data/wechat` throwing a SyntaxError on import, by merging emoji that platforms title two ways and titling WeChat-only emoji by their code points.

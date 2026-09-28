# @emoji-platform-data/twemoji

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

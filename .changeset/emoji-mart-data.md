---
"@emoji-platform-data/emoji-mart": minor
"@emoji-platform-data/emojipedia": patch
"@emoji-platform-data/fluemoji": patch
"@emoji-platform-data/gemoji": patch
"@emoji-platform-data/generator": minor
"@emoji-platform-data/macos": patch
"@emoji-platform-data/twemoji": patch
"emoji-platform-data": minor
---

Added emoji-mart data, as a new `@emoji-platform-data/emoji-mart` package and an `emojiMart` property on `EmojiPlatformData`.

Each `EmojiMartItem` holds the keywords [emoji-mart](https://github.com/missive/emoji-mart)'s picker searches, along with the emoji's shortcode, name, skin tone variants, picker category, and picker order.
Around 1390 emoji gain roughly 3200 keywords that no other source had, not counting plurals and other variants of keywords they already had, most noticeably for abstract emoji: 📝 is also `exam`, `quiz`, and `study`, and ⚰️ is also `vampire`, `rip`, and `graveyard`.
emoji-mart last published in April 2024, so its data stops at Unicode 15: it adds keywords rather than emoji, and doesn't cover the 45 newest emoji.

The other data packages get a patch bump because each one inlines the shared type declarations, which now describe `EmojiMartItem` and `EmojiPlatformData`'s `emojiMart`.

---
"@emoji-platform-data/emoji-mart": minor
"@emoji-platform-data/generator": minor
"emoji-platform-data": minor
---

Added emoji-mart data, as a new `@emoji-platform-data/emoji-mart` package and an `emojiMart` property on `EmojiPlatformData`.

Each `EmojiMartItem` holds the keywords [emoji-mart](https://github.com/missive/emoji-mart)'s picker searches, along with the emoji's shortcode, name, skin tone variants, picker category, and picker order.
1456 emoji gain at least one keyword no other source had, 3556 in total, most noticeably for abstract emoji: 📝 is also `exam`, `quiz`, and `study`, and ⚰️ is also `vampire`, `rip`, and `graveyard`.
emoji-mart last published in April 2024, so its data stops at Unicode 15: it adds keywords rather than emoji, and doesn't cover the 45 newest emoji.

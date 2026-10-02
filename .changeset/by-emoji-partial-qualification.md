---
"@emoji-platform-data/android": minor
"@emoji-platform-data/discord": minor
"@emoji-platform-data/emoji-mart": minor
"@emoji-platform-data/emojipedia": minor
"@emoji-platform-data/fluemoji": minor
"@emoji-platform-data/gemoji": minor
"@emoji-platform-data/generator": minor
"@emoji-platform-data/gnome": minor
"@emoji-platform-data/joypixels": minor
"@emoji-platform-data/macos": minor
"@emoji-platform-data/slack": minor
"@emoji-platform-data/twemoji": minor
"@emoji-platform-data/wechat": minor
"@emoji-platform-data/windows": minor
"emoji-platform-data": minor
---

Added each glyph with only some of its U+FE0F variation selectors to `byEmoji`, so that minimally-qualified forms Unicode lists, such as 🏳️‍⚧ (U+1F3F3 U+FE0F U+200D U+26A7), find the same entry as 🏳️‍⚧️.

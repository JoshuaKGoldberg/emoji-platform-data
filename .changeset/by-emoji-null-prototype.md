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

Made `byEmoji` a null-prototype object, so looking up `Object.prototype`'s keys such as `"constructor"` or `"toString"` finds nothing. `Object.prototype`'s methods are gone from it too, such as `byEmoji.hasOwnProperty()`, so check for an emoji with `Object.hasOwn(byEmoji, glyph)` or `glyph in byEmoji` instead.

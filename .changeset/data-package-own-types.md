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

Declared only the types each package's entries refer to in its `index.d.mts`, so that, for example, `@emoji-platform-data/twemoji` no longer exports `AndroidItem`.
The `All*Data` record types are gone from every data package, including `emoji-platform-data`, since no entry refers to them.

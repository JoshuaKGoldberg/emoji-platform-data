---
"@emoji-platform-data/android": patch
"@emoji-platform-data/discord": patch
"@emoji-platform-data/emoji-mart": patch
"@emoji-platform-data/emojipedia": patch
"@emoji-platform-data/fluemoji": patch
"@emoji-platform-data/gemoji": patch
"@emoji-platform-data/generator": patch
"@emoji-platform-data/gnome": patch
"@emoji-platform-data/joypixels": patch
"@emoji-platform-data/macos": patch
"@emoji-platform-data/slack": patch
"@emoji-platform-data/twemoji": patch
"@emoji-platform-data/wechat": patch
"@emoji-platform-data/windows": patch
"emoji-platform-data": patch
---

Declared only the types each package's entries refer to in its `index.d.mts`, so that, for example, `@emoji-platform-data/twemoji` no longer exports `AndroidItem` or any of the `All*Data` record types.

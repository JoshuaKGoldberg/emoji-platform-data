---
"@emoji-platform-data/android": minor
"@emoji-platform-data/discord": minor
"@emoji-platform-data/emoji-mart": minor
"@emoji-platform-data/emojipedia": minor
"@emoji-platform-data/fluemoji": minor
"@emoji-platform-data/gemoji": minor
"@emoji-platform-data/gnome": minor
"@emoji-platform-data/joypixels": minor
"@emoji-platform-data/macos": minor
"@emoji-platform-data/slack": minor
"@emoji-platform-data/twemoji": minor
"@emoji-platform-data/wechat": minor
"@emoji-platform-data/windows": minor
"emoji-platform-data": minor
---

Exported `byTitle`'s entries on their own from each package's `/byTitle` entry point, such as `import { SparklingHeart } from "emoji-platform-data/byTitle"`, so that bundlers such as esbuild can include only the emoji that are used.

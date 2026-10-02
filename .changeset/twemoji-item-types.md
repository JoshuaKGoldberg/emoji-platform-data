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

Typed `TwemojiItem` as the one shape its data has, with `keywords` always present, every `type` Twemoji uses, such as `"flag"`, and its `multi_diversity_*` fields.
The `TwemojiItemBase`, `TwemojiItemExcluded`, and `TwemojiItemIncluded` types are gone, since excluded items never make it into the data.

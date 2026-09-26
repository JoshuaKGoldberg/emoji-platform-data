---
"@emoji-platform-data/discord": patch
"@emoji-platform-data/generator": patch
"@emoji-platform-data/wechat": patch
"emoji-platform-data": patch
---

Fixed `emoji-platform-data` and `@emoji-platform-data/wechat` throwing a SyntaxError on import, by merging emoji that platforms title two ways and titling WeChat-only emoji by their code points.

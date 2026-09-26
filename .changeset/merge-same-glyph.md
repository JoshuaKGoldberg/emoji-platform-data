---
"@emoji-platform-data/discord": patch
"@emoji-platform-data/generator": patch
"@emoji-platform-data/slack": patch
"@emoji-platform-data/wechat": patch
"emoji-platform-data": patch
---

Fixed the build failing on Slack's emoji, and merged emoji that platforms title two ways under different slugs, such as 🇨🇶, which `byEmoji` could only reach one of.

---
"@emoji-platform-data/generator": minor
"@emoji-platform-data/wechat": minor
"emoji-platform-data": minor
---

Added WeChat data, as a new `@emoji-platform-data/wechat` package and a `wechat` property on `EmojiPlatformData`.

Each `WeChatItem` holds the name, shortcodes, and tags [WeChat](https://www.wechat.com)'s emoji search knows an emoji by.
845 of the 1,913 emoji in `emoji-platform-data` are in it, so it says which emoji WeChat's search recognizes.

WeChat ships a copy of GitHub's emoji list from around 2016, so its names are that era's Unicode names: 👍 is a `thumbs up sign`, and ❤️ a `heavy black heart`.
It adds no emoji of its own, and almost no terms another source doesn't already know.

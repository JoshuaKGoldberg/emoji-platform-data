<h1 align="center">Emoji Platform Data</h1>

<p align="center">
	Static export of platform-specific metadata for unicode emojis.
	🗝️
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/emoji-platform-data" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/emoji-platform-data?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i emoji-platform-data
```

```ts
import { byEmoji, byTitle } from "emoji-platform-data";

console.log(byEmoji["💖"]);
console.log(byTitle.SparklingHeart);
/*
{
	emoji: "💖",
	emojipedia: { "currentCldrName": "Sparkling Heart", ... },
	fluemoji: { "cldr": "sparkling heart", ... },
	gemoji: { "description": "sparkling heart", ... },
	twemoji: { "description": "Sparkling heart", ... },
	...
}
*/
```

Emojis can be looked up by their glyph with `byEmoji` or by the PascalCase form of their Emojipedia title with `byTitle`.
Each entry is an `EmojiPlatformData` combining data from:

- [Discord](https://discord.com) (`discord`)
- [emoji-mart](https://github.com/missive/emoji-mart) (`emojiMart`)
- [Emojipedia](https://github.com/JoshuaKGoldberg/emojipedia) (`emojipedia`)
- [Fluent UI / Windows](https://github.com/microsoft/fluentui-emoji) (`fluemoji`)
- [Gemoji](https://github.com/wooorm/gemoji) (`gemoji`)
- [macOS](https://support.apple.com/guide/mac-help/use-emoji-and-symbols-on-mac-mchlp1560/mac) (`macos`)
- [Twemoji](https://raw.githubusercontent.com/twitter/twemoji-parser) (`twemoji`)
- [WeChat](https://weixin.qq.com) (`wechat`)

Each of those sources is also available as its own `@emoji-platform-data/*` package.
See the [repository README](https://github.com/JoshuaKGoldberg/emoji-platform-data#packages) for the full list.

This package contains only static JSON and type declarations: it has no runtime dependencies.

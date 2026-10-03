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
	android: { "keywords": ["bday", "birthday", "bling", ...] },
	discord: { "name": "sparkling_heart", ... },
	emoji: "💖",
	emojiMart: { "id": "sparkling_heart", ... },
	emojipedia: { "currentCldrName": "Sparkling Heart", ... },
	fluemoji: { "cldr": "sparkling heart", ... },
	gemoji: { "description": "sparkling heart", ... },
	gnome: { "name": "sparkling heart", ... },
	joypixels: { "name": "sparkling_heart", ... },
	macos: { "appleName": "heart with stars", ... },
	slack: { "name": "sparkling_heart", ... },
	twemoji: { "description": "Sparkling heart", ... },
	wechat: { "keywords": ["twinkle", "twinkling", "闪亮的心", ...], ... },
	windows: { "name": "sparkling heart", ... },
	...
}
*/
```

Emojis can be looked up by their glyph with `byEmoji` or by the PascalCase form of their Emojipedia title with `byTitle`.
`byEmoji` knows each emoji by every glyph platforms write it as, with or without the U+FE0F variation selector, so `byEmoji["⚓️"]` as macOS writes it and `byEmoji["⚓"]` as Twemoji does are the same entry.
`byTitle`'s entries can also be imported on their own from `emoji-platform-data/byTitle`, such as `import { SparklingHeart } from "emoji-platform-data/byTitle"`, for bundlers such as esbuild that would otherwise include every emoji.
Each entry is an `EmojiPlatformData` combining data from:

- [Android (Gboard)](https://play.google.com/store/apps/details?id=com.google.android.inputmethod.latin) (`android`)
- [Discord](https://discord.com) (`discord`)
- [emoji-mart](https://github.com/missive/emoji-mart) (`emojiMart`)
- [Emojipedia](https://github.com/JoshuaKGoldberg/emojipedia) (`emojipedia`)
- [Fluent UI / Windows](https://github.com/microsoft/fluentui-emoji) (`fluemoji`)
- [Gemoji](https://github.com/wooorm/gemoji) (`gemoji`)
- [GNOME](https://gitlab.gnome.org/GNOME/gtk/-/tree/main/gtk/emoji) (`gnome`)
- [JoyPixels / Zoom](https://github.com/joypixels/emoji-toolkit) (`joypixels`)
- [macOS](https://support.apple.com/guide/mac-help/use-emoji-and-symbols-on-mac-mchlp1560/mac) (`macos`)
- [Slack](https://slack.com) (`slack`)
- [Twemoji](https://github.com/twitter/twemoji-parser) (`twemoji`)
- [WeChat](https://weixin.qq.com) (`wechat`)
- [Windows](https://support.microsoft.com/windows/windows-keyboard-tips-and-tricks-588e0b72-0fff-6d3f-aeee-6e5116097942) (`windows`)

Each of those sources is also available as its own `@emoji-platform-data/*` package.
See the [repository README](https://github.com/JoshuaKGoldberg/emoji-platform-data#packages) for the full list.

This package contains only static JSON and type declarations: it has no runtime dependencies.

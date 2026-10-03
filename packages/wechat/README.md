<h1 align="center">@emoji-platform-data/wechat</h1>

<p align="center">
	Static export of WeChat emoji picker metadata for unicode emojis.
	💚
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/wechat" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/wechat?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/wechat
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/wechat";

console.log(byEmoji["🐙"]);
/*
{
	category: "动物",
	emoji: "🐙",
	keywords: ["章鱼", "ocean", "octopus", "tentacle", "章魚", "八爪魚"],
	order: 203,
}
*/
```

- `byEmoji` takes a glyph as any platform writes it, with or without its U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is a `WeChatItem` describing one emoji as WeChat's own emoji picker knows it:

- `keywords` are the terms the picker searches, mixing Simplified Chinese, Traditional Chinese, and English, such as `庆祝`, `慶祝`, and `party` for 🎉: nearly every emoji has them.
- `category` is the picker's group, named as WeChat names it, such as `动物`.
- `order` is the emoji's position in the picker, across all categories.
- Emoji WeChat's search finds but its picker doesn't list have no `category` or `order`.

This package is only static JSON and types, with no runtime dependencies, and its data is also in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

## Where This Data Comes From

This is a snapshot of the picker's category listing and search index from WeChat's Android app, and [`DEVELOPMENT.md`](https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/packages/wechat/DEVELOPMENT.md) explains how to refresh it.

The picker's descriptions, such as `笑出眼泪的脸` for 😂, are left out since they read as translations of the emoji's Unicode name rather than search terms.

WeChat's own stickers, the `[捂脸]` artwork its picker shows alongside these, aren't here either: they're images rather than unicode emoji, so there's no glyph to key them by.

The keywords, categories, and ordering are WeChat's: this package's MIT license only covers the code that packages them, and this package includes no WeChat emoji artwork.

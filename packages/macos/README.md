<h1 align="center">@emoji-platform-data/macos</h1>

<p align="center">
	Static export of macOS emoji picker metadata for unicode emojis.
	🍎
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/macos" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/macos?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/macos
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/macos";

console.log(byEmoji["🐙"]);
/*
{
	appleName: "octopus",
	category: "Nature",
	emoji: "🐙",
	isCommon: true,
	keywords: ["octopus", "tentacle", "octopi", "octopuses", "tentacles", ...],
	order: 540,
	speechName: "an octopus emoji",
	unicodeName: "OCTOPUS",
	voiceOverName: "an octopus",
}
*/
```

- `byEmoji` takes a glyph as any platform writes it, with or without its U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is a `MacOSItem` describing one emoji as macOS's own emoji picker knows it:

- `keywords` are the terms the picker searches, ordered by how strongly macOS weights each one for the emoji.
- `order` is the emoji's position in the picker, across all categories.

This package is only static JSON and types, with no runtime dependencies, and its data is also in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

## Where This Data Comes From

This is a snapshot of the emoji search index in macOS's private `CoreEmoji.framework`, and [`DEVELOPMENT.md`](https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/packages/macos/DEVELOPMENT.md) explains how to refresh it.

The keywords, names, and categories are Apple's: this package's MIT license only covers the code that packages them, and this package includes no Apple emoji artwork.

<h1 align="center">@emoji-platform-data/emoji-mart</h1>

<p align="center">
	Static export of emoji-mart metadata for unicode emojis.
	🏪
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/emoji-mart" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/emoji-mart?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/emoji-mart
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/emoji-mart";

console.log(byEmoji["🐙"]);
/*
{
	category: "nature",
	id: "octopus",
	keywords: ["animal", "creature", "ocean", "sea", "nature", "beach"],
	name: "Octopus",
	order: 633,
	skins: [{ native: "🐙", unified: "1f419" }],
	version: 1,
}
*/
```

- `byEmoji` takes a glyph, with or without U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is an `EmojiMartItem` containing the data from [emoji-mart](https://github.com/missive/emoji-mart):

- `keywords` are the terms emoji-mart's picker searches.
- `category` is one of the picker's eight categories, and `order` is the emoji's position in the picker, across all categories.
- `skins` is the emoji followed by its skin tone variants, such as 👋 then 👋🏻 through 👋🏿.
- `aliases` and `emoticons` are only on the few emoji that have them, such as `thumbsup` for 👍 and `:)` for 😃.

This package is static JSON and types with no runtime dependencies, also included in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

## Where This Data Comes From

This data is the Unicode 15 _native_ set from [`@emoji-mart/data`](https://www.npmjs.com/package/@emoji-mart/data), the data package behind [emoji-mart](https://github.com/missive/emoji-mart), the emoji picker Bluesky's web app uses.

It lacks some emoji, including all added after Unicode 15: `@emoji-mart/data` last published in April 2024.

The names and keywords are emoji-mart's, under [Missive's MIT license](https://github.com/missive/emoji-mart/blob/main/LICENSE), and this package includes no emoji artwork.

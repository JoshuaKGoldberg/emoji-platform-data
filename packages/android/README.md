<h1 align="center">@emoji-platform-data/android</h1>

<p align="center">
	Static export of Android (Gboard) emoji search metadata for unicode emojis.
	🤖
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/android" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/android?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/android
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/android";

console.log(byEmoji["🐙"]);
/*
{
	emoji: "🐙",
	keywords: ["animal", "creature", "kraken", "octopus", "sea", "squid", "tentacle"],
}
*/
```

- `byEmoji` takes a glyph, with or without U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is an `AndroidItem` describing one emoji as Gboard -the keyboard Google ships with Android- knows it.

`keywords` are the sorted English terms Gboard's emoji search finds the emoji by, such as `lulz` and `rotfl` for 😂.

This package is static JSON and types with no runtime dependencies, also included in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

## Where This Data Comes From

This is a snapshot of the English emoji search dictionary Gboard ships with, read out of the newest stable Android system image, and [`DEVELOPMENT.md`](https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/packages/android/DEVELOPMENT.md) explains how to refresh it.

It has none of the newer or other-language data Gboard can download once installed, and no names, categories, or picker order.

The keywords are Google's: this package's MIT license only covers the code that packages them, and it includes no emoji artwork.

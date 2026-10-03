<h1 align="center">@emoji-platform-data/windows</h1>

<p align="center">
	Static export of Windows emoji panel metadata for unicode emojis.
	⌨️
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/windows" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/windows?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/windows
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/windows";

console.log(byEmoji["😂"]);
/*
{
	emoji: "😂",
	keywords: ["crying", "face", "feels", "funny", "haha", "happy", "hehe", "hilarious", "joy", "laugh", "lmao", "lol", "rofl", ...],
	name: "face with tears of joy",
}
*/
```

- `byEmoji` takes a glyph, with or without U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is a `WindowsItem` describing one emoji as the Windows emoji panel -the one <kbd>Win</kbd> + <kbd>.</kbd> opens- knows it:

- `name` is the emoji's Unicode CLDR name, such as `octopus` for 🐙.
- `keywords` are the other terms the panel searches, from CLDR's annotations to slang and emoticons, such as `ttyl` for 👋 and `:-o` for 😲.

This package is static JSON and types with no runtime dependencies, also included in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

## Where This Data Comes From

This is a snapshot of the emoji panel's own en-US data from the newest retail Windows 11 release, with far more keywords than the Fluent UI metadata in [`@emoji-platform-data/fluemoji`](https://npmjs.com/package/@emoji-platform-data/fluemoji), and [`DEVELOPMENT.md`](https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/packages/windows/DEVELOPMENT.md) explains how to refresh it.

Skin tone combinations of emoji showing more than one person, such as 🫱🏻‍🫲🏼, are left out since they only add skin tone names to their base emoji's keywords.

The panel's categories and order aren't here, since they're part of the panel itself rather than this data.

The names and keywords are Microsoft's: this package's MIT license only covers the code that packages them, and it includes no Windows emoji artwork.

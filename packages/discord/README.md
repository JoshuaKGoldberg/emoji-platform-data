<h1 align="center">@emoji-platform-data/discord</h1>

<p align="center">
	Static export of Discord emoji picker metadata for unicode emojis.
	💬
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/discord" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/discord?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/discord
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/discord";

console.log(byEmoji["👍"]);
/*
{
	aliases: ["+1", "thumbup", "thumbs_up"],
	category: "people",
	emoji: "👍",
	keywords: ["+1", "good", "hand", "like", "thumb", "up", "yes"],
	name: "thumbsup",
	order: 134,
	unicodeVersion: 6,
}
*/
```

- `byEmoji` takes a glyph as any platform writes it, with or without its U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is a `DiscordItem` describing one emoji as Discord's own emoji picker knows it:

- `name` is the shortcode Discord writes the emoji as, and `aliases` are the others it accepts.
- `keywords` are the picker's other search terms, such as `celebrate` for 🎉 (`tada`): country flags, keycaps, regional indicators, and some sequences, such as most families, have none.
- `order` is the emoji's position in the picker, across all categories.

This package is only static JSON and types, with no runtime dependencies, and its data is also in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

## Where This Data Comes From

This is a snapshot of the emoji data in Discord's web client JavaScript bundle, with its `en-US` keywords, and [`DEVELOPMENT.md`](https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/packages/discord/DEVELOPMENT.md) explains how to refresh it.

Skin tone variants, such as `wave_tone3`, are left out since they have no terms of their own.

The shortcodes, keywords, categories, and ordering are Discord's: this package's MIT license only covers the code that packages them, and this package includes no Discord emoji artwork.

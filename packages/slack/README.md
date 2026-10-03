<h1 align="center">@emoji-platform-data/slack</h1>

<p align="center">
	Static export of Slack emoji picker metadata for unicode emojis.
	🧵
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/slack" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/slack?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/slack
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/slack";

console.log(byEmoji["🐙"]);
/*
{
	aliases: [],
	category: "Animals & Nature",
	emoji: "🐙",
	keywords: ["animal", "creature", "ocean", "fish"],
	keywordsByLocale: {
		"de-DE": ["Tier", "kreatur", "ozean", "Fisch"],
		"ja-JP": ["動物", "生き物", "海", "魚"],
		...
	},
	name: "octopus",
	namesByLocale: {
		"de-DE": "oktopus",
		"ja-JP": "タコ",
		...
	},
	order: 613,
}
*/
```

- `byEmoji` takes a glyph, with or without U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is a `SlackItem` describing one emoji as Slack's own emoji picker knows it:

- `name` is the shortcode Slack writes the emoji as, and `aliases` are the others it accepts.
- `keywords` are the picker's other English search terms, such as `celebrate` for 🎉 (`tada`): a few, mostly newer people variants and less common flags, have none.
- `order` is the emoji's position in the picker, across all categories.
- Emoji the picker doesn't list, mostly the gender-neutral forms of older people emoji such as 👮 `cop`, have no `category` or `order`.

### Other Locales

Besides English, Slack translates its emoji picker into `de-DE`, `en-GB`, `es-ES`, `es-LA`, `fr-FR`, `it-IT`, `ja-JP`, `ko-KR`, `pt-BR`, `zh-CN`, and `zh-TW`.

- `keywordsByLocale` and `namesByLocale` are the picker's search terms and names in each of those.
- Slack translates each English keyword once for every emoji, so a locale's keywords line up with the English ones, but can suit some emoji better than others.
- Terms a locale has no translation for stay in English, so `en-GB` is nearly all English.

This package is static JSON and types with no runtime dependencies, also included in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

## Where This Data Comes From

This is a snapshot of the emoji data in Slack's web client JavaScript bundle and its per-locale string files, and [`DEVELOPMENT.md`](https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/packages/slack/DEVELOPMENT.md) explains how to refresh it.

Skin tone variants, such as `wave::skin-tone-3`, are left out since they have no terms of their own.

The shortcodes, keywords, translations, categories, and ordering are Slack's: this package's MIT license only covers the code that packages them, and it includes no Slack emoji artwork.

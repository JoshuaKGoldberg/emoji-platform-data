<h1 align="center">@emoji-platform-data/gnome</h1>

<p align="center">
	Static export of GNOME emoji picker metadata for unicode emojis.
	👣
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/gnome" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/gnome?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/gnome
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/gnome";

console.log(byEmoji["🐙"]);
/*
{
	category: "Animals & Nature",
	emoji: "🐙",
	keywords: ["animal", "creature", "ocean"],
	keywordsByLocale: {
		de: ["krake", "meer", "oktopus", "tier", "tintenfisch"],
		ja: ["オクトパス", "動物", "軟体動物"],
		...
	},
	name: "octopus",
	namesByLocale: { de: "Oktopus", ja: "タコ", ... },
	order: 660,
}
*/
```

- `byEmoji` takes a glyph, with or without U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is a `GnomeItem` describing one emoji as GNOME's emoji picker -GTK's emoji chooser, the one <kbd>Ctrl</kbd> + <kbd>.</kbd> opens in any GTK text field- knows it:

- `name` and `keywords` are what the picker shows and searches in English: the [Unicode CLDR](https://cldr.unicode.org) annotations, by way of [Emojibase](https://emojibase.dev).
- `namesByLocale` and `keywordsByLocale` are the same for GTK's other locales, keyed by locale, such as `de` or `ja`.
- `category` is the picker's section, named as its heading names it, such as `Smileys & People`.
- `order` is the emoji's position in the English picker, across all sections.
- The hair components, such as 🦰, have no `category` or `order`, since the picker doesn't show them.
- The 8 emoji new in Emoji 17.0, such as 🫪, have no `order`, since GTK's English picker doesn't show them yet.

This package is static JSON and types with no runtime dependencies, also included in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

## Where This Data Comes From

This is a snapshot of GTK's per-locale emoji files in [`gtk/emoji`](https://gitlab.gnome.org/GNOME/gtk/-/tree/main/gtk/emoji) from the newest stable GTK 4 release, and [`DEVELOPMENT.md`](https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/packages/gnome/DEVELOPMENT.md) explains how to refresh it.

Skin tone variants aren't here, and some emoji are as GTK's picker inserts them rather than fully qualified, such as 🕵‍♂️.

The names and keywords are the Unicode CLDR's, under the [Unicode License](https://www.unicode.org/license.txt), and this package includes no emoji artwork.

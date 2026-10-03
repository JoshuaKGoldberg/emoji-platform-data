<h1 align="center">@emoji-platform-data/joypixels</h1>

<p align="center">
	Static export of JoyPixels (and Zoom) emoji metadata for unicode emojis.
	😊
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/joypixels" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/joypixels?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/joypixels
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/joypixels";

console.log(byEmoji["❤️"]);
/*
{
	aliases: ["red_heart"],
	category: "symbols",
	description: "red heart",
	emoji: "❤️",
	emoticons: ["<3"],
	keywords: ["heart"],
	name: "heart",
	order: 1317,
	unicodeVersion: 1.1,
}
*/
```

- `byEmoji` takes a glyph, with or without U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is a `JoyPixelsItem` describing one emoji as JoyPixels' [emoji-toolkit](https://github.com/joypixels/emoji-toolkit) knows it:

- `name` is the shortcode JoyPixels writes the emoji as, and `aliases` are the others it accepts, such as `tt` for 🇹🇹 `flag_tt`.
- `keywords` are the other terms a picker matches searches against, close to the Unicode CLDR annotations.
- `emoticons` are only on the few emoji that have them, such as `<3` for ❤️.
- `order` is the emoji's position in JoyPixels' picker, across all categories.
- Emoji the picker doesn't show, mostly the older families such as 👨‍👩‍👦 and the hair components such as 🦰, have no `category` or `order`.

### Zoom

Zoom's Team Chat emoji picker uses this same shortcode and keyword data, with its own categories and order that aren't in this package.

This package is static JSON and types with no runtime dependencies, also included in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

## Where This Data Comes From

This data is `emoji.json` from [`emoji-toolkit`](https://www.npmjs.com/package/emoji-toolkit), the data package behind JoyPixels, the emoji set formerly known as EmojiOne, with a few changes:

- The version keyword ending each keyword list, such as `uc6`, is left out, since that's `unicodeVersion`.
- Skin tone variants, such as `wave_tone3`, are left out, but their few extra keywords are folded into the base emoji, such as `prayer` for 🤲.
- The digits, `#`, and `*` it lists on their own as keycap parts are left out.

The shortcodes, keywords, categories, and ordering are JoyPixels', under [emoji-toolkit's MIT license](https://github.com/joypixels/emoji-toolkit/blob/master/LICENSE.md), and this package includes no JoyPixels emoji artwork.

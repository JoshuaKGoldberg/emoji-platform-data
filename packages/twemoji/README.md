<h1 align="center">@emoji-platform-data/twemoji</h1>

<p align="center">
	Static export of Twemoji metadata for unicode emojis.
	🐦
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/twemoji" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/twemoji?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i @emoji-platform-data/twemoji
```

```ts
import { byEmoji, byTitle } from "@emoji-platform-data/twemoji";

console.log(byEmoji["💖"]);
console.log(byTitle.SparklingHeart);
```

- `byEmoji` takes a glyph as any platform writes it, with or without its U+FE0F: `byEmoji["⚓️"]` and `byEmoji["⚓"]` are the same entry.
- `byTitle` takes a PascalCase Emojipedia title.

Each entry is a `TwemojiItem` containing the data from [Twemoji](https://github.com/twitter/twemoji-parser).

This package is only static JSON and types, with no runtime dependencies, and its data is also in the combined [`emoji-platform-data`](http://npmjs.com/package/emoji-platform-data).

<h1 align="center">@emoji-platform-data/generator</h1>

<p align="center">
	Generates platform-specific metadata for unicode emojis.
	🏭
</p>

<p align="center">
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/@emoji-platform-data/generator" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/@emoji-platform-data/generator?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

This package contains the code that generates the [`emoji-platform-data`](https://github.com/JoshuaKGoldberg/emoji-platform-data) data packages.
Most consumers want one of those data packages instead: they contain only static JSON and have no runtime dependencies.

## Usage

```shell
npm i @emoji-platform-data/generator
```

```ts
import { generateAll } from "@emoji-platform-data/generator";

const byTitle = await generateAll();

console.log(byTitle["Sparkling Heart"]);
```

### APIs

- `generateAll()`: generates the combined `EmojiPlatformData` for every emoji, keyed by Emojipedia title
- `generateEmojiMart()`, `generateEmojipedia()`, `generateFluemoji()`, `generateGemoji()`, `generateMacOS()`, `generateTwemoji()`: generate data for a single platform
- `rebuildDirectory({ directory })`: writes a directory exporting the combined data, in the shape published as `emoji-platform-data`
- `rebuildSourceDirectory({ directory, source })`: writes a directory exporting a single platform's data, in the shape published as `@emoji-platform-data/*`

> Note: `generateFluemoji` reads image metadata from [`microsoft/fluentui-emoji`](https://github.com/microsoft/fluentui-emoji), which isn't published to npm.
> Clone that repository, then point the generator at it:
>
> ```ts
> await generateAll({ fluemojiDirectory: "path/to/fluentui-emoji" });
> ```
>
> Within this repository it's installed as a `fluemoji` dev dependency, so the default works and no option is needed.

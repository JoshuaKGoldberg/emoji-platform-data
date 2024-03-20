<h1 align="center">Emoji Platform Data</h1>

<p align="center">Static export of platform-specific metadata for unicode emojis. 🗝️</p>

<p align="center">
	<!-- prettier-ignore-start -->
	<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
	<a href="#contributors" target="_blank"><img alt="👪 All Contributors: 1" src="https://img.shields.io/badge/%F0%9F%91%AA_all_contributors-1-21bb42.svg" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
	<!-- prettier-ignore-end -->
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/.github/CODE_OF_CONDUCT.md" target="_blank"><img alt="🤝 Code of Conduct: Kept" src="https://img.shields.io/badge/%F0%9F%A4%9D_code_of_conduct-kept-21bb42" /></a>
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg"></a>
	<a href="http://npmjs.com/package/emoji-platform-data"><img alt="📦 npm version" src="https://img.shields.io/npm/v/emoji-platform-data?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i emoji-platform-data
```

```ts
import { byTitle } from "emoji-platform-data";

console.log(byTitle["Sparkling Heart"]);
/*
{
	emoji: "💖",
	emojipedia: { "currentCldrName": "Sparkling Heart", ... },
	fluemoji: { "cldr": "sparkling heart", ... },
	gemoji: { "description": "sparkling heart", ... },
	twemoji: { "description": "Sparkling heart", ... },
	...
}
*/
```

`emoji-platform-data` combines emoji data from the following projects:

- [Emojipedia](https://github.com/JoshuaKGoldberg/emojipedia)
- [Fluent UI / Windows](https://github.com/microsoft/fluentui-emoji) ("fluemoji")
- [Gemoji](https://github.com/wooorm/gemoji)
- [Twemoji](https://raw.githubusercontent.com/twitter/twemoji-parser)

Each emoji supported in at least one of those projects is stored by its emoji glyph and Emojipedia title.

## Why?

This is useful if you're looking to see the metadata supported for emojis in each of those platforms.
For example, if you wanted to [determine the keywords associated with any emoji](https://github.com/muan/emojilib/issues/194), this would let you know accumulate all the keywords across the supported platforms.

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.joshuakgoldberg.com/"><img src="https://avatars.githubusercontent.com/u/3335181?v=4?s=100" width="100px;" alt="Josh Goldberg ✨"/><br /><sub><b>Josh Goldberg ✨</b></sub></a><br /><a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/commits?author=JoshuaKGoldberg" title="Code">💻</a> <a href="#content-JoshuaKGoldberg" title="Content">🖋</a> <a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/commits?author=JoshuaKGoldberg" title="Documentation">📖</a> <a href="#ideas-JoshuaKGoldberg" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-JoshuaKGoldberg" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-JoshuaKGoldberg" title="Maintenance">🚧</a> <a href="#projectManagement-JoshuaKGoldberg" title="Project Management">📆</a> <a href="#tool-JoshuaKGoldberg" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->

<!-- You can remove this notice if you don't want it 🙂 no worries! -->

> 💙 This package was templated with [`create-typescript-app`](https://github.com/JoshuaKGoldberg/create-typescript-app).

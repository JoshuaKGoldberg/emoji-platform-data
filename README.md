<h1 align="center">Emoji Platform Data</h1>

<p align="center">
	Static export of platform-specific metadata for unicode emojis.
	🗝️
</p>

<p align="center">
	<!-- prettier-ignore-start -->
	<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
	<a href="#contributors" target="_blank"><img alt="👪 All Contributors: 5" src="https://img.shields.io/badge/%F0%9F%91%AA_all_contributors-5-21bb42.svg" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
	<!-- prettier-ignore-end -->
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/.github/CODE_OF_CONDUCT.md" target="_blank"><img alt="🤝 Code of Conduct: Kept" src="https://img.shields.io/badge/%F0%9F%A4%9D_code_of_conduct-kept-21bb42" /></a>
	<a href="https://codecov.io/gh/JoshuaKGoldberg/emoji-platform-data" target="_blank"><img alt="🧪 Coverage" src="https://img.shields.io/codecov/c/github/JoshuaKGoldberg/emoji-platform-data?label=%F0%9F%A7%AA%20coverage" /></a>
	<a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/emoji-platform-data" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/emoji-platform-data?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

```shell
npm i emoji-platform-data
```

```ts
import { byEmoji, byTitle } from "emoji-platform-data";

console.log(byEmoji["💖"]);
console.log(byTitle.SparklingHeart);
/*
{
	discord: { "name": "sparkling_heart", ... },
	emoji: "💖",
	emojiMart: { "id": "sparkling_heart", ... },
	emojipedia: { "currentCldrName": "Sparkling Heart", ... },
	fluemoji: { "cldr": "sparkling heart", ... },
	gemoji: { "description": "sparkling heart", ... },
	macos: { "appleName": "heart with stars", ... },
	slack: { "name": "sparkling_heart", ... },
	twemoji: { "description": "Sparkling heart", ... },
	wechat: { "keywords": ["twinkle", "twinkling", "闪亮的心", ...], ... },
	...
}
*/
```

Emojis can be looked up by their glyph with `byEmoji` or by the PascalCase form of their Emojipedia title with `byTitle`.

### Packages

`emoji-platform-data` combines emoji data from several projects.
Each project's data is also published as its own package, for consumers who only need one source:

| Package                                                    | Source                                                                                       | Exports                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [`emoji-platform-data`](./packages/emoji-platform-data)    | All of the below                                                                             | `byEmoji` and `byTitle` of combined `EmojiPlatformData` |
| [`@emoji-platform-data/discord`](./packages/discord)       | [Discord](https://discord.com)                                                               | `byEmoji` and `byTitle` of `DiscordItem`                |
| [`@emoji-platform-data/emoji-mart`](./packages/emoji-mart) | [emoji-mart](https://github.com/missive/emoji-mart)                                          | `byEmoji` and `byTitle` of `EmojiMartItem`              |
| [`@emoji-platform-data/emojipedia`](./packages/emojipedia) | [Emojipedia](https://github.com/JoshuaKGoldberg/emojipedia)                                  | `byEmoji` and `byTitle` of `EmojipediaItem`             |
| [`@emoji-platform-data/fluemoji`](./packages/fluemoji)     | [Fluent UI / Windows](https://github.com/microsoft/fluentui-emoji)                           | `byEmoji` and `byTitle` of `FluemojiItem`               |
| [`@emoji-platform-data/gemoji`](./packages/gemoji)         | [Gemoji](https://github.com/wooorm/gemoji)                                                   | `byEmoji` and `byTitle` of `GemojiItem`                 |
| [`@emoji-platform-data/macos`](./packages/macos)           | [macOS](https://support.apple.com/guide/mac-help/use-emoji-and-symbols-on-mac-mchlp1560/mac) | `byEmoji` and `byTitle` of `MacOSItem`                  |
| [`@emoji-platform-data/slack`](./packages/slack)           | [Slack](https://slack.com)                                                                   | `byEmoji` and `byTitle` of `SlackItem`                  |
| [`@emoji-platform-data/twemoji`](./packages/twemoji)       | [Twemoji](https://raw.githubusercontent.com/twitter/twemoji-parser)                          | `byEmoji` and `byTitle` of `TwemojiItem`                |
| [`@emoji-platform-data/wechat`](./packages/wechat)         | [WeChat](https://weixin.qq.com)                                                              | `byEmoji` and `byTitle` of `WeChatItem`                 |
| [`@emoji-platform-data/generator`](./packages/generator)   | -                                                                                            | APIs that generate the data packages above              |

The data packages have no runtime dependencies: they only contain static JSON and type declarations.
Each emoji supported in at least one of those projects is stored by its emoji glyph and Emojipedia title.

## Explainer

> 📙 This documentation uses the excellent [emojipedia.org](https://emojipedia.org) as a source of information.

### Emojis

An **emoji** is a small image represented by a glyph in text.
The [Unicode Standard](https://unicode.org/standard/standard.html) defines which characters in text map to which emojis, as well as how combinations of emoji characters combine to more emojis.
For example:

- [🔥 (`fire`)](https://emojipedia.org/fire) is represented by the string code _U+1F525_
- [❤️ (`red heart`)](https://emojipedia.org/red-heart) is represented by the string codes: _U+2764_ _U+FE0F_
- [❤️‍🔥 (`heart on fire`)](https://emojipedia.org/heart-on-fire) is represented by ❤️ + a ["zero-width joiner"](https://emojipedia.org/zero-width-joiner) + 🔥: _U+2764 U+FE0F U+200D U+1F525_

> 💡 _Emojis_ are not the same as their predecessors, _emoticons_.
> Emoticons are symbols that combine traditional text characters, such as `:)` for "smiley" and `(╯°□°)╯︵ ┻━┻` for "table flip".

### 🆔 Identity

The formal name, or 🆔 _identity_, for each emoji is standardized in Unicode.
However, emojis may be associated with multiple names across different specifications.
For example, [👿](https://emojipedia.org/angry-face-with-horns) can be referred to either as _"Angry Face with Horns"_ or _"Imp"_ depending on the source.

### 🔗 Keywords

In addition to their name(s), emojis commonly have related terms, or _🔗 keywords_, associated with them.
These keywords are not standardized and may vary drastically across the various chat applications, operating systems, and shared open source libraries that each separately implement emoji pickers.

For example, [🐙 (`octopus`)](https://emojipedia.org/octopus) is defined in [emoji-mart@5.5.2](https://github.com/missive/emoji-mart/tree/21a2708be931c0dd16d6d0e96b47a45503576ac5/) -used by Bluesky and other projects- with `["animal", "creature", "ocean", "sea", "nature", "beach"]`.

### Platforms

This project attempts to bring together the 🆔 _identity_ and _🔗 keywords_ across several sources of emoji data, each defined as a "platform".
Platforms include:

- Chat platforms ([Discord](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/16), [Slack](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/7), ...)
- Operating systems ([macOS](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/5), [Windows](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/6), ...)
- Open source libraries used by platforms ([`emoji-mart`](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/14), [GNOME](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/9)...)

Any grouping of emoji 🆔 _identity_ and _🔗 keywords_ used by consumers today can qualify as a platform.

> 🚀 If your platform isn't included in `emoji-platform-data` and doesn't have a tracking [`platform-support` issue](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues?q=is%3Aissue+is%3Aopen+label%3A%22platform+support%22), please file an issue asking for it!

## Why?

This is useful if you're looking to see the metadata supported for emojis in each of those platforms.
For example, if you wanted to [determine the keywords associated with any emoji](https://github.com/muan/emojilib/issues/194), this would let you accumulate all the keywords across the supported platforms.

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).
Thanks! 🗝

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/theswerd"><img src="https://avatars.githubusercontent.com/u/38309438?v=4?s=100" width="100px;" alt="Benjamin Swerdlow"/><br /><sub><b>Benjamin Swerdlow</b></sub></a><br /><a href="#ideas-theswerd" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/vladimyr"><img src="https://avatars.githubusercontent.com/u/1170440?v=4?s=100" width="100px;" alt="Dario Vladović"/><br /><sub><b>Dario Vladović</b></sub></a><br /><a href="#ideas-vladimyr" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/commits?author=vladimyr" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://piou.io"><img src="https://avatars.githubusercontent.com/u/3654180?v=4?s=100" width="100px;" alt="Gilles Piou"/><br /><sub><b>Gilles Piou</b></sub></a><br /><a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/commits?author=pioug" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.joshuakgoldberg.com/"><img src="https://avatars.githubusercontent.com/u/3335181?v=4?s=100" width="100px;" alt="Josh Goldberg ✨"/><br /><sub><b>Josh Goldberg ✨</b></sub></a><br /><a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/commits?author=JoshuaKGoldberg" title="Code">💻</a> <a href="#content-JoshuaKGoldberg" title="Content">🖋</a> <a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/commits?author=JoshuaKGoldberg" title="Documentation">📖</a> <a href="#ideas-JoshuaKGoldberg" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-JoshuaKGoldberg" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-JoshuaKGoldberg" title="Maintenance">🚧</a> <a href="#projectManagement-JoshuaKGoldberg" title="Project Management">📆</a> <a href="#tool-JoshuaKGoldberg" title="Tools">🔧</a> <a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/issues?q=author%3AJoshuaKGoldberg" title="Bug reports">🐛</a> <a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/commits?author=JoshuaKGoldberg" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://madelinemiller.dev/"><img src="https://avatars.githubusercontent.com/u/546754?v=4?s=100" width="100px;" alt="Maddy Miller"/><br /><sub><b>Maddy Miller</b></sub></a><br /><a href="https://github.com/JoshuaKGoldberg/emoji-platform-data/issues?q=author%3Ame4502" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->

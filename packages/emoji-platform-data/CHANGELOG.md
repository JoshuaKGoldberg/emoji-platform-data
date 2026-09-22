# Changelog

## 0.4.1

### Patch Changes

- [#999](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/999) [`d63f46e`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/d63f46e78026e7d6d737bb1ac2f7ec190a3bd499) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Declared `sideEffects: false` so bundlers can tree-shake, and updated dependencies

## 0.4.0

### Minor Changes

- [#994](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/994) [`2993170`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/29931704f6c668b962f30825223f1414be197815) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Removed the runtime dependency on `emojipedia`: the package's types are now self-contained, so installing it no longer pulls in `emojipedia`'s GraphQL dependencies.
  Also removed the `./by-emoji.json` and `./by-title.json` `exports` entries, which never pointed to emitted files.

## 0.3.0 (2026-09-21)

### Bug Fixes

- repair fluemoji glyphs that don't match their unicode ([#983](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/983)) ([fca181d](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/fca181d8bfd3c3e8af369ebf086db052e57bfff1)), closes [#690](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/690)

### Features

- also export a byEmoji object ([#982](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/982)) ([b28c0be](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/b28c0be4d343048e00b3582360e3c0e3f5772129)), closes [#20](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/20)
- use 'with' keyword instead of 'assert' ([#366](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/366)) ([7ac2e8f](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/7ac2e8f83f50f73bfbecb97ed42fb04065aec164)), closes [#000](https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/000)

## 0.2.0 (2024-10-15)

### Features

- emojipedia@0.4.0 with import attributes (also ncu -u) ([ea47179](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/ea47179882406c196bdad6bad9011683d7db9058))

## 0.1.0 (2024-03-20)

### Features

- initial commit ✨ ([b70b9c2](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/b70b9c2bb38d8dacdd75f230ecc9fb753ec4e2f8))
- initialized repo ✨ ([bef4c97](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/bef4c97c93306508989ce78a71f99e83819b9b31))

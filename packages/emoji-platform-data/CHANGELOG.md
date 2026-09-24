# Changelog

## 0.6.0

### Minor Changes

- [#1003](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1003) [`03ab722`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/03ab722a35516c5297ec0404a04a72e1a82745fb) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added emoji-mart data, as a new `@emoji-platform-data/emoji-mart` package and an `emojiMart` property on `EmojiPlatformData`.

  Each `EmojiMartItem` holds the keywords [emoji-mart](https://github.com/missive/emoji-mart)'s picker searches, along with the emoji's shortcode, name, skin tone variants, picker category, and picker order.
  Around 1390 emoji gain roughly 3200 keywords no other source had, counting only keywords that aren't plurals or other variants of one the emoji already had.
  The gains are largest for abstract emoji: 📝 is also `exam`, `quiz`, and `study`, and ⚰️ is also `vampire`, `rip`, and `graveyard`.

  emoji-mart last published in April 2024, so its data stops at Unicode 15.
  It adds keywords rather than emoji: every emoji it knows was already known to another source, and it doesn't cover the 45 newest.

## 0.5.0

### Minor Changes

- [#1001](https://github.com/JoshuaKGoldberg/emoji-platform-data/pull/1001) [`8ec2228`](https://github.com/JoshuaKGoldberg/emoji-platform-data/commit/8ec22285b75b68f0452a1bf3550c1a7e2ec01805) Thanks [@JoshuaKGoldberg](https://github.com/JoshuaKGoldberg)! - Added macOS emoji data, as a new `@emoji-platform-data/macos` package and a `macos` property on `EmojiPlatformData`.

  Each `MacOSItem` holds the keywords macOS's emoji picker searches, along with the emoji's Apple name, VoiceOver and speech names, picker category, and picker order.
  This also adds 20 emoji that none of the other sources know yet, such as 🫩, 🫆, 🪉, and 🫜.

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

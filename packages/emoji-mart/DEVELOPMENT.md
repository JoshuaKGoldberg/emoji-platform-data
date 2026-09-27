# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Where This Data Comes From

This package's data is [`@emoji-mart/data`](https://www.npmjs.com/package/@emoji-mart/data), a dependency of the generator, read by [`packages/generator/src/emojiMart.ts`](../generator/src/emojiMart.ts).
There's nothing to refresh by hand: Renovate bumps the dependency when a new version is published, and building picks it up.

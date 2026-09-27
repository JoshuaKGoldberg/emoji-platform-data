# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Where This Data Comes From

This package's data is `emoji.json` from [`emoji-toolkit`](https://www.npmjs.com/package/emoji-toolkit), a dependency of the generator, read by [`packages/generator/src/joypixels.ts`](../generator/src/joypixels.ts).
There's nothing to refresh by hand: Renovate bumps the dependency when a new version is published, and building picks it up.

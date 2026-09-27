# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Where This Data Comes From

This package's data is [`emojipedia`](https://www.npmjs.com/package/emojipedia), a dependency of the generator, read by [`packages/generator/src/emojipedia.ts`](../generator/src/emojipedia.ts).
There's nothing to refresh by hand: Renovate bumps the dependency when a new version is published, and building picks it up.

Emojipedia's titles are what every other source is matched against, and what `byTitle` is keyed by in every package, so a new version here can rename or add titles across all of them.

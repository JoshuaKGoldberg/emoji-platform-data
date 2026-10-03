# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Where This Data Comes From

This package's data is [`emojipedia`](https://www.npmjs.com/package/emojipedia), a generator dependency that Renovate keeps up to date, read by [`packages/generator/src/emojipedia.ts`](../generator/src/emojipedia.ts).

Emojipedia's titles are what every other source is matched against, and what `byTitle` is keyed by in every package, so a new version here can rename or add titles across all of them.

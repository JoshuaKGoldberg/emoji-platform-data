# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Where This Data Comes From

This package's data is the `assets/*/metadata.json` files of [microsoft/fluentui-emoji](https://github.com/microsoft/fluentui-emoji), read by [`packages/generator/src/fluemoji.ts`](../generator/src/fluemoji.ts).

It's a Git dependency named `fluemoji`, pinned to a commit in `pnpm-lock.yaml` rather than a version Renovate bumps, so picking up newer emoji means updating that pin.

`generateAll()` and the other generator APIs also accept a `fluemojiDirectory`, for reading a local clone of the repository instead.

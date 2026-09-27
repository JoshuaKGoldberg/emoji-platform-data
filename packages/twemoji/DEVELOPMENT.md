# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Where This Data Comes From

This package's data is [`packages/generator/emoji.yml`](../generator/emoji.yml), a copy of the emoji configuration from [twitter/twemoji-parser](https://github.com/twitter/twemoji-parser) v13.1.0, read by [`packages/generator/src/twemoji.ts`](../generator/src/twemoji.ts).

It's a static copy, and twemoji-parser hasn't changed it since, so there's nothing to refresh.

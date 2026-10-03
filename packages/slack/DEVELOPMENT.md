# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing Slack Data

Slack's emoji list is only in its web client's bundle, which the desktop app loads too.

Reading it needs nothing but a network connection, so any machine can refresh it:

```shell
pnpm --filter @emoji-platform-data/generator refresh:slack
```

The script can also be pointed at another page that serves the client, such as GovSlack's:

```shell
pnpm --filter @emoji-platform-data/generator refresh:slack https://app.slack-gov.com/client
```

[`packages/generator/scripts/refreshSlack.ts`](../generator/scripts/refreshSlack.ts) fetches <https://app.slack.com/client> with a current Chrome user agent, since fetch's own gets an older build, then reads the page's `data-cdn` attribute, up-front scripts, and locale-to-translation-file map.

Everything but the translations is in one module, in the `gantry-v2-shared.*` chunk or else any up-front script, holding:

- The emoji data: every shortcode, the code points it stands for, and which shortcodes are aliases of which
- The picker's categories, each listing its emoji by shortcode in picker order
- The English name of each emoji and the English keywords the picker searches on

The first two are JSON found the same way as Discord's, and the names and keywords are code that the script reads as text without evaluating:

- They're object literals such as `{octopus:[c.t("animal"),c.t("creature"),…]}`, where `c` is one namespace's translator
- Each map is found by the string that creates its translator, such as `new o.Ay("emoji_keywords")`
- Any entry that isn't a key followed by a translator call, or an array of them, fails the refresh

Each locale's translation file has `emoji_names` and `emoji_keywords` namespaces:

- Keys are the first 7 characters of the English text's SHA-1, or 10, 20, or 40 when shorter would collide, so the script tries each in turn like the client
- A value of `0` means the translation is the same as the English
- Anything not found falls back to the English, and fewer than 95% found fails validation, which means the hashing changed

The script keeps every top-level record in the emoji data that isn't an alias, so:

- Skin tone variants such as `wave::skin-tone-3`, nested in their base emoji's records, are left out
- Emoji the picker doesn't list, mostly gender-neutral forms of older people emoji such as 👮 `cop`, are kept without a category or order

Keyword lists for shortcodes that aren't emoji, such as `undefined`, are dropped with a warning, and more than 5 fail validation.

The snapshot, [`packages/generator/slack.json`](../generator/slack.json), is rewritten only when its data changed, not just the source it was read from, and the script fails without writing it if:

- Too few emoji came back or have keywords, or either count fell sharply since the last snapshot
- A picker category has too few emoji
- An expected locale is missing, or too few of its terms are found
- A known emoji lost a known shortcode or keyword in English, or a known name or keyword in another locale

The daily `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.

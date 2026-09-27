# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing Slack Data

Slack doesn't publish its emoji list either.
Like Discord's, its desktop app is an Electron shell that loads the web client and ships no emoji data of its own, so the data comes from the web client's bundle.

Reading it needs nothing but a network connection, so any machine can refresh it:

```shell
pnpm --filter @emoji-platform-data/generator refresh:slack
```

[`packages/generator/scripts/refreshSlack.ts`](../generator/scripts/refreshSlack.ts) fetches <https://app.slack.com/client>, which serves the full client page even to a signed-out visitor, as long as the request looks like it comes from a browser Slack supports.
Fetch's own user agent gets an older build instead, so the script sends a current Chrome one.
The page names the CDN it loads from in a `data-cdn` attribute, lists the scripts it loads up front, and maps each locale to its translation file.

Everything but the translations is in one module, which Slack bundles into a chunk named `gantry-v2-shared.*` that the script tries first, falling back to every script the page loads up front.
The module holds three things:

- The emoji data: every shortcode, the code points it stands for, and which shortcodes are aliases of which
- The picker's categories, each listing its emoji by shortcode in picker order
- The English name of each emoji and the English keywords the picker searches on

The first two are JSON blobs inside single-quoted string literals, found the same way Discord's are: by parsing every literal and asking what each one holds.
The names and keywords are code rather than data -object literals like `{octopus:[c.t("animal"),c.t("creature"),…]}`, where `c` is the client's translator for one namespace- so the script reads them as text, never evaluating anything the bundle contains.
Each namespace's translator is created from a string, such as `new o.Ay("emoji_keywords")`, that the client has to keep since it names the translations too, so the map is found through that rather than through a variable or function name.
The map is then read an entry at a time, and anything that isn't a key followed by a translator call or an array of them stops the refresh rather than being skipped.

The translations are one file per locale, each with an `emoji_names` and an `emoji_keywords` namespace.
Those don't key a translation by its English text, but by the first seven characters of the SHA-1 of that text, or ten, twenty, or all forty when seven would collide within the locale; the client tries each in turn, and so does the script.
A value of `0` means the translation is the same as the English.
Every locale has a key for every English term as of writing, so validation insists on 95% of them being found, which is what catches the hashing changing.
Anything not found falls back to the English, as it does in the client.

The emoji data lists every skin tone variant of the emoji that have them, but only so that shortcodes like `wave::skin-tone-3` resolve, so those are dropped just as Discord's are.
It also lists 52 emoji the picker doesn't, mostly the gender-neutral forms of older people emoji such as 👮 `cop`, which the picker shows only as their man and woman variants; those are kept, without a category or order.
The keyword map has a stray `undefined` key, which is dropped with a warning.

The result is committed as a snapshot, [`packages/generator/slack.json`](../generator/slack.json), the same way Discord's is.
The script rewrites the snapshot only when the emoji or the locales changed, and validates what it read before writing anything: how many emoji came back, how many of them have keywords, that every picker category is well represented, that every expected locale is there with its terms found, that a few known emoji still have known shortcodes and keywords in English _and_ in another locale, and that neither count has fallen sharply since the last snapshot.

The monthly `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.

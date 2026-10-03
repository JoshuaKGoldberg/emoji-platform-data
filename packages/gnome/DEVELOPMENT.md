# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing GNOME Data

GNOME's emoji picker is GTK's emoji chooser, the one <kbd>Ctrl</kbd> + <kbd>.</kbd> opens in any GTK text field.

GTK commits its emoji data as one `gtk/emoji/*.data` [GVariant](https://docs.gtk.org/glib/gvariant-format-strings.html) of type `a(aussasasu)` per locale, generated from [Emojibase](https://emojibase.dev)'s CLDR-based data by `gtk/emoji/convert-emoji.c`, with each emoji's code points, picker section, and names and keywords in English and the locale.

Reading it needs nothing but a network connection, so any machine can refresh it:

```shell
pnpm --filter @emoji-platform-data/generator refresh:gnome
```

The script can also be pointed at a specific GTK tag:

```shell
pnpm --filter @emoji-platform-data/generator refresh:gnome 4.22.5
```

[`packages/generator/scripts/refreshGnome.ts`](../generator/scripts/refreshGnome.ts) fetches every `gtk/emoji/*.data` file at the newest stable GTK 4 tag on GNOME's GitLab, skipping development releases, which have an odd minor version such as 4.23.4, and decodes them itself rather than depending on GLib.

The script turns GTK's skin tone placeholders back into the plain emoji, dropping U+1F3FB and turning 0 into a presentation selector, but keeps emoji that GTK writes without one, such as 🕵‍♂️, as they are.

As of GTK 4.24, `en.data` is a CLDR release behind the other locales, so:

- The 8 emoji new in Emoji 17.0 keep the English from the other locales' data, but have no `order`
- Those locales write four older emoji as their new skin tone templates, such as 👯‍♂️ as 👨🏻‍🐰‍👨🏻, so a locale's emoji that `en.data` lacks is joined to the English emoji with the same English name

The snapshot, [`packages/generator/gnome.json`](../generator/gnome.json), is rewritten only when the emoji or the locales changed, and the script fails without writing it if:

- Too few emoji came back or have keywords, or either count fell sharply since the last snapshot
- A picker section has too few emoji
- An expected locale is missing, or lacks names for too many emoji
- A known emoji lost a known name or keyword in another locale

The daily `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.

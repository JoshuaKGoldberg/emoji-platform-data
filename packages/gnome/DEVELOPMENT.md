# Development

> See the repository's [`.github/DEVELOPMENT.md`](../../.github/DEVELOPMENT.md) for setting up, building, and testing the repository as a whole.

## Refreshing GNOME Data

GNOME's emoji picker is GTK's emoji chooser, the one <kbd>Ctrl</kbd> + <kbd>.</kbd> opens in any GTK text field.
GNOME has a few other emoji lists -GNOME Shell's on-screen keyboard, GNOME Characters, and IBus's emoji typing- but those carry names at most, straight from Unicode or CLDR, without anything GTK's doesn't.

GTK generates its emoji data from [Emojibase](https://emojibase.dev)'s CLDR-based data with `gtk/emoji/convert-emoji.c`, and commits the result: one `gtk/emoji/*.data` file per locale, each a [GVariant](https://docs.gtk.org/glib/gvariant-format-strings.html) of type `a(aussasasu)`.
Each emoji in it has its code points, its name in English and in the file's locale, its keywords in English and in the file's locale, and its picker section.
The chooser searches all four, so someone using GTK in German finds 🐙 by `tintenfisch` as well as by `octopus`.

Reading it needs nothing but a network connection, so any machine can refresh it:

```shell
pnpm --filter @emoji-platform-data/generator refresh:gnome
```

The script can also be pointed at a specific GTK tag:

```shell
pnpm --filter @emoji-platform-data/generator refresh:gnome 4.22.5
```

[`packages/generator/scripts/refreshGnome.ts`](../generator/scripts/refreshGnome.ts) asks GNOME's GitLab for the newest stable GTK 4 tag -GTK numbers its development releases with an odd minor version, such as 4.23.4- and fetches every `gtk/emoji/*.data` file at that tag.
It decodes those itself rather than depending on GLib: GVariant writes a container's members back to back, then the offsets where each variable-size member ends, sized by how large the container is.

GTK lists each emoji once, marking those that have skin tone variants by where their tone would go, as U+1F3FB when the plain emoji drops it or as 0 when the plain emoji needs an emoji presentation selector there.
Those are turned back into the plain emoji.
The emoji that GTK writes without a presentation selector, such as 🕵‍♂️, are kept as GTK writes them, since that's what its picker inserts.

GTK doesn't always regenerate every locale at once.
As of GTK 4.24, `en.data` is a CLDR release behind the others, so the 12 emoji new in Emoji 17.0 are only in the other locales' data.
Those keep the English that each locale's data carries alongside its own -which is what GTK searches in those locales- but have no `order`, since the English picker doesn't show them.
Emoji 17.0 also named four of its new emoji what older ones are already named, such as 👨‍🐰‍👨 and 👯‍♂️ "men with bunny ears", so the generator titles the new ones by their code points until Emojipedia knows them.

The result is committed as a snapshot, [`packages/generator/gnome.json`](../generator/gnome.json), the same way Discord and Slack are, so that building the packages never depends on a network fetch.
GTK tags a release every few weeks but regenerates its emoji data about once a year, so the script rewrites the snapshot only when the emoji or the locales changed, and validates what it read before writing anything: how many emoji came back, how many of them have keywords, that every picker section is well represented, that every expected locale is there with names for nearly every emoji, that a few known emoji still have known names and keywords in another locale, and that neither count has fallen sharply since the last snapshot.

The daily `Refresh Data` workflow runs the same thing and opens a pull request when the data changed.

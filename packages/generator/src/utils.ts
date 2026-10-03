import * as fs from "node:fs/promises";
import * as path from "node:path";
import { titleCase } from "title-case";

import { GeneratedEmojipediaData } from "./emojipedia.js";

/**
 * How many times each title appears.
 */
export function countTitles(titles: string[]) {
	const counts = new Map<string, number>();

	for (const title of titles) {
		counts.set(title, (counts.get(title) ?? 0) + 1);
	}

	return counts;
}

export function getEntryCldr(
	emojipedia: GeneratedEmojipediaData,
	glyph: string | undefined,
	unicode: string | undefined,
	entries: string[],
) {
	const byGlyphAlias = glyph && getGlyphAlias(emojipedia, glyph);
	if (byGlyphAlias) {
		return byGlyphAlias;
	}

	for (const entry of entries) {
		const aliased = emojipedia.aliases.get(normalizeTitle(entry));
		if (aliased) {
			return aliased;
		}
	}

	const byUnicodeItem =
		unicode &&
		emojipedia.items.find((emojipediaItem) => {
			const normalizedHexes = normalizeCodepoints(emojipediaItem.codepointsHex);
			return (
				normalizedHexes.join("-") === unicode ||
				withoutVariationSelectorCodes(normalizedHexes.join("-")) === unicode
			);
		});
	const byUnicode = byUnicodeItem && emojipedia.aliases.get(byUnicodeItem.code);

	if (byUnicode) {
		return byUnicode;
	}

	return titleCase(entries[0].replaceAll("_", " "))
		.replaceAll("#", "Hash")
		.replaceAll("*", "Asterisk")
		.replaceAll("’s Symbol", "’s Room");
}

/**
 * Emojipedia's `["U+1F44B", "U+1F3FD"]` as the `["1f44b", "1f3fd"]` form other
 * platforms write their codepoints in. Emojipedia writes the shortest hex that
 * fits, such as `U+A9`, while platforms pad to at least four digits (`00a9`).
 */
export function normalizeCodepoints(codepointsHex: string[]) {
	return codepointsHex.map((hex) =>
		hex.replace("U+", "").toLowerCase().padStart(4, "0"),
	);
}

export function normalizeTitle(text: string) {
	return text.replaceAll(/\W/g, "").toLowerCase();
}

/**
 * Looks up a glyph, then retries without any variation selectors.
 * Sources disagree on whether to include them: macOS lists ⭐️ as U+2B50 U+FE0F,
 * while Emojipedia knows it as U+2B50.
 */
function getGlyphAlias(emojipedia: GeneratedEmojipediaData, glyph: string) {
	return (
		emojipedia.aliases.get(glyph) ??
		emojipedia.aliases.get(withoutVariationSelectors(glyph))
	);
}

/**
 * Whether Emojipedia knows a glyph as its own emoji, rather than only by a name.
 */
export function isKnownGlyph(
	emojipedia: GeneratedEmojipediaData,
	glyph: string,
) {
	return getGlyphAlias(emojipedia, glyph) !== undefined;
}

/**
 * Equivalent to Object.fromEntries, but warns when multiple entries resolve
 * to the same CLDR title, since the later entry would silently overwrite the earlier.
 */
export function recordByCldr<T>(
	platform: string,
	entries: [string, T][],
): Partial<Record<string, T>> {
	const record: Partial<Record<string, T>> = {};

	for (const [cldr, entry] of entries) {
		if (cldr in record) {
			console.warn(
				`Multiple ${platform} entries resolve to '${cldr}'; keeping only the last.`,
			);
		}

		record[cldr] = entry;
	}

	return record;
}

/**
 * The glyph for code points as platforms write them, such as "1f44b-1f3fd".
 */
export function fromUnicode(unicode: string) {
	return String.fromCodePoint(
		...unicode.split("-").map((hex) => parseInt(hex, 16)),
	);
}

/**
 * Reads a platform's data snapshot committed alongside this package, keyed by
 * the title each entry resolves to.
 */
export async function readSnapshot<Entry>(
	platform: string,
	getCldr: (entry: Entry) => string,
) {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, `../${platform}.json`),
		"utf8",
	);
	const { entries } = JSON.parse(raw) as { entries: Entry[] };

	return recordByCldr(
		platform,
		entries.map((entry) => [getCldr(entry), entry]),
	);
}

/**
 * Code points as Unicode writes them, such as "U+1F9D1 U+200D U+1F9B0".
 */
export function toCodePointNotation(unicode: string) {
	return unicode
		.split("-")
		.map((hex) => `U+${hex.toUpperCase()}`)
		.join(" ");
}

export function toUnicode(emoji: string) {
	// Code points are the unit Emojipedia writes its codepoint lists in.
	// eslint-disable-next-line @typescript-eslint/no-misused-spread
	return [...emoji]
		.map((character) =>
			(character.codePointAt(0) ?? 0).toString(16).padStart(4, "0"),
		)
		.join("-");
}

/**
 * A glyph without any of its U+FE0F variation selectors.
 */
export function withoutVariationSelectors(glyph: string) {
	return glyph.replaceAll("\uFE0F", "");
}

/**
 * Code points as platforms write them, such as "2764-fe0f", without any U+FE0F
 * variation selectors.
 */
export function withoutVariationSelectorCodes(unicode: string) {
	return unicode
		.split("-")
		.filter((hex) => hex !== "fe0f")
		.join("-");
}

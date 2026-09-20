import { titleCase } from "title-case";

import { GeneratedEmojipediaData } from "./emojipedia.js";

export function getEntryCldr(
	emojipedia: GeneratedEmojipediaData,
	glyph: string | undefined,
	unicode: string | undefined,
	entries: string[],
) {
	const byGlyphAlias = glyph && emojipedia.aliases.get(glyph);
	if (byGlyphAlias) {
		return byGlyphAlias;
	}

	for (const entry of entries) {
		const aliased = emojipedia.aliases.get(normalizeTitle(entry));
		if (aliased) {
			return aliased;
		}
	}

	const byUnicode =
		unicode &&
		emojipedia.items.find((emojipediaItem) => {
			const normalizedHexes = emojipediaItem.codepointsHex.map((hex) =>
				hex.replace("U+", "").toLowerCase(),
			);
			return (
				normalizedHexes.join("-") === unicode ||
				normalizedHexes.filter((hex) => hex !== "fe0f").join("-") === unicode
			);
		})?.title;

	if (byUnicode) {
		return byUnicode;
	}

	return titleCase(entries[0])
		.replaceAll("#", "Hash")
		.replaceAll("*", "Asterisk")
		.replaceAll("’s Symbol", "’s Room");
}

export function normalizeTitle(text: string) {
	return text.replaceAll(/\W/g, "").toLowerCase();
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

import { titleCase } from "title-case";

import { GeneratedEmojipediaData } from "./emojipedia.js";

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
 * Looks up a glyph, then retries without any variation selectors.
 * Sources disagree on whether to include them: macOS lists ⭐️ as U+2B50 U+FE0F,
 * while Emojipedia knows it as U+2B50.
 */
function getGlyphAlias(emojipedia: GeneratedEmojipediaData, glyph: string) {
	return (
		emojipedia.aliases.get(glyph) ??
		emojipedia.aliases.get(glyph.replaceAll("\uFE0F", ""))
	);
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

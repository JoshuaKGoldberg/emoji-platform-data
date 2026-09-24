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
			const normalizedHexes = normalizeCodepoints(emojipediaItem.codepointsHex);
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

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

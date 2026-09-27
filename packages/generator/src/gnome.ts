import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllGnomeData, GnomeItem } from "./types.js";
import {
	getEntryCldr,
	recordByCldr,
	toCodePointNotation,
	toUnicode,
} from "./utils.js";

interface GnomeSnapshot {
	entries: GnomeItem[];
}

/**
 * Reads the GNOME data snapshot committed alongside this package.
 */
export async function generateGnome(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllGnomeData>> {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, "../gnome.json"),
		"utf8",
	);
	const { entries } = JSON.parse(raw) as GnomeSnapshot;
	const namesTaken = countNames(entries);

	return recordByCldr(
		"gnome",
		entries.map((entry) => {
			const unicode = toUnicode(entry.emoji);

			// Emoji 17.0 named some new emoji what older ones are already named,
			// such as 👨‍🐰‍👨 and 👯‍♂️ "men with bunny ears". A name shared like that
			// stays with whichever emoji Emojipedia knows by its glyph, and the
			// other is titled by its code points, as WeChat's unnamed emoji are.
			const names =
				(namesTaken.get(entry.name) ?? 0) > 1 &&
				!isKnownGlyph(emojipedia, entry.emoji)
					? [toCodePointNotation(unicode)]
					: [entry.name];

			return [getEntryCldr(emojipedia, entry.emoji, unicode, names), entry];
		}),
	);
}

function countNames(entries: GnomeItem[]) {
	const counts = new Map<string, number>();

	for (const { name } of entries) {
		counts.set(name, (counts.get(name) ?? 0) + 1);
	}

	return counts;
}

function isKnownGlyph(emojipedia: GeneratedEmojipediaData, glyph: string) {
	return (
		emojipedia.aliases.has(glyph) ||
		emojipedia.aliases.has(glyph.replaceAll("️", ""))
	);
}

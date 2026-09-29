import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllGnomeData, GnomeItem } from "./types.js";
import { getEntryCldr, recordByCldr, toUnicode } from "./utils.js";

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

	return recordByCldr(
		"gnome",
		entries.map((entry) => [
			getEntryCldr(emojipedia, entry.emoji, toUnicode(entry.emoji), [
				entry.name,
			]),
			entry,
		]),
	);
}

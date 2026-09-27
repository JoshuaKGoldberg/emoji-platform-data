import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllAndroidData, AndroidItem } from "./types.js";
import {
	getEntryCldr,
	recordByCldr,
	toCodePointNotation,
	toUnicode,
} from "./utils.js";

interface AndroidSnapshot {
	entries: AndroidItem[];
}

/**
 * Reads the Android data snapshot committed alongside this package.
 */
export async function generateAndroid(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllAndroidData>> {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, "../android.json"),
		"utf8",
	);
	const { entries } = JSON.parse(raw) as AndroidSnapshot;

	return recordByCldr(
		"android",
		entries.map((entry) => {
			// Gboard's emoji data has no names, so emoji nothing else names are
			// titled by their code points, as WeChat's are.
			const unicode = toUnicode(entry.emoji);

			return [
				getEntryCldr(emojipedia, entry.emoji, unicode, [
					toCodePointNotation(unicode),
				]),
				entry,
			];
		}),
	);
}

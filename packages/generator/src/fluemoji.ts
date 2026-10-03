import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllFluemojiData, FluemojiItem } from "./types.js";
import { fromUnicode, getEntryCldr, recordByCldr } from "./utils.js";

export const defaultFluemojiDirectory = path.join(
	import.meta.dirname,
	"../node_modules/fluemoji",
);

export async function generateFluemoji(
	emojipedia: GeneratedEmojipediaData,
	directory: string = defaultFluemojiDirectory,
): Promise<Partial<AllFluemojiData>> {
	const files = await fg("assets/*/metadata.json", {
		absolute: true,
		cwd: directory,
	});

	if (!files.length) {
		throw new Error(
			`No fluemoji assets found in ${directory}. Those assets come from https://github.com/microsoft/fluentui-emoji: clone it, then pass the directory containing its assets/ folder.`,
		);
	}

	files.sort();

	const entries: FluemojiItem[] = [];

	for (const file of files) {
		entries.push(
			repairGlyph(JSON.parse(await fs.readFile(file, "utf8")) as FluemojiItem),
		);
	}

	return recordByCldr(
		"fluemoji",
		entries.map((entry) => [
			getEntryCldr(emojipedia, entry.glyph, entry.unicode, [entry.cldr]),
			entry,
		]),
	);
}

/**
 * Some upstream fluemoji entries have a `glyph` that doesn't match their `unicode`.
 * For example, "woman in motorized wheelchair facing right" has the glyph of
 * "woman in motorized wheelchair", which causes it to overwrite that entry.
 * The `unicode` field is always correct, so it's used as the source of truth.
 * @see https://github.com/JoshuaKGoldberg/emoji-platform-data/issues/690
 */
function repairGlyph(entry: FluemojiItem): FluemojiItem {
	const glyph = fromUnicode(entry.unicode.replaceAll(" ", "-"));

	if (glyph === entry.glyph) {
		return entry;
	}

	console.warn(
		`fluemoji glyph for '${entry.cldr}' (${entry.glyph}) doesn't match its unicode (${entry.unicode}); using ${glyph}.`,
	);

	return { ...entry, glyph };
}

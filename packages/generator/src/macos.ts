import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllMacOSData, MacOSItem } from "./types.js";
import { getEntryCldr, recordByCldr } from "./utils.js";

interface MacOSSnapshot {
	entries: MacOSItem[];
}

/**
 * Reads the macOS data snapshot committed alongside this package.
 *
 * Unlike the other sources, macOS's emoji data can only be read on a Mac, out
 * of private system frameworks. It's extracted separately by
 * scripts/refreshMacOS.ts so that building this repository doesn't need one.
 */
export async function generateMacOS(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllMacOSData>> {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, "../macos.json"),
		"utf8",
	);
	const { entries } = JSON.parse(raw) as MacOSSnapshot;

	return recordByCldr(
		"macos",
		entries.map((entry) => [
			getEntryCldr(emojipedia, entry.emoji, undefined, [entry.appleName]),
			entry,
		]),
	);
}

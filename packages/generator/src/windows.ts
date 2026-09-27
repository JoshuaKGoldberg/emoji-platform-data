import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllWindowsData, WindowsItem } from "./types.js";
import { getEntryCldr, recordByCldr } from "./utils.js";

interface WindowsSnapshot {
	entries: WindowsItem[];
}

/**
 * Reads the Windows data snapshot committed alongside this package.
 */
export async function generateWindows(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllWindowsData>> {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, "../windows.json"),
		"utf8",
	);
	const { entries } = JSON.parse(raw) as WindowsSnapshot;

	return recordByCldr(
		"windows",
		entries.map((entry) => [
			getEntryCldr(emojipedia, entry.emoji, undefined, [entry.name]),
			entry,
		]),
	);
}

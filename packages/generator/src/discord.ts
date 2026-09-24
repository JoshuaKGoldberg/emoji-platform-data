import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllDiscordData, DiscordItem } from "./types.js";
import { getEntryCldr, recordByCldr } from "./utils.js";

interface DiscordSnapshot {
	entries: DiscordItem[];
}

/**
 * Reads the Discord data snapshot committed alongside this package.
 */
export async function generateDiscord(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllDiscordData>> {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, "../discord.json"),
		"utf8",
	);
	const { entries } = JSON.parse(raw) as DiscordSnapshot;

	return recordByCldr(
		"discord",
		entries.map((entry) => [
			getEntryCldr(emojipedia, entry.emoji, undefined, [
				entry.name,
				...entry.aliases,
			]),
			entry,
		]),
	);
}

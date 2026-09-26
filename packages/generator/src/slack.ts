import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllSlackData, SlackItem } from "./types.js";
import { getEntryCldr, recordByCldr } from "./utils.js";

interface SlackSnapshot {
	entries: SlackItem[];
}

/**
 * Reads the Slack data snapshot committed alongside this package.
 */
export async function generateSlack(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllSlackData>> {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, "../slack.json"),
		"utf8",
	);
	const { entries } = JSON.parse(raw) as SlackSnapshot;

	return recordByCldr(
		"slack",
		entries.map((entry) => [
			getEntryCldr(emojipedia, entry.emoji, undefined, [
				entry.name,
				...entry.aliases,
			]),
			entry,
		]),
	);
}

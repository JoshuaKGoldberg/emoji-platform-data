import { gemoji } from "gemoji";

import type { GeneratedEmojipediaData } from "./emojipedia.ts";
import type { AllGemojiData } from "./types.ts";
import { getEntryCldr, recordByCldr } from "./utils.ts";

export function generateGemoji(
	emojipedia: GeneratedEmojipediaData,
): Partial<AllGemojiData> {
	return recordByCldr(
		"gemoji",
		gemoji.map((entry) => [
			getEntryCldr(emojipedia, entry.emoji, [entry.description]),
			entry,
		]),
	);
}

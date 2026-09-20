import { gemoji } from "gemoji";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllGemojiData } from "./types.js";
import { getEntryCldr, recordByCldr } from "./utils.js";

export function generateGemoji(
	emojipedia: GeneratedEmojipediaData,
): Partial<AllGemojiData> {
	return recordByCldr(
		"gemoji",
		gemoji.map((entry) => [
			getEntryCldr(emojipedia, entry.emoji, undefined, [entry.description]),
			entry,
		]),
	);
}

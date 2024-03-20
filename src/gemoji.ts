import { gemoji } from "gemoji";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllGemojiData } from "./types.js";
import { getEntryCldr } from "./utils.js";

export function generateGemoji(
	emojipedia: GeneratedEmojipediaData,
): Partial<AllGemojiData> {
	return Object.fromEntries(
		gemoji.map((entry) => [
			getEntryCldr(emojipedia, entry.emoji, undefined, [entry.description]),
			entry,
		]),
	);
}

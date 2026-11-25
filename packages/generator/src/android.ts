import type { GeneratedEmojipediaData } from "./emojipedia.ts";
import type { AllAndroidData, AndroidItem } from "./types.ts";
import {
	getEntryCldr,
	readSnapshot,
	toCodePointNotation,
	toUnicode,
} from "./utils.ts";

/**
 * Reads the Android data snapshot committed alongside this package.
 */
export function generateAndroid(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllAndroidData>> {
	return readSnapshot("android", (entry: AndroidItem) => {
		// Gboard's emoji data has no names, so emoji nothing else names are
		// titled by their code points, as WeChat's are.
		const unicode = toUnicode(entry.emoji);

		return getEntryCldr(emojipedia, entry.emoji, [
			toCodePointNotation(unicode),
		]);
	});
}

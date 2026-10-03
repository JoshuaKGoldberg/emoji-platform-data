import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllAndroidData, AndroidItem } from "./types.js";
import {
	getEntryCldr,
	readSnapshot,
	toCodePointNotation,
	toUnicode,
} from "./utils.js";

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

		return getEntryCldr(emojipedia, entry.emoji, unicode, [
			toCodePointNotation(unicode),
		]);
	});
}

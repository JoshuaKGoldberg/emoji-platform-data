import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllMacOSData, MacOSItem } from "./types.js";
import { getEntryCldr, readSnapshot } from "./utils.js";

/**
 * Reads the macOS data snapshot committed alongside this package.
 */
export function generateMacOS(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllMacOSData>> {
	return readSnapshot("macos", (entry: MacOSItem) =>
		getEntryCldr(emojipedia, entry.emoji, undefined, [entry.appleName]),
	);
}

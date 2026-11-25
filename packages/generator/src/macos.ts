import type { GeneratedEmojipediaData } from "./emojipedia.ts";
import type { AllMacOSData, MacOSItem } from "./types.ts";
import { getEntryCldr, readSnapshot } from "./utils.ts";

/**
 * Reads the macOS data snapshot committed alongside this package.
 */
export function generateMacOS(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllMacOSData>> {
	return readSnapshot("macos", (entry: MacOSItem) =>
		getEntryCldr(emojipedia, entry.emoji, [entry.appleName]),
	);
}

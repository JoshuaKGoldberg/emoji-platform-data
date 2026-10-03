import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllWindowsData, WindowsItem } from "./types.js";
import { getEntryCldr, readSnapshot } from "./utils.js";

/**
 * Reads the Windows data snapshot committed alongside this package.
 */
export function generateWindows(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllWindowsData>> {
	return readSnapshot("windows", (entry: WindowsItem) =>
		getEntryCldr(emojipedia, entry.emoji, [entry.name]),
	);
}

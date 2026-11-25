import type { GeneratedEmojipediaData } from "./emojipedia.ts";
import type { AllWindowsData, WindowsItem } from "./types.ts";
import { getEntryCldr, readSnapshot } from "./utils.ts";

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

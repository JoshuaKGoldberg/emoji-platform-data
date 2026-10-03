import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllGnomeData, GnomeItem } from "./types.js";
import { getEntryCldr, readSnapshot } from "./utils.js";

/**
 * Reads the GNOME data snapshot committed alongside this package.
 */
export function generateGnome(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllGnomeData>> {
	return readSnapshot("gnome", (entry: GnomeItem) =>
		getEntryCldr(emojipedia, entry.emoji, [entry.name]),
	);
}

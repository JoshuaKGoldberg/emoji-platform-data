import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllDiscordData, DiscordItem } from "./types.js";
import { getEntryCldr, readSnapshot } from "./utils.js";

/**
 * Reads the Discord data snapshot committed alongside this package.
 */
export function generateDiscord(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllDiscordData>> {
	return readSnapshot("discord", (entry: DiscordItem) =>
		getEntryCldr(emojipedia, entry.emoji, [entry.name, ...entry.aliases]),
	);
}

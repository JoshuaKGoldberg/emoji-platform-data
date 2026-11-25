import type { GeneratedEmojipediaData } from "./emojipedia.ts";
import type { AllDiscordData, DiscordItem } from "./types.ts";
import { getEntryCldr, readSnapshot } from "./utils.ts";

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

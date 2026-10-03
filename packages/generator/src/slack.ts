import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllSlackData, SlackItem } from "./types.js";
import { getEntryCldr, readSnapshot } from "./utils.js";

/**
 * Reads the Slack data snapshot committed alongside this package.
 */
export function generateSlack(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllSlackData>> {
	return readSnapshot("slack", (entry: SlackItem) =>
		getEntryCldr(emojipedia, entry.emoji, undefined, [
			entry.name,
			...entry.aliases,
		]),
	);
}

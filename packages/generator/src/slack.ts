import type { GeneratedEmojipediaData } from './emojipedia.ts';
import type { AllSlackData, SlackItem } from './types.ts';
import { getEntryCldr, readSnapshot } from './utils.ts';

/**
 * Reads the Slack data snapshot committed alongside this package.
 */
export function generateSlack(emojipedia: GeneratedEmojipediaData): Promise<Partial<AllSlackData>> {
  return readSnapshot('slack', (entry: SlackItem) =>
    getEntryCldr(emojipedia, entry.emoji, [entry.name, ...entry.aliases]),
  );
}

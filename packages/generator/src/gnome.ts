import type { GeneratedEmojipediaData } from './emojipedia.ts';
import type { AllGnomeData, GnomeItem } from './types.ts';
import { getEntryCldr, readSnapshot } from './utils.ts';

/**
 * Reads the GNOME data snapshot committed alongside this package.
 */
export function generateGnome(emojipedia: GeneratedEmojipediaData): Promise<Partial<AllGnomeData>> {
  return readSnapshot('gnome', (entry: GnomeItem) =>
    getEntryCldr(emojipedia, entry.emoji, [entry.name]),
  );
}

import { EmojiMartData } from "@emoji-mart/data";
import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllEmojiMartData, EmojiMartItem } from "./types.js";
import { getEntryCldr, recordByCldr } from "./utils.js";

/**
 * Reads emoji-mart's Unicode 15 "native" set.
 *
 * emoji-mart hasn't published since April 2024, so this set is a fixed snapshot
 * of Unicode 15: it contributes keywords for emoji the other sources already
 * know, and never emoji of its own.
 */
export async function generateEmojiMart(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllEmojiMartData>> {
	const data = JSON.parse(
		await fs.readFile(
			fileURLToPath(
				import.meta.resolve("@emoji-mart/data/sets/15/native.json"),
			),
			"utf8",
		),
	) as EmojiMartData;

	const aliases = new Map<string, string[]>();

	for (const [alias, id] of Object.entries(data.aliases)) {
		aliases.set(id, [...(aliases.get(id) ?? []), alias]);
	}

	const entries: [string, EmojiMartItem][] = [];
	let order = 0;

	// Walking the categories, rather than the emojis, is what gives each entry
	// its category and its place in the picker's order. Every entry is listed by
	// exactly one category.
	for (const category of data.categories) {
		for (const id of category.emojis) {
			const entry = data.emojis[id];
			const [skin] = entry.skins;

			const cldr = getEntryCldr(emojipedia, skin.native, skin.unified, [
				entry.name,
			]);

			const item: EmojiMartItem = {
				aliases: aliases.get(entry.id),
				category: category.id,
				emoticons: entry.emoticons,
				id: entry.id,
				keywords: entry.keywords.filter(Boolean),
				name: entry.name,
				order: order++,
				skins: entry.skins.map(({ native, unified }) => ({ native, unified })),
				version: entry.version,
			};

			entries.push([cldr, item]);
		}
	}

	return recordByCldr("emojiMart", entries);
}

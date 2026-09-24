import { EmojiMartData } from "@emoji-mart/data";
import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllEmojiMartData, EmojiMartItem } from "./types.js";
import { getEntryCldr, normalizeCodepoints, recordByCldr } from "./utils.js";

interface ResolvedEntry {
	/**
	 * Whether the entry's own codepoints are the ones Emojipedia lists for its
	 * resolved title, rather than the entry having matched only by name.
	 */
	exact: boolean;

	item: EmojiMartItem;
}

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

	const byCldr = new Map<string, ResolvedEntry[]>();
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
				entry.id,
			]);

			const item: EmojiMartItem = {
				aliases: aliases.get(entry.id),
				category: category.id,
				emoticons: entry.emoticons,
				id: entry.id,
				keywords: entry.keywords,
				name: entry.name,
				order: order++,
				skins: entry.skins.map(({ native, unified }) => ({ native, unified })),
				version: entry.version,
			};

			const emojipediaItem = emojipedia.byCldr[cldr];

			byCldr.set(cldr, [
				...(byCldr.get(cldr) ?? []),
				{
					exact:
						!!emojipediaItem &&
						hasCodepoints(emojipediaItem.codepointsHex, skin.unified),
					item,
				},
			]);
		}
	}

	return recordByCldr(
		"emojiMart",
		Array.from(byCldr, ([cldr, group]): [string, EmojiMartItem] => [
			cldr,
			pickEntry(cldr, group).item,
		]),
	);
}

function hasCodepoints(codepointsHex: string[], unified: string) {
	const normalized = normalizeCodepoints(codepointsHex).join("-");

	return (
		normalized === unified ||
		withoutVariationSelectors(normalized) === withoutVariationSelectors(unified)
	);
}

/**
 * Several emoji-mart entries can resolve to one Emojipedia title: emoji-mart
 * keeps both 🤵 `person_in_tuxedo` and 🤵‍♂️ `man_in_tuxedo`, while Emojipedia
 * knows only one "Man in Tuxedo". Preferring the entry whose codepoints are the
 * ones Emojipedia lists stops an entry that matched on name alone from winning.
 */
function pickEntry(cldr: string, group: ResolvedEntry[]) {
	const exact = group.filter((entry) => entry.exact);

	if (exact.length > 1) {
		console.warn(
			`Multiple emoji-mart entries have the codepoints of '${cldr}'; keeping '${exact[0].item.id}'.`,
		);
	}

	// Emojipedia doesn't list every base glyph separately, such as 🧕 apart from
	// 🧕‍♀️, so an inexact entry is still the best data available for its title.
	return exact[0] ?? group[0];
}

function withoutVariationSelectors(unified: string) {
	return unified
		.split("-")
		.filter((hex) => hex !== "fe0f")
		.join("-");
}

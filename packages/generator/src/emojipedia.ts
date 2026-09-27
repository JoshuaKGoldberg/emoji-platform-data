import * as emojipedia from "emojipedia/data";

import { AllEmojipediaData, EmojipediaItem } from "./types.js";
import { normalizeTitle } from "./utils.js";

export interface GeneratedEmojipediaData {
	aliases: Map<string, string>;
	byCldr: Partial<AllEmojipediaData>;
	byCode: Partial<AllEmojipediaData>;
	items: EmojipediaItem[];
}

export function generateEmojipedia(): GeneratedEmojipediaData {
	const byCode: AllEmojipediaData = Object.fromEntries(
		Object.values(emojipedia).map((item) => [item.code, item]),
	);
	const items = Object.values(byCode);
	const aliases = new Map<string, string>();

	for (const item of items) {
		for (const alternate of [
			item.appleName,
			item.code,
			item.currentCldrName,
			item.title,
		].filter((x): x is string => !!x)) {
			aliases.set(alternate, item.title);

			const normalized = normalizeTitle(alternate);
			if (normalized) {
				aliases.set(normalized, item.title);
			}
		}
	}

	// Some platforms write emoji without a variation selector Emojipedia
	// includes, such as Twemoji's U+1F574 for 🕴️ (U+1F574 U+FE0F).
	for (const { code } of items) {
		const bare = code.replaceAll("\uFE0F", "");
		if (!aliases.has(bare)) {
			aliases.set(bare, aliases.get(code) ?? code);
		}
	}

	return {
		aliases,
		byCldr: Object.fromEntries(items.map((item) => [item.title, item])),
		byCode,
		items,
	};
}

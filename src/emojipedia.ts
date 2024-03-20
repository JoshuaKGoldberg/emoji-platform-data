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
	const byCode = Object.fromEntries(
		Object.values(emojipedia).map((item) => [item.code, item]),
	);
	const items = Object.values(byCode) as EmojipediaItem[];
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

	return {
		aliases,
		byCldr: Object.fromEntries(items.map((item) => [item.title, item])),
		byCode,
		items,
	};
}

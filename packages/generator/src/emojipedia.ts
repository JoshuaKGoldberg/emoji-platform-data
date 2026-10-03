import * as emojipedia from "emojipedia/data";

import { AllEmojipediaData, EmojipediaItem } from "./types.js";
import {
	countTitles,
	normalizeTitle,
	withoutVariationSelectors,
} from "./utils.js";

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
	const titles = getUniqueTitles(items);
	const aliases = new Map<string, string>();

	for (const item of items) {
		const title = titles.get(item) ?? item.title;

		for (const alternate of [item.appleName, item.code, item.currentCldrName]) {
			setAlias(aliases, alternate, title);
		}
	}

	for (const item of items) {
		const title = titles.get(item) ?? item.title;

		setAlias(aliases, title, title);
	}

	// Some platforms write emoji without a variation selector Emojipedia
	// includes, such as Twemoji's U+1F574 for 🕴️ (U+1F574 U+FE0F).
	for (const { code } of items) {
		const bare = withoutVariationSelectors(code);
		if (!aliases.has(bare)) {
			aliases.set(bare, aliases.get(code) ?? code);
		}
	}

	return {
		aliases,
		byCldr: Object.fromEntries(
			items.map((item) => [titles.get(item) ?? item.title, item]),
		),
		byCode,
		items,
	};
}

/**
 * Emojipedia titles a few pairs of emoji the same, such as 🤵 and 🤵‍♂️ as "Man
 * in Tuxedo", which would leave only one of each pair keyed by that title.
 * Those that have a different current CLDR name, such as 🤵's "Person in
 * Tuxedo", are titled by it instead.
 */
function getUniqueTitles(items: EmojipediaItem[]) {
	const counts = countTitles(items.map(({ title }) => title));

	return new Map(
		items
			.filter(
				(item) =>
					(counts.get(item.title) ?? 0) > 1 &&
					item.currentCldrName &&
					item.currentCldrName !== item.title,
			)
			.map((item) => [item, item.currentCldrName ?? item.title]),
	);
}

function setAlias(
	aliases: Map<string, string>,
	alternate: string | undefined,
	title: string,
) {
	if (!alternate) {
		return;
	}

	aliases.set(alternate, title);

	const normalized = normalizeTitle(alternate);
	if (normalized) {
		aliases.set(normalized, title);
	}
}

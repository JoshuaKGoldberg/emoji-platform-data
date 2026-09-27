import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parse } from "yaml";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllTwemojiData, TwemojiItem, TwemojiItemIncluded } from "./types.js";
import {
	fromUnicode,
	getEntryCldr,
	isKnownGlyph,
	recordByCldr,
	toCodePointNotation,
} from "./utils.js";

interface TwemojiGroupRaw {
	id: string;
	items: TwemojiItemRaw[];
	title: string;
}

type TwemojiItemRaw = Omit<TwemojiItem, "keywords"> & { keywords?: string };

export async function generateTwemoji(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllTwemojiData>> {
	const rawTwemoji = await fs.readFile(
		path.join(import.meta.dirname, "../emoji.yml"),
		"utf8",
	);
	const parsed = (await parse(rawTwemoji)) as TwemojiGroupRaw[];

	const entries = parsed.flatMap((group) =>
		group.items
			.map(
				(item) =>
					({
						...item,
						keywords: item.keywords ? item.keywords.split(",") : undefined,
					}) as TwemojiItem,
			)
			.filter((item) => isIncludedTwemojiItem(item)),
	);

	// Twemoji's descriptions predate some CLDR renames and have a few mistakes,
	// such as 😁 as "grinning face with smiling eyes" (now 😄's name) and 👰 as
	// "woman with veil", so its glyphs are looked up before its descriptions.
	const resolved = entries.map((entry) => {
		const glyph = fromUnicode(entry.unicode);

		return {
			cldr: getEntryCldr(emojipedia, glyph, entry.unicode, [entry.description]),
			entry,
			glyph,
		};
	});
	const cldrsTaken = countCldrs(resolved);

	return recordByCldr(
		"twemoji",
		resolved.map(({ cldr, entry, glyph }) => [
			// A description can still name an emoji Twemoji also has by its glyph,
			// such as 🕴️‍♂️ "man in business suit levitating" for 🕴️. That name stays
			// with the glyph Emojipedia knows, and the other is titled by its code
			// points, as GNOME's are.
			(cldrsTaken.get(cldr) ?? 0) > 1 && !isKnownGlyph(emojipedia, glyph)
				? toCodePointNotation(entry.unicode)
				: cldr,
			entry,
		]),
	);
}

function countCldrs(resolved: { cldr: string }[]) {
	const counts = new Map<string, number>();

	for (const { cldr } of resolved) {
		counts.set(cldr, (counts.get(cldr) ?? 0) + 1);
	}

	return counts;
}

function isIncludedTwemojiItem(item: TwemojiItem): item is TwemojiItemIncluded {
	return !("exclude_from_picker" in item);
}

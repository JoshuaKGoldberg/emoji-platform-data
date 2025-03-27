import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parse } from "yaml";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllTwemojiData, TwemojiItem, TwemojiItemIncluded } from "./types.js";
import { getEntryCldr } from "./utils.js";

interface TwemojiGroupRaw {
	id: string;
	items: TwemojiItemRaw[];
	title: string;
}

type TwemojiItemRaw = Omit<TwemojiItem, "keywords"> & { keywords?: string };

export async function generateTwemoji(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllTwemojiData>> {
	const rawTwemoji = (
		await fs.readFile(path.join(import.meta.dirname, "emoji.yml"))
	).toString();
	const parsed = (await parse(rawTwemoji)) as TwemojiGroupRaw[];

	return Object.fromEntries(
		parsed
			.flatMap((group) =>
				group.items
					.map(
						(item) =>
							({
								...item,
								keywords: item.keywords ? item.keywords.split(",") : undefined,
							}) as TwemojiItem,
					)
					.filter((item) => isIncludedTwemojiItem(item)),
			)
			.map((entry) => [
				getEntryCldr(emojipedia, undefined, entry.unicode, [entry.description]),
				entry,
			]),
	);
}

function isIncludedTwemojiItem(item: TwemojiItem): item is TwemojiItemIncluded {
	return !("exclude_from_picker" in item);
}

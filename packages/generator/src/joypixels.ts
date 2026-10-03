import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllJoyPixelsData, JoyPixelsItem } from "./types.js";
import { fromUnicode, getEntryCldr, recordByCldr } from "./utils.js";

/**
 * One entry of emoji-toolkit's emoji.json, keyed by its code points.
 */
interface RawEntry {
	/** Text emoticons the emoji stands in for, such as "&lt;3" for ❤️. */
	ascii: string[];

	category: string;

	code_points: {
		/** Set only on skin tone variants, to their base emoji's key in the data. */
		diversity_parent: null | string;

		/** Code points in hex, joined by dashes, such as "2764-fe0f". */
		fully_qualified: string;
	};

	/** 0 for the entries JoyPixels' own picker doesn't show. */
	display: number;

	/** Set only on skin tone variants, to the code points of their skin tone. */
	diversity: null | string;

	/** Terms a picker matches searches against, followed by a "uc" tag, such as "uc6". */
	keywords: string[];

	name: string;

	/** Where the emoji falls in JoyPixels' picker order, skin tone variants included. */
	order: number;

	/** Such as ":octopus:". */
	shortname: string;

	/** Such as [":thumbsup:"] for 👍. */
	shortname_alternates: string[];

	unicode_version: number;
}

/**
 * Each keyword list ends with the major part of the emoji's version, as a "uc"
 * tag. That's already `unicodeVersion`, and no one searches for "uc6".
 */
const unicodeVersionTag = /^uc\d+$/;

/**
 * Reads the emoji data from JoyPixels' emoji-toolkit, formerly EmojiOne's.
 *
 * Zoom's Team Chat emoji picker uses this same data: its shortcodes and
 * keywords match emoji-toolkit's exactly, in an order and categories of Zoom's
 * own.
 */
export async function generateJoyPixels(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllJoyPixelsData>> {
	const data = JSON.parse(
		await fs.readFile(
			fileURLToPath(import.meta.resolve("emoji-toolkit/emoji.json")),
			"utf8",
		),
	) as Record<string, RawEntry>;

	const variantKeywords = collectVariantKeywords(data);

	// Skin tone variants' shortcodes and names are mechanical suffixes on their
	// base emoji's, such as "wave_tone3", so only their keywords are kept.
	const entries = Object.entries(data)
		.filter(([, entry]) => !entry.diversity && !isKeycapBase(entry))
		.sort(([, a], [, b]) => a.order - b.order);

	let order = 0;

	return recordByCldr(
		"joypixels",
		entries.map(([key, entry]) => {
			const unicode = entry.code_points.fully_qualified;
			const emoji = fromUnicode(unicode);
			const description = unescapeAmpersands(entry.name);
			const keywords = withoutVersionTags(entry.keywords);

			for (const keyword of variantKeywords.get(key) ?? []) {
				if (!keywords.includes(keyword)) {
					keywords.push(keyword);
				}
			}

			const item: JoyPixelsItem = {
				aliases: entry.shortname_alternates.map(withoutColons),
				description,
				emoji,
				keywords,
				name: withoutColons(entry.shortname),
				unicodeVersion: entry.unicode_version,
			};

			if (entry.ascii.length) {
				item.emoticons = entry.ascii;
			}

			// Entries the picker doesn't show still list a category and order, but
			// they're not where a person using the picker would find them.
			if (entry.display) {
				item.category = entry.category;
				item.order = order++;
			}

			return [getEntryCldr(emojipedia, emoji, [description]), item];
		}),
	);
}

/**
 * Some skin tone variants have keywords their base emoji doesn't, such as
 * "prayer" for each 🤲 variant but not 🤲 itself. Those fold into the base
 * emoji, as macOS's do, in the order the variants first list them.
 */
function collectVariantKeywords(data: Record<string, RawEntry>) {
	const byParent = new Map<string, string[]>();

	for (const entry of Object.values(data)) {
		const parent = entry.code_points.diversity_parent;

		if (!entry.diversity || !parent) {
			continue;
		}

		// Parents are named by their key in the data, which leaves out the joiners
		// and variation selectors of fully qualified code points, such as 261d for ☝️.
		const keywords = byParent.get(parent) ?? [];

		for (const keyword of withoutVersionTags(entry.keywords)) {
			// Variants name their tone as a keyword, such as "light skin tone", which
			// describes the variant rather than the emoji.
			if (!keyword.endsWith("skin tone") && !keywords.includes(keyword)) {
				keywords.push(keyword);
			}
		}

		byParent.set(parent, keywords);
	}

	return byParent;
}

/**
 * The digits, # and * are listed on their own as well as in their keycaps, so
 * that a picker can build the keycaps out of them. On their own they aren't
 * emoji, and JoyPixels' own picker doesn't show them.
 */
function isKeycapBase(entry: RawEntry) {
	return (
		!entry.display &&
		/^00[0-9a-f]{2}-fe0f$/.test(entry.code_points.fully_qualified)
	);
}

/**
 * Ampersands are written as their HTML entity in emoji-toolkit, such as in the
 * name of Trinidad and Tobago's flag, but this data is text.
 */
function unescapeAmpersands(text: string) {
	return text.replaceAll("&amp;", "&");
}

function withoutColons(shortname: string) {
	return shortname.slice(1, -1);
}

function withoutVersionTags(keywords: string[]) {
	return keywords
		.filter((keyword) => !unicodeVersionTag.test(keyword))
		.map(unescapeAmpersands);
}

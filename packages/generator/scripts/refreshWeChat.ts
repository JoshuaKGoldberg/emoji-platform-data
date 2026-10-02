import * as path from "node:path";

import { compareStrings } from "../src/compareStrings.js";
import { WeChatItem } from "../src/dataTypes.js";
import { fetchText } from "./shared/fetch.js";
import { readPreviousSnapshot, writeSnapshot } from "./shared/snapshots.js";
import {
	checkCanaryKeywords,
	checkCounts,
	checkDuplicates,
	countWithKeywords,
	emojiCount,
	emojiWithKeywordsCount,
	throwIfProblems,
} from "./shared/validate.js";
import {
	readCentralDirectory,
	readZipEntries,
	readZipFile,
	ZipEntry,
} from "./shared/zip.js";

/** The picker's category listing, in the order it shows the emoji in. */
interface RawCategories {
	sections: RawSection[];
}

interface RawItem {
	/**
	 * WeChat's own wording for the emoji, such as "笑出眼泪的脸" for 😂.
	 * Left out of the snapshot: these read as translations of the Unicode names
	 * rather than terms anyone would search for, unlike the keywords.
	 */
	desc: string;

	/** The emoji itself, as the picker writes it. */
	key: string;
}

/** The search terms for one emoji, and the glyph the search index writes it as. */
interface RawKeywords {
	emoji: string;
	terms: string[];
}

interface RawSection {
	category_name: string;
	items: RawItem[];
}

interface Snapshot {
	apk: string;
	entries: WeChatItem[];
	source: string;
}

/**
 * Emoji that should always come back, with terms they should always have.
 *
 * The categories and the keywords are separate files joined by glyph, so a term
 * from each script catches the two coming apart as well as either going missing.
 */
const canaryTerms = {
	"❤️": ["love", "爱心"],
	"🎉": ["celebrate", "庆祝"],
	"🐙": ["octopus", "章鱼"],
	"👍": ["good", "赞"],
};

/** The picker's category listing, in picker order. */
const categoriesPath =
	"assets/flutter_assets/packages/new_life/assets/system_emoji_category.json";

/** How much of the zip's tail to read when looking for its central directory. */
const centralDirectoryTailSize = 4096;

/** The page listing the builds Tencent currently ships. */
const defaultSource = "https://weixin.qq.com/";

/**
 * The categories the picker lists, kept as a list rather than read from the
 * data so that one disappearing is caught rather than silently accepted.
 */
const expectedCategories = [
	"人物",
	"动物",
	"活动",
	"物体",
	"符号",
	"自然",
	"表情与手势",
	"食物与饮料",
	"旅行与地点",
];

/** The search index: one row per term, listing what that term matches. */
const keywordsPath =
	"assets/flutter_assets/packages/flutter_mmui/assets/emoji_map.csv";

const minimumEntries = 1500;

/** The smallest category holds eighty emoji, so this is a wide margin. */
const minimumEntriesPerCategory = 50;

/**
 * Some emoji the picker lists aren't in the search index at all, so this is
 * well under the number that are.
 */
const minimumEntriesWithKeywords = 1400;

const snapshotPath = path.join(import.meta.dirname, "../wechat.json");

const source = process.argv[2] ?? defaultSource;

const previous = await readPreviousSnapshot<Snapshot>(snapshotPath);

const apkUrl = source.endsWith(".apk")
	? source
	: pickLatestApk(await fetchText(source));
const apk = new URL(apkUrl).pathname.split("/").at(-1) ?? apkUrl;

// The app is a ~280MB zip, but only two files in it matter. Reading the zip's
// index and then just those two costs under 2MB, so this stays a job any
// machine -or a CI runner- can do on a whim.
const zipEntries = readZipEntries(
	await readCentralDirectory(apkUrl, { tailSize: centralDirectoryTailSize }),
);

const categories = JSON.parse(
	(await readApkFile(categoriesPath)).toString("utf8"),
) as RawCategories;
const keywords = toKeywords((await readApkFile(keywordsPath)).toString("utf8"));

const entries = toEntries(categories, keywords);

validate(entries, previous);

const snapshot: Snapshot = { apk, entries, source };

// Tencent ships a new build every few weeks, and the file name carries its
// version. Rewriting the snapshot for a version bump alone would churn it -and
// open empty refresh pull requests- for data that hasn't changed.
await writeSnapshot({
	details: `, with keywords for ${countWithKeywords(entries).toString()} of them`,
	from: apk,
	previous,
	snapshot,
	snapshotPath,
});

/**
 * Finds a file in the app, insisting it appears exactly once. A name that
 * starts matching twice is as much a sign of the app having moved on as one
 * that stops matching.
 */
function findZipEntry(entries: ZipEntry[], name: string) {
	const matches = entries.filter((entry) => entry.name === name);

	if (matches.length !== 1) {
		throw new Error(
			`Expected exactly one '${name}' in the app, but found ${matches.length.toString()}.`,
		);
	}

	return matches[0];
}

/**
 * Whether a glyph is in a private use area, which WeChat's search index reaches
 * into: it lists Apple's  logo, which is Apple's alone and not a unicode emoji.
 */
function hasPrivateUseCharacter(emoji: string) {
	// Code points are the unit the private use areas are defined in.
	// eslint-disable-next-line @typescript-eslint/no-misused-spread
	return [...emoji].some((character) => {
		const codePoint = character.codePointAt(0) ?? 0;

		return (
			(codePoint >= 0xe000 && codePoint <= 0xf8ff) ||
			(codePoint >= 0xf0000 && codePoint <= 0x10fffd)
		);
	});
}

/**
 * The Android builds a page offers, newest last.
 *
 * Tencent lists several at once, including years-old ones kept for older
 * devices, so these are ordered rather than taken as they come.
 */
function listApkUrls(page: string) {
	const pattern =
		/https:\/\/[\w.-]+\/weixin\/android\/weixin(\d+)android(\d+)(?:_[\w.-]*)?\.apk/g;

	return [...page.matchAll(pattern)]
		.map((match) => ({
			build: Number(match[2]),
			url: match[0],
			version: Number(match[1]),
		}))
		.sort((a, b) => a.version - b.version || a.build - b.build);
}

function pickLatestApk(page: string) {
	const candidates = listApkUrls(page);
	const latest = candidates.at(-1);

	if (!latest) {
		throw new Error(
			`No Android build was listed on the page, so there's nothing to read.`,
		);
	}

	return latest.url;
}

/**
 * Reads one file out of the app.
 */
async function readApkFile(name: string) {
	return await readZipFile(apkUrl, findZipEntry(zipEntries, name));
}

/**
 * Joins the picker's categories to the search index.
 *
 * Both are keyed by glyph, and the two disagree on which emoji they cover: some
 * the picker lists aren't searchable, and many the search knows aren't listed.
 * Everything either one knows is kept, so the picker's order and categories
 * come through without losing the terms.
 */
function toEntries(
	categories: RawCategories,
	keywords: Map<string, RawKeywords>,
) {
	const entries: WeChatItem[] = [];
	const listed = new Set<string>();
	let order = 0;

	for (const section of categories.sections) {
		for (const item of section.items) {
			const position = order;
			order += 1;

			if (hasPrivateUseCharacter(item.key)) {
				continue;
			}

			const key = withoutVariationSelectors(item.key);
			listed.add(key);

			entries.push({
				category: section.category_name,
				emoji: item.key,
				keywords: keywords.get(key)?.terms ?? [],
				order: position,
			});
		}
	}

	const unlisted = [...keywords.values()]
		.filter((keyword) => !listed.has(withoutVariationSelectors(keyword.emoji)))
		.sort((a, b) => compareStrings(a.emoji, b.emoji));

	for (const keyword of unlisted) {
		entries.push({ emoji: keyword.emoji, keywords: keyword.terms });
	}

	return entries;
}

/**
 * Inverts the search index, which is written a term at a time.
 *
 * Each row is a term, then the sticker it matches, then the emoji it matches.
 * Rows that only match a sticker are dropped: those are WeChat's own artwork
 * rather than unicode emoji, so there's nothing to key them by here.
 */
function toKeywords(csv: string) {
	const keywords = new Map<string, RawKeywords>();

	for (const line of csv.split(/\r?\n/)) {
		const afterTerm = line.indexOf(",");
		const afterSticker = line.indexOf(",", afterTerm + 1);

		if (afterTerm === -1 || afterSticker === -1) {
			continue;
		}

		const term = line.slice(0, afterTerm).trim();
		if (!term) {
			continue;
		}

		for (const emoji of line
			.slice(afterSticker + 1)
			.trim()
			.split(/\s+/)) {
			if (!emoji || hasPrivateUseCharacter(emoji)) {
				continue;
			}

			// A joiner only means something between two emoji, and the index has
			// at least one stray one in front of an emoji it belongs to, ‍🦱.
			const glyph = emoji.replaceAll(/^\u200D+|\u200D+$/g, "");
			const key = withoutVariationSelectors(glyph);
			const existing = keywords.get(key);

			if (!existing) {
				keywords.set(key, { emoji: glyph, terms: [term] });
			} else if (!existing.terms.includes(term)) {
				existing.terms.push(term);
			}
		}
	}

	return keywords;
}

function validate(entries: WeChatItem[], previous: Snapshot | undefined) {
	const problems = checkCounts(entries, previous?.entries, [
		{ ...emojiCount, minimum: minimumEntries },
		{ ...emojiWithKeywordsCount, minimum: minimumEntriesWithKeywords },
	]);

	for (const category of expectedCategories) {
		const count = entries.filter((entry) => entry.category === category).length;

		if (count < minimumEntriesPerCategory) {
			problems.push(
				`Category '${category}' has ${count.toString()} emoji, out of at least ${minimumEntriesPerCategory.toString()} expected.`,
			);
		}
	}

	checkCanaryKeywords(
		problems,
		entries,
		canaryTerms,
		withoutVariationSelectors,
	);
	checkDuplicates(problems, entries, withoutVariationSelectors);

	const empty = entries.filter(
		(entry) => !entry.keywords.length && entry.category === undefined,
	);

	if (empty.length) {
		problems.push(
			`${empty.length.toString()} emoji have neither a category nor keywords, such as ${empty[0].emoji}.`,
		);
	}

	throwIfProblems(problems, "for WeChat");
}

/**
 * Sources disagree on whether to include variation selectors: the search index
 * writes ❤️ as U+2764 U+FE0F, while the picker's listing has U+2764.
 */
function withoutVariationSelectors(emoji: string) {
	return emoji.replaceAll("️", "");
}

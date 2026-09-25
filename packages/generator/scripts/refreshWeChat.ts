import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as zlib from "node:zlib";

import { WeChatItem } from "../src/dataTypes.js";

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

/** Where one file sits inside the remote zip, and how it's compressed. */
interface ZipEntry {
	compressedSize: number;
	method: number;
	offset: number;
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

const previous = await readPreviousSnapshot();

const apkUrl = source.endsWith(".apk")
	? source
	: pickLatestApk(await fetchText(source));
const apk = new URL(apkUrl).pathname.split("/").at(-1) ?? apkUrl;

// The app is a ~280MB zip, but only two files in it matter. Reading the zip's
// index and then just those two costs under 2MB, so this stays a job any
// machine -or a CI runner- can do on a whim.
const centralDirectory = await readCentralDirectory(apkUrl);

const categories = JSON.parse(
	(await readZipFile(apkUrl, centralDirectory, categoriesPath)).toString(
		"utf8",
	),
) as RawCategories;
const keywords = toKeywords(
	(await readZipFile(apkUrl, centralDirectory, keywordsPath)).toString("utf8"),
);

const entries = toEntries(categories, keywords);

validate(entries, previous);

const snapshot: Snapshot = { apk, entries, source };

// Tencent ships a new build every few weeks, and the file name carries its
// version. Rewriting the snapshot for a version bump alone would churn it -and
// open empty refresh pull requests- for data that hasn't changed.
if (previous && isSameData(previous.entries, entries)) {
	console.log(
		`Read ${entries.length.toString()} emoji from ${apk}, unchanged from the snapshot.`,
	);
} else {
	await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");
	console.log(
		`Wrote ${entries.length.toString()} emoji from ${apk}, with keywords for ${countWithKeywords(entries).toString()} of them.`,
	);
}

function countWithKeywords(entries: WeChatItem[]) {
	return entries.filter((entry) => entry.keywords.length).length;
}

async function fetchRange(url: string, start: number, end: number) {
	const response = await fetch(url, {
		headers: { Range: `bytes=${start.toString()}-${end.toString()}` },
	});

	// A server that ignores the range answers 200 with the whole file, which
	// would be a ~280MB surprise rather than the slice being asked for.
	if (response.status !== 206) {
		throw new Error(
			`Expected a partial response from ${url}, but got ${response.status.toString()} ${response.statusText}.`,
		);
	}

	return Buffer.from(await response.arrayBuffer());
}

async function fetchText(url: string) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Could not fetch ${url}: ${response.status.toString()} ${response.statusText}.`,
		);
	}

	return await response.text();
}

/**
 * Finds a file in the zip's central directory, insisting it appears exactly
 * once. A name that starts matching twice is as much a sign of the app having
 * moved on as one that stops matching.
 */
function findZipEntry(centralDirectory: Buffer, name: string): ZipEntry {
	const matches: ZipEntry[] = [];
	let position = 0;

	while (
		position + 46 <= centralDirectory.length &&
		centralDirectory.readUInt32LE(position) === 0x02014b50
	) {
		const nameLength = centralDirectory.readUInt16LE(position + 28);
		const extraLength = centralDirectory.readUInt16LE(position + 30);
		const commentLength = centralDirectory.readUInt16LE(position + 32);

		const found = centralDirectory
			.subarray(position + 46, position + 46 + nameLength)
			.toString("utf8");

		if (found === name) {
			matches.push({
				compressedSize: centralDirectory.readUInt32LE(position + 20),
				method: centralDirectory.readUInt16LE(position + 10),
				offset: centralDirectory.readUInt32LE(position + 42),
			});
		}

		position += 46 + nameLength + extraLength + commentLength;
	}

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

function isSameData(left: WeChatItem[], right: WeChatItem[]) {
	return JSON.stringify(left) === JSON.stringify(right);
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
 * Reads the zip's index: the tail holds a record saying where the central
 * directory is, and the central directory says where every file in it is.
 */
async function readCentralDirectory(url: string) {
	const head = await fetch(url, { method: "HEAD" });
	if (!head.ok) {
		throw new Error(
			`Could not reach ${url}: ${head.status.toString()} ${head.statusText}.`,
		);
	}

	const size = Number(head.headers.get("content-length"));
	if (!size) {
		throw new Error(`${url} didn't say how large it is.`);
	}

	const tail = await fetchRange(
		url,
		Math.max(0, size - centralDirectoryTailSize),
		size - 1,
	);
	const end = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));

	if (end === -1) {
		throw new Error(`${url} doesn't end like a zip file.`);
	}

	const directorySize = tail.readUInt32LE(end + 12);
	const directoryOffset = tail.readUInt32LE(end + 16);

	// Either field reading as all-ones means the real value is in a Zip64
	// record elsewhere, which this doesn't go looking for.
	if (directorySize === 0xffffffff || directoryOffset === 0xffffffff) {
		throw new Error(
			`${url} is a Zip64 archive, which this script can't index.`,
		);
	}

	if (directoryOffset + directorySize > size) {
		throw new Error(`${url} has a central directory that runs past its end.`);
	}

	return await fetchRange(
		url,
		directoryOffset,
		directoryOffset + directorySize - 1,
	);
}

async function readPreviousSnapshot() {
	try {
		return JSON.parse(await fs.readFile(snapshotPath, "utf8")) as Snapshot;
	} catch {
		return undefined;
	}
}

/**
 * Reads one file out of the remote zip.
 *
 * The central directory says where a file's local header is, but not how long
 * that header is, so the header is read first to find where its data starts.
 */
async function readZipFile(
	url: string,
	centralDirectory: Buffer,
	name: string,
) {
	const entry = findZipEntry(centralDirectory, name);

	const header = await fetchRange(url, entry.offset, entry.offset + 29);
	const start =
		entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);

	const compressed = await fetchRange(
		url,
		start,
		start + entry.compressedSize - 1,
	);

	switch (entry.method) {
		case 0:
			return compressed;
		case 8:
			return zlib.inflateRawSync(compressed);
		default:
			throw new Error(
				`'${name}' is compressed with method ${entry.method.toString()}, which this script can't read.`,
			);
	}
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
		.sort((a, b) => a.emoji.localeCompare(b.emoji));

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

			const key = withoutVariationSelectors(emoji);
			const existing = keywords.get(key);

			if (!existing) {
				keywords.set(key, { emoji, terms: [term] });
			} else if (!existing.terms.includes(term)) {
				existing.terms.push(term);
			}
		}
	}

	return keywords;
}

function validate(entries: WeChatItem[], previous: Snapshot | undefined) {
	const problems: string[] = [];

	if (entries.length < minimumEntries) {
		problems.push(
			`Only ${entries.length.toString()} emoji were read, out of at least ${minimumEntries.toString()} expected.`,
		);
	}

	const withKeywords = countWithKeywords(entries);

	if (withKeywords < minimumEntriesWithKeywords) {
		problems.push(
			`Only ${withKeywords.toString()} emoji have keywords, out of at least ${minimumEntriesWithKeywords.toString()} expected.`,
		);
	}

	if (previous) {
		if (entries.length < previous.entries.length * 0.95) {
			problems.push(
				`Emoji count fell from ${previous.entries.length.toString()} to ${entries.length.toString()}, more than refreshing should change it.`,
			);
		}

		const before = countWithKeywords(previous.entries);

		if (withKeywords < before * 0.95) {
			problems.push(
				`Emoji with keywords fell from ${before.toString()} to ${withKeywords.toString()}, more than refreshing should change it.`,
			);
		}
	}

	for (const category of expectedCategories) {
		const count = entries.filter((entry) => entry.category === category).length;

		if (count < minimumEntriesPerCategory) {
			problems.push(
				`Category '${category}' has ${count.toString()} emoji, out of at least ${minimumEntriesPerCategory.toString()} expected.`,
			);
		}
	}

	for (const [emoji, terms] of Object.entries(canaryTerms)) {
		const entry = entries.find(
			(candidate) =>
				withoutVariationSelectors(candidate.emoji) ===
				withoutVariationSelectors(emoji),
		);

		if (!entry) {
			problems.push(`${emoji} is missing entirely.`);
			continue;
		}

		for (const term of terms) {
			if (!entry.keywords.includes(term)) {
				problems.push(`${emoji} no longer lists the keyword '${term}'.`);
			}
		}
	}

	const seen = new Set<string>();
	const duplicates = entries.filter((entry) => {
		const key = withoutVariationSelectors(entry.emoji);
		const isDuplicate = seen.has(key);
		seen.add(key);
		return isDuplicate;
	});

	if (duplicates.length) {
		problems.push(
			`${duplicates.length.toString()} emoji are listed more than once, such as ${duplicates[0].emoji}.`,
		);
	}

	const empty = entries.filter(
		(entry) => !entry.keywords.length && entry.category === undefined,
	);

	if (empty.length) {
		problems.push(
			`${empty.length.toString()} emoji have neither a category nor keywords, such as ${empty[0].emoji}.`,
		);
	}

	if (problems.length) {
		throw new Error(
			[
				"The data read for WeChat doesn't look right, so the snapshot wasn't written:",
				...problems.map((problem) => `  ${problem}`),
			].join("\n"),
		);
	}
}

/**
 * Sources disagree on whether to include variation selectors: the search index
 * writes ❤️ as U+2764 U+FE0F, while the picker's listing has U+2764.
 */
function withoutVariationSelectors(emoji: string) {
	return emoji.replaceAll("️", "");
}

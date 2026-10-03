import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GnomeItem } from "../src/dataTypes.js";

/** One emoji as a locale's data file lists it. */
interface RawItem {
	emoji: string;

	/** The picker section the emoji is in, as the Emojibase group number `categories` is keyed by. */
	group: number;

	/** The emoji's name in English, such as "octopus". */
	nameEnglish: string;

	/** The emoji's name in the file's locale. */
	nameLocal: string;

	/** The emoji's keywords in English. */
	keywordsEnglish: string[];

	/** The emoji's keywords in the file's locale. */
	keywordsLocal: string[];
}

interface Snapshot {
	entries: GnomeItem[];
	gtk: string;
	locales: string[];
}

/**
 * The picker's sections, in the order it shows them, as its own headings name
 * them. Emojibase's group 2 is the skin tone and hair components, which the
 * picker doesn't show.
 */
const categories = new Map([
	[0, "Smileys & People"],
	[1, "Body & Clothing"],
	[3, "Animals & Nature"],
	[4, "Food & Drink"],
	[5, "Travel & Places"],
	[6, "Activities"],
	[7, "Objects"],
	[8, "Symbols"],
	[9, "Flags"],
]);

/**
 * Emoji that should always come back, with terms they should always have in
 * English and in another locale, so that a locale's data going missing or
 * coming apart from the English is caught as well as the English going missing.
 */
const canaryTerms = {
	"🎉": { keyword: "庆祝", locale: "zh", name: "拉炮彩带" },
	"🐙": { keyword: "tintenfisch", locale: "de", name: "Oktopus" },
	"👍": { keyword: "jawohl", locale: "de", name: "Daumen hoch" },
	"😂": { keyword: "爆笑", locale: "ja", name: "嬉し泣き" },
};

/** The locales GTK translates its emoji into, beyond the English source. */
const expectedLocales = [
	"bn",
	"da",
	"de",
	"es",
	"et",
	"fi",
	"fr",
	"hi",
	"hu",
	"it",
	"ja",
	"ko",
	"lt",
	"ms",
	"nb",
	"nl",
	"pl",
	"pt",
	"ru",
	"sv",
	"th",
	"uk",
	"vi",
	"zh",
];

const gitlabProject = "https://gitlab.gnome.org/api/v4/projects/GNOME%2Fgtk";

const maximumConcurrentFetches = 5;

const minimumEntries = 1800;

/** The smallest section, Activities, holds eighty emoji, so this is a wide margin. */
const minimumEntriesPerCategory = 50;

const minimumEntriesWithKeywords = 1800;

const requestTimeout = 60_000;

const snapshotPath = path.join(import.meta.dirname, "../gnome.json");

/** The locale the English data is in, which is also every file's fallback. */
const sourceLocale = "en";

const previous = await readPreviousSnapshot();

const tag = process.argv[2] ?? (await pickLatestStableTag());
const files = await listDataFiles(tag);

const byLocale = new Map(
	await mapConcurrently(
		[...files],
		maximumConcurrentFetches,
		async ([locale, file]) =>
			[locale, readEmojiData(await fetchBuffer(rawUrl(tag, file)))] as const,
	),
);

const english = byLocale.get(sourceLocale);

if (!english) {
	throw new Error(`GTK ${tag} has no ${sourceLocale}.data.`);
}

byLocale.delete(sourceLocale);

const locales = [...byLocale.keys()].sort();
const entries = toEntries(english, byLocale);

validate(entries, locales, previous);

const snapshot: Snapshot = { entries, gtk: tag, locales };

// GTK tags a release every few weeks, but its emoji data only changes when
// someone regenerates it from a new CLDR, which is about once a year.
// Rewriting the snapshot for a new tag alone would churn it -and open empty
// refresh pull requests- for data that hasn't changed.
if (
	previous &&
	isSameData(previous.entries, entries) &&
	isSameData(previous.locales, locales)
) {
	console.log(
		`Read ${entries.length.toString()} emoji from GTK ${tag}, unchanged from the snapshot.`,
	);
} else {
	await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");
	console.log(
		`Wrote ${entries.length.toString()} emoji from GTK ${tag}, with keywords for ${countWithKeywords(entries).toString()} of them, in ${(locales.length + 1).toString()} locales.`,
	);
}

function alignUp(position: number, alignment: number) {
	return Math.ceil(position / alignment) * alignment;
}

function countWithKeywords(entries: GnomeItem[]) {
	return entries.filter((entry) => entry.keywords.length).length;
}

async function fetchBuffer(url: string) {
	const response = await fetch(url, {
		signal: AbortSignal.timeout(requestTimeout),
	});
	if (!response.ok) {
		throw new Error(
			`Could not fetch ${url}: ${response.status.toString()} ${response.statusText}.`,
		);
	}

	return Buffer.from(await response.arrayBuffer());
}

async function fetchJson<T>(url: string) {
	return JSON.parse((await fetchBuffer(url)).toString("utf8")) as T;
}

function isSameData(left: unknown, right: unknown) {
	return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * The emoji data files at a tag, keyed by their locale.
 */
async function listDataFiles(tag: string) {
	const tree = await fetchJson<{ name: string; path: string }[]>(
		`${gitlabProject}/repository/tree?path=gtk/emoji&ref=${encodeURIComponent(tag)}&per_page=100`,
	);

	return new Map(
		tree
			.filter((file) => file.name.endsWith(".data"))
			.map((file) => [file.name.slice(0, -".data".length), file.path]),
	);
}

async function mapConcurrently<Item, Result>(
	items: Item[],
	limit: number,
	callback: (item: Item) => Promise<Result>,
) {
	const results: Result[] = [];
	let next = 0;

	await Promise.all(
		Array.from({ length: limit }, async () => {
			while (next < items.length) {
				const index = next++;
				results[index] = await callback(items[index]);
			}
		}),
	);

	return results;
}

/**
 * The newest stable GTK 4 release. GTK numbers its development releases with
 * an odd minor version, such as 4.23.4, and its stable ones with an even one.
 */
async function pickLatestStableTag() {
	const tags = await fetchJson<{ name: string }[]>(
		`${gitlabProject}/repository/tags?search=${encodeURIComponent("^4.")}&per_page=100`,
	);

	const stable = tags
		.flatMap(({ name }) => {
			const match = /^4\.(\d+)\.(\d+)$/.exec(name);

			return match && Number(match[1]) % 2 === 0
				? [{ minor: Number(match[1]), name, patch: Number(match[2]) }]
				: [];
		})
		.sort((a, b) => a.minor - b.minor || a.patch - b.patch);

	const latest = stable.at(-1);

	if (!latest) {
		throw new Error("GitLab listed no stable GTK 4 releases.");
	}

	return latest.name;
}

function rawUrl(tag: string, file: string) {
	return `https://gitlab.gnome.org/GNOME/gtk/-/raw/${encodeURIComponent(tag)}/${file}`;
}

/**
 * Reads one locale's emoji data, a GVariant of type a(aussasasu).
 *
 * GVariant writes a container's members back to back, each aligned for its
 * type, then the offsets where each variable-size member ends, sized by how
 * large the container is. Arrays list those offsets in order, and tuples list
 * them in reverse, leaving out the last member's when it's fixed size.
 * @see https://docs.gtk.org/glib/gvariant-format-strings.html
 */
function readEmojiData(data: Buffer) {
	return splitVariableArray(data, 4).map((item): RawItem => {
		const [codePoints, nameEnglish, nameLocal, keywordsEnglish, keywordsLocal] =
			splitTuple(item, [4, 1, 1, 1, 1]);
		const group = item.readUInt32LE(alignUp(endOfTupleMembers(item, 5), 4));

		return {
			emoji: toEmoji(codePoints),
			group,
			keywordsEnglish: splitVariableArray(keywordsEnglish, 1).map(readString),
			keywordsLocal: splitVariableArray(keywordsLocal, 1).map(readString),
			nameEnglish: readString(nameEnglish),
			nameLocal: readString(nameLocal),
		};
	});
}

async function readPreviousSnapshot() {
	try {
		return JSON.parse(await fs.readFile(snapshotPath, "utf8")) as Snapshot;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			throw error;
		}

		return undefined;
	}
}

/** Where the last of a tuple's variable-size members ends. */
function endOfTupleMembers(tuple: Buffer, count: number) {
	const size = offsetSize(tuple.length);

	return tuple.readUIntLE(tuple.length - size * count, size);
}

/** How many bytes a container of this size writes each of its offsets in. */
function offsetSize(containerSize: number) {
	return containerSize <= 0xff ? 1 : containerSize <= 0xffff ? 2 : 4;
}

function readString(bytes: Buffer) {
	if (bytes.at(-1) !== 0) {
		throw new Error("Found a string that isn't null-terminated.");
	}

	return bytes.toString("utf8", 0, bytes.length - 1);
}

function splitTuple(tuple: Buffer, alignments: number[]) {
	const size = offsetSize(tuple.length);
	const members: Buffer[] = [];
	let start = 0;

	for (let index = 0; index < alignments.length; index += 1) {
		start = alignUp(start, alignments[index]);

		const end = tuple.readUIntLE(tuple.length - size * (index + 1), size);
		members.push(tuple.subarray(start, end));
		start = end;
	}

	return members;
}

function splitVariableArray(array: Buffer, alignment: number) {
	if (!array.length) {
		return [];
	}

	const size = offsetSize(array.length);
	const offsetsStart = array.readUIntLE(array.length - size, size);

	// The last offset is where the last element ends, which is where the
	// offsets themselves begin, so it also says how many there are.
	if ((array.length - offsetsStart) % size) {
		throw new Error("Found an array whose offsets don't divide evenly.");
	}

	const elements: Buffer[] = [];
	let start = 0;

	for (let position = offsetsStart; position < array.length; position += size) {
		start = alignUp(start, alignment);

		const end = array.readUIntLE(position, size);
		elements.push(array.subarray(start, end));
		start = end;
	}

	return elements;
}

/**
 * GTK lists each emoji once, marking those with skin tone variants by where
 * their tone would go: U+1F3FB when the plain emoji drops it, or 0 when the
 * plain emoji needs an emoji presentation selector in its place.
 */
function toEmoji(codePoints: Buffer) {
	const glyph: number[] = [];

	for (let position = 0; position < codePoints.length; position += 4) {
		const codePoint = codePoints.readUInt32LE(position);

		if (codePoint === 0) {
			glyph.push(0xfe0f);
		} else if (codePoint !== 0x1f3fb) {
			glyph.push(codePoint);
		}
	}

	return String.fromCodePoint(...glyph);
}

/**
 * Joins each locale's data to the English data.
 *
 * GTK regenerates each locale's data from the same Emojibase release, but not
 * always all at once, so some locales can know emoji the English data doesn't.
 * Those keep the English that the locale's own data carries, as GTK's search
 * in that locale does, but have no `order`, since the English picker doesn't
 * show them.
 *
 * Newer locales' data also writes some emoji as the template for their skin
 * tone variants, such as 👯‍♂️ as 👨🏻‍🐰‍👨🏻, which is no emoji once its tones are
 * dropped, so a locale's emoji the English data doesn't know by glyph are
 * joined to the English emoji of the same English name.
 */
function toEntries(english: RawItem[], byLocale: Map<string, RawItem[]>) {
	const entries = new Map<string, GnomeItem>();
	let order = 0;

	const shown = english
		.map((item, index) => ({ index, item }))
		.filter(({ item }) => categories.has(item.group))
		.sort((a, b) => a.item.group - b.item.group || a.index - b.index)
		.map(({ item }) => item);

	for (const item of shown) {
		entries.set(item.emoji, {
			category: categories.get(item.group),
			emoji: item.emoji,
			keywords: item.keywordsEnglish,
			keywordsByLocale: {},
			name: item.nameEnglish,
			namesByLocale: {},
			order: order++,
		});
	}

	for (const item of english) {
		if (!entries.has(item.emoji)) {
			entries.set(item.emoji, {
				emoji: item.emoji,
				keywords: item.keywordsEnglish,
				keywordsByLocale: {},
				name: item.nameEnglish,
				namesByLocale: {},
			});
		}
	}

	const englishByName = new Map(
		english.map((item) => [item.nameEnglish, item.emoji]),
	);

	for (const locale of [...byLocale.keys()].sort()) {
		for (const item of byLocale.get(locale) ?? []) {
			let entry =
				entries.get(item.emoji) ??
				entries.get(englishByName.get(item.nameEnglish) ?? "");

			if (!entry) {
				entry = {
					category: categories.get(item.group),
					emoji: item.emoji,
					keywords: item.keywordsEnglish,
					keywordsByLocale: {},
					name: item.nameEnglish,
					namesByLocale: {},
				};
				entries.set(item.emoji, entry);
			}

			entry.keywordsByLocale[locale] = item.keywordsLocal;
			entry.namesByLocale[locale] = item.nameLocal;
		}
	}

	return [...entries.values()];
}

function validate(
	entries: GnomeItem[],
	locales: string[],
	previous: Snapshot | undefined,
) {
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

	for (const category of categories.values()) {
		const count = entries.filter((entry) => entry.category === category).length;

		if (count < minimumEntriesPerCategory) {
			problems.push(
				`Category '${category}' has ${count.toString()} emoji, out of at least ${minimumEntriesPerCategory.toString()} expected.`,
			);
		}
	}

	for (const locale of expectedLocales) {
		if (!locales.includes(locale)) {
			problems.push(`Locale '${locale}' is missing.`);
			continue;
		}

		const translated = entries.filter(
			(entry) => entry.namesByLocale[locale],
		).length;

		if (translated < entries.length * 0.95) {
			problems.push(
				`Only ${translated.toString()} of ${entries.length.toString()} emoji have a name in '${locale}'.`,
			);
		}
	}

	for (const [emoji, canary] of Object.entries(canaryTerms)) {
		const entry = entries.find((candidate) => candidate.emoji === emoji);

		if (!entry) {
			problems.push(`${emoji} is missing entirely.`);
			continue;
		}

		if (!entry.keywords.length) {
			problems.push(`${emoji} no longer has English keywords.`);
		}

		if (entry.namesByLocale[canary.locale] !== canary.name) {
			problems.push(
				`${emoji} is no longer named '${canary.name}' in '${canary.locale}'.`,
			);
		}

		if (
			!(canary.locale in entry.keywordsByLocale) ||
			!entry.keywordsByLocale[canary.locale].includes(canary.keyword)
		) {
			problems.push(
				`${emoji} no longer lists the keyword '${canary.keyword}' in '${canary.locale}'.`,
			);
		}
	}

	if (problems.length) {
		throw new Error(
			[
				"The data read for GNOME doesn't look right, so the snapshot wasn't written:",
				...problems.map((problem) => `  ${problem}`),
			].join("\n"),
		);
	}
}

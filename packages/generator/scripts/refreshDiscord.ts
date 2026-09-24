import * as fs from "node:fs/promises";
import * as path from "node:path";

import { DiscordItem } from "../src/dataTypes.js";

interface RawData {
	emojis: RawEmoji[];

	/** Each category's `[start, end)` range of indices into `emojis`. */
	emojisByCategory: Record<string, [number, number]>;
}

interface RawEmoji {
	/** Set only on skin tone variants of another emoji, and only ever to `true`. */
	hasDiversityParent?: true;

	/** Set only on skin tone variants of another emoji, and only ever to `true`. */
	hasMultiDiversityParent?: true;

	names: string[];
	surrogates: string;
	unicodeVersion: number;
}

/** Search keywords, keyed by the emoji's first name. */
type RawKeywords = Record<string, string[]>;

interface Snapshot {
	dataChunk: string;
	entries: DiscordItem[];
	keywordChunk: string;
	locale: string;
	source: string;
}

/**
 * Emoji that should always come back, with a shortcode and a keyword they
 * should always have.
 *
 * The keywords live in a different script than the emoji, and are matched up by
 * name, so these catch the two coming apart as well as either going missing.
 */
const canaryTerms = {
	"❤️": { keyword: "love", name: "heart" },
	"🎉": { keyword: "celebrate", name: "tada" },
	"🐙": { keyword: "creature", name: "octopus" },
	"👍": { keyword: "like", name: "thumbsup" },
};

/**
 * The page listing the scripts the web client loads.
 */
const defaultSource = "https://discord.com/app";

/**
 * The categories the picker lists, kept as a list rather than read from the
 * data so that one disappearing is caught rather than silently accepted.
 */
const expectedCategories = [
	"activity",
	"flags",
	"food",
	"nature",
	"objects",
	"people",
	"symbols",
	"travel",
];

/**
 * The locale whose keywords this package uses.
 * Discord ships a set per locale; this package is English-only, as macOS is.
 */
const locale = "en-US";

/** The smallest category holds over a hundred emoji, so this is a wide margin. */
const minimumEntriesPerCategory = 50;

const minimumEntries = 1500;

/**
 * Flags and a few sequences have no keywords at all, so this is well under the
 * number that do.
 */
const minimumEntriesWithKeywords = 1200;

/** Where the emoji data starts inside whichever script carries it. */
const dataPrefix = `JSON.parse('{"emojis":[`;

/** Where the keywords start inside the script for a locale. */
const keywordsPrefix = `JSON.parse('{"`;

/** The chunk Discord splits its emoji data into, when it still names it that. */
const dataChunkPrefix = "vnd-emoji.";

/** The chunk holding the client itself, when it still names it that. */
const clientChunkPrefix = "web.";

/**
 * The method the emoji store searches with, used to find the client script and,
 * within it, the module that loads the keywords.
 */
const searchMethod = "nameMatchesChain";

const snapshotPath = path.join(import.meta.dirname, "../discord.json");

const source = process.argv[2] ?? defaultSource;
const origin = new URL(source).origin;

const previous = await readPreviousSnapshot();

const page = await fetchText(source);
const scripts = listScripts(page);

const { chunk: dataChunk, data } = await readEmojiData();
const { chunk: keywordChunk, keywords } = await readKeywords();

const entries = toEntries(data, keywords);

validate(entries, previous);

const snapshot: Snapshot = {
	dataChunk,
	entries,
	keywordChunk,
	locale,
	source,
};

// Discord redeploys constantly, and every deploy renames the chunks. Rewriting
// the file for a rename alone would churn it -and open empty refresh pull
// requests- for data that hasn't changed.
if (previous && isSameData(previous.entries, entries)) {
	console.log(
		`Read ${entries.length.toString()} emoji from ${dataChunk}, unchanged from the snapshot.`,
	);
} else {
	await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");
	console.log(
		`Wrote ${entries.length.toString()} emoji from ${dataChunk}, with keywords for ${countWithKeywords(entries).toString()} of them from ${keywordChunk}.`,
	);
}

function countWithKeywords(entries: DiscordItem[]) {
	return entries.filter((entry) => entry.keywords.length).length;
}

/**
 * Pulls a JSON blob out of a script, as the JavaScript string literal it's
 * embedded in rather than by matching its shape, so that a new field or a
 * reordering of the existing ones doesn't need this to change.
 */
function extractJson(script: string, prefix: string) {
	const start = script.indexOf(prefix);
	if (start === -1) {
		return undefined;
	}

	// The literal is single quoted, so its end is the first unescaped quote.
	const open = script.indexOf("'", start) + 1;
	let end = open;

	while (end < script.length && script[end] !== "'") {
		end += script[end] === "\\" ? 2 : 1;
	}

	if (end >= script.length) {
		throw new Error(
			`Found a blob starting with ${prefix}, but it never ended.`,
		);
	}

	const literal = script
		.slice(open, end)
		// The only escapes the bundler emits that JSON doesn't share.
		.replaceAll("\\'", "'")
		.replaceAll(/\\x([0-9a-fA-F]{2})/g, "\\u00$1");

	return JSON.parse(literal) as unknown;
}

async function fetchScript(chunk: string) {
	return await fetchText(`${origin}/assets/${chunk}`);
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
 * Finds a value in the script, insisting it appears exactly once.
 *
 * These all read minified code that nothing promises to keep stable. A pattern
 * that starts matching twice is as much a sign of that code having moved on as
 * one that stops matching, and quietly taking the first of two would be a
 * coin flip.
 */
function findOnly(script: string, pattern: RegExp, description: string) {
	const matches = [...script.matchAll(pattern)].map((match) => match[1]);

	if (matches.length !== 1) {
		throw new Error(
			`Expected exactly one ${description} in the client script, but found ${matches.length.toString()}.`,
		);
	}

	return matches[0];
}

function isSameData(left: DiscordItem[], right: DiscordItem[]) {
	return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * The scripts a page loads, in the order it lists them.
 */
function listScripts(page: string) {
	const scripts = [
		...new Set(
			[...page.matchAll(/\/assets\/([\w.-]+\.js)/g)].map((match) => match[1]),
		),
	];

	if (!scripts.length) {
		throw new Error(`No scripts were listed by ${source}.`);
	}

	return scripts;
}

/**
 * Reads the scripts a page lists, starting with the ones named as expected.
 *
 * Discord splits the client and the emoji data into chunks it names, which is
 * what this looks for first. Those names are Discord's to change, so a miss
 * falls back to reading every script, which is slower but doesn't depend on
 * the names at all.
 */
async function readChunk<Data>(
	prefix: string,
	description: string,
	read: (script: string) => Data | undefined,
): Promise<{ chunk: string; data: Data }> {
	const named = scripts.filter((script) => script.startsWith(prefix));
	const ordered = [
		...named,
		...scripts.filter((script) => !named.includes(script)),
	];

	for (const chunk of ordered) {
		const data = read(await fetchScript(chunk));

		if (data !== undefined) {
			return { chunk, data };
		}
	}

	throw new Error(
		`None of the ${scripts.length.toString()} scripts listed by ${source} contained ${description}.`,
	);
}

async function readEmojiData() {
	return await readChunk(
		dataChunkPrefix,
		"emoji data",
		(script) => extractJson(script, dataPrefix) as RawData | undefined,
	);
}

/**
 * Reads the keywords the picker searches on, which take three hops to reach.
 *
 * The emoji data itself holds only shortcodes. The keywords are a separate set
 * per locale, in a chunk loaded on demand, so the client script has to be read
 * to find out which chunk that is: the emoji store's search method matches
 * against a lookup whose module maps each locale to a chunk id, and the
 * bundler's own chunk-to-file map turns that id into a file name.
 */
async function readKeywords() {
	const { chunk, data: client } = await readChunk(
		clientChunkPrefix,
		"the emoji store",
		(script) => (script.includes(searchMethod) ? script : undefined),
	);

	const module = findOnly(
		searchModule(client),
		/n\((\d+)\)\.\w+\[e\]/g,
		"reference to the keyword modules",
	);

	const chunkId = findOnly(
		client,
		RegExp(
			`\\b${module}\\(e,t,n\\)\\{.*?"${locale}":\\(\\)=>n\\.e\\("(\\d+)"\\)`,
			"gs",
		),
		`chunk id for the ${locale} keywords`,
	);

	const fileName = findOnly(
		client,
		RegExp(`[,{]${chunkId}:"([0-9a-f]+)"`, "g"),
		`file name for chunk ${chunkId}`,
	);

	const keywords = extractJson(
		await fetchScript(`${fileName}.js`),
		keywordsPrefix,
	) as RawKeywords | undefined;

	if (!keywords) {
		throw new Error(
			`The ${locale} keyword chunk, ${fileName}.js, didn't contain keywords.`,
		);
	}

	console.log(`Found the emoji store in ${chunk}.`);

	return { chunk: `${fileName}.js`, keywords };
}

async function readPreviousSnapshot() {
	try {
		return JSON.parse(await fs.readFile(snapshotPath, "utf8")) as Snapshot;
	} catch {
		return undefined;
	}
}

/**
 * Narrows the client script to the module its emoji search lives in, so that
 * the reference being looked for there can't be some other module's.
 */
function searchModule(client: string) {
	const index = client.indexOf(searchMethod);
	const headers = [...client.matchAll(/\b\d{4,7}\(e,t,n\)\{"use strict"/g)].map(
		(header) => header.index,
	);
	const start = headers.filter((header) => header < index).at(-1) ?? 0;
	const end = headers.find((header) => header > index);

	return client.slice(start, end);
}

/**
 * Keeps the emoji the picker lists, which are the ones a category covers.
 *
 * The data also carries every skin tone variant of those, but only to route
 * shortcodes like `wave_tone3` to them. Those names are mechanical suffixes on
 * the base emoji's, so there's nothing in them to fold back in, and keeping
 * them would give one emoji a tone axis nothing else in the data set has.
 */
function toEntries(
	{ emojis, emojisByCategory }: RawData,
	keywords: RawKeywords,
) {
	const entries: DiscordItem[] = [];

	for (const [category, [start, end]] of Object.entries(emojisByCategory)) {
		if (end > emojis.length) {
			throw new Error(
				`Category '${category}' runs to index ${end.toString()}, but only ${emojis.length.toString()} emoji were read.`,
			);
		}

		for (let order = start; order < end; order += 1) {
			const emoji = emojis[order];

			if (emoji.hasDiversityParent ?? emoji.hasMultiDiversityParent) {
				continue;
			}

			const [name, ...aliases] = emoji.names;

			entries.push({
				aliases,
				category,
				emoji: emoji.surrogates,
				keywords: keywords[name] ?? [],
				name,
				order,
				unicodeVersion: emoji.unicodeVersion,
			});
		}
	}

	return entries.sort((a, b) => a.order - b.order);
}

/**
 * Refuses to write data that doesn't look like Discord's emoji list.
 *
 * Nothing here is a supported API: it's two blobs inside a bundle that Discord
 * rebuilds many times a day, reached by reading its minified code. A refresh
 * that followed that trail to the wrong place, or only part of the way,
 * shouldn't overwrite the snapshot with what it found.
 */
function validate(entries: DiscordItem[], previous: Snapshot | undefined) {
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

	for (const [emoji, { keyword, name }] of Object.entries(canaryTerms)) {
		const entry = entries.find((candidate) => candidate.emoji === emoji);

		if (!entry) {
			problems.push(`${emoji} is missing entirely.`);
			continue;
		}

		if (![entry.name, ...entry.aliases].includes(name)) {
			problems.push(`${emoji} no longer lists the shortcode '${name}'.`);
		}

		if (!entry.keywords.includes(keyword)) {
			problems.push(`${emoji} no longer lists the keyword '${keyword}'.`);
		}
	}

	const seen = new Set<string>();
	const duplicates = entries.filter((entry) => {
		const isDuplicate = seen.has(entry.emoji);
		seen.add(entry.emoji);
		return isDuplicate;
	});

	if (duplicates.length) {
		problems.push(
			`${duplicates.length.toString()} emoji are listed more than once, such as ${duplicates[0].emoji}.`,
		);
	}

	const unnamed = entries.filter((entry) => !entry.name);

	if (unnamed.length) {
		problems.push(
			`${unnamed.length.toString()} emoji have no shortcode, such as ${unnamed[0].emoji}.`,
		);
	}

	if (problems.length) {
		throw new Error(
			[
				"The data read for Discord doesn't look right, so the snapshot wasn't written:",
				...problems.map((problem) => `  ${problem}`),
			].join("\n"),
		);
	}
}

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

/**
 * How much of a keyword set's keys must be emoji names for it to be the emoji
 * keywords rather than one of the client's other per-locale string maps.
 */
const minimumKeywordNameOverlap = 0.5;

/** The chunk Discord splits its emoji data into, when it still names it that. */
const dataChunkPrefix = "vnd-emoji.";

/** The chunk holding the client itself, when it still names it that. */
const clientChunkPrefix = "web.";

/**
 * The emoji store's search method, used to find the module that loads the
 * keywords. Only a shortcut: losing it falls back to trying every locale map.
 */
const searchMethod = "nameMatchesChain";

const snapshotPath = path.join(import.meta.dirname, "../discord.json");

const source = process.argv[2] ?? defaultSource;
const origin = new URL(source).origin;

const previous = await readPreviousSnapshot();

const page = await fetchText(source);
const scripts = listScripts(page);

const { chunk: dataChunk, data } = await readEmojiData();
const names = new Set(data.emojis.map((emoji) => emoji.names[0]));
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
 * Pulls the JSON blobs out of a script.
 *
 * The bundler emits a large JSON module as a string literal it parses at
 * runtime, so these are read as literals rather than by matching the shape of
 * what's inside them. A blob is found by asking what it holds, not by where it
 * sits or what its first key is, since neither is Discord's to keep stable.
 */
function* extractJsonBlobs(script: string) {
	const prefix = "JSON.parse('";

	for (let start = script.indexOf(prefix); start !== -1;) {
		const open = start + prefix.length;
		let end = open;

		while (end < script.length && script[end] !== "'") {
			end += script[end] === "\\" ? 2 : 1;
		}

		const literal = script
			.slice(open, end)
			// The only escapes the bundler emits that JSON doesn't share.
			.replaceAll("\\'", "'")
			.replaceAll(/\\x([0-9a-fA-F]{2})/g, "\\u00$1");

		try {
			yield JSON.parse(literal) as unknown;
		} catch {
			// A literal that doesn't parse isn't one of the blobs being looked for.
		}

		start = script.indexOf(prefix, end);
	}
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
 * These read minified code that nothing promises to keep stable. A pattern that
 * starts matching twice is as much a sign of that code having moved on as one
 * that stops matching, and quietly taking the first of two would be a coin flip.
 */
function findOnly(script: string, pattern: RegExp) {
	const matches = [...script.matchAll(pattern)].map((match) => match[1]);

	return matches.length === 1 ? matches[0] : undefined;
}

/**
 * Whether a script is the one carrying the client's own module and chunk maps.
 *
 * Those maps, not any particular code, are what the keywords are reached
 * through, so this asks for them rather than for a function that could be
 * renamed.
 */
function isClientScript(script: string) {
	return localeChunkIds(script).some(
		(chunkId) => chunkFileNames(script, chunkId).length > 0,
	);
}

function isSameData(left: DiscordItem[], right: DiscordItem[]) {
	return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Whether a blob is a keyword set for the emoji, rather than one of the
 * client's other per-locale string maps.
 */
function isKeywords(value: unknown): value is RawKeywords {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	const entries = Object.entries(value);

	if (
		!entries.length ||
		!entries.every(
			([, terms]) =>
				Array.isArray(terms) && terms.every((term) => typeof term === "string"),
		)
	) {
		return false;
	}

	const known = entries.filter(([name]) => names.has(name)).length;

	return known / entries.length >= minimumKeywordNameOverlap;
}

function isRawData(value: unknown): value is RawData {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const { emojis, emojisByCategory } = value as Record<string, unknown>;

	return (
		Array.isArray(emojis) &&
		emojis.length > 0 &&
		emojis.every(
			(emoji: unknown) =>
				typeof emoji === "object" &&
				emoji !== null &&
				Array.isArray((emoji as Record<string, unknown>).names) &&
				typeof (emoji as Record<string, unknown>).surrogates === "string",
		) &&
		typeof emojisByCategory === "object" &&
		emojisByCategory !== null &&
		Object.values(emojisByCategory as Record<string, unknown>).every(
			(range: unknown) => Array.isArray(range) && range.length === 2,
		)
	);
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
 * Every chunk id the client script loads this locale's strings from.
 *
 * The keywords are one of these; so are the client's other translated strings.
 * Which is which is settled by reading them, not by picking one here.
 */
function localeChunkIds(client: string) {
	return [
		...new Set(
			[
				...client.matchAll(
					RegExp(
						`"?${locale}"?\\s*:\\s*\\(\\)\\s*=>\\s*\\w+\\.e\\(\\s*"?(\\d+)"?\\s*\\)`,
						"g",
					),
				),
			].map((match) => match[1]),
		),
	];
}

/**
 * The file names a chunk id can resolve to.
 *
 * The bundler writes some chunks with their id in the file name and the rest
 * as a bare hash, in the same build, and which of the two a chunk gets is not
 * stable across builds. Rather than reimplement that choice, this offers every
 * form the client spells out for the id and lets the fetch decide.
 */
function chunkFileNames(client: string, chunkId: string) {
	const fileNames: string[] = [];

	const literal = findOnly(
		client,
		RegExp(`"${chunkId}"===\\w+\\?"([\\w.-]+\\.js)"`, "g"),
	);

	if (literal) {
		fileNames.push(literal);
	}

	const suffixed = findOnly(
		client,
		RegExp(`"${chunkId}"===\\w+\\?""\\+\\w+\\+"(\\.[0-9a-f]+\\.js)"`, "g"),
	);

	if (suffixed) {
		fileNames.push(`${chunkId}${suffixed}`);
	}

	const mapped = findOnly(
		client,
		RegExp(`[,{]"?${chunkId}"?:"([0-9a-f]+)"`, "g"),
	);

	if (mapped) {
		fileNames.push(`${mapped}.js`);
	}

	return fileNames;
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
	return await readChunk(dataChunkPrefix, "emoji data", (script) => {
		for (const blob of extractJsonBlobs(script)) {
			if (isRawData(blob)) {
				return blob;
			}
		}

		return undefined;
	});
}

/**
 * Reads the keywords the picker searches on, which live outside the emoji data.
 *
 * The emoji data holds only shortcodes. The keywords are a separate set per
 * locale, in a chunk loaded on demand, so the client script has to be read to
 * find out which chunk that is.
 *
 * The client names its emoji-keyword module, so the search method is followed
 * to it first. That's a shortcut through code Discord can rename at will, so a
 * miss just means trying every locale chunk the client loads and keeping the
 * one that turns out to hold keywords for emoji that exist.
 */
async function readKeywords() {
	const { chunk, data: client } = await readChunk(
		clientChunkPrefix,
		"the client's locale chunk map",
		(script) => (isClientScript(script) ? script : undefined),
	);

	const referenced = referencedLocaleChunkId(client);
	const candidates = [
		...(referenced ? [referenced] : []),
		...localeChunkIds(client).filter((id) => id !== referenced),
	];

	if (!referenced) {
		console.warn(
			`Could not follow ${searchMethod} to the keywords in ${chunk}; trying all ${candidates.length.toString()} locale chunks.`,
		);
	}

	for (const chunkId of candidates) {
		for (const fileName of chunkFileNames(client, chunkId)) {
			const keywords = await tryReadKeywords(fileName);

			if (keywords) {
				return { chunk: fileName, keywords };
			}
		}
	}

	throw new Error(
		`None of the ${candidates.length.toString()} ${locale} chunks loaded by ${chunk} contained emoji keywords.`,
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
 * Follows the emoji store's search method to the chunk id for this locale's
 * keywords, when the client still looks the way it did when this was written.
 */
function referencedLocaleChunkId(client: string) {
	const module = findOnly(searchModule(client), /\w+\((\d+)\)\.\w+\[\w+\]/g);

	if (!module) {
		return undefined;
	}

	return findOnly(
		client,
		RegExp(
			`\\b${module}\\(\\w+,\\w+,\\w+\\)\\{.*?"?${locale}"?\\s*:\\s*\\(\\)\\s*=>\\s*\\w+\\.e\\(\\s*"?(\\d+)"?\\s*\\)`,
			"gs",
		),
	);
}

/**
 * Narrows the client script to the module its emoji search lives in, so that
 * the reference being looked for there can't be some other module's.
 */
function searchModule(client: string) {
	const index = client.indexOf(searchMethod);

	if (index === -1) {
		return "";
	}

	const headers = [
		...client.matchAll(/\b\d{4,7}\(\w+,\w+,\w+\)\{"use strict"/g),
	].map((header) => header.index);
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
 * Reads one candidate chunk, treating anything that isn't keywords -including
 * a file name that doesn't resolve- as a miss rather than a failure.
 */
async function tryReadKeywords(fileName: string) {
	let script;

	try {
		script = await fetchScript(fileName);
	} catch {
		return undefined;
	}

	for (const blob of extractJsonBlobs(script)) {
		if (isKeywords(blob)) {
			return blob;
		}
	}

	return undefined;
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

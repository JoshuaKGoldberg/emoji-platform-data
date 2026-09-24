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

interface Snapshot {
	chunk: string;
	entries: DiscordItem[];
	source: string;
}

/**
 * Emoji that should always come back, with a shortcode they should always have.
 */
const canaryNames = {
	"❤️": "heart",
	"🎉": "tada",
	"👍": "thumbsup",
	"😀": "grinning",
};

/**
 * The page whose scripts include the emoji data, and where they're served from.
 */
const defaultSource = "https://discord.com/app";

const assetOrigin = "https://discord.com";

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

/** The smallest category holds over a hundred emoji, so this is a wide margin. */
const minimumEntriesPerCategory = 50;

const minimumEntries = 1500;

/** Where the data blob starts inside whichever script carries it. */
const dataPrefix = `JSON.parse('{"emojis":[`;

/** The chunk Discord splits its emoji data into, when it still names it that. */
const namedChunkPrefix = "vnd-emoji.";

const snapshotPath = path.join(import.meta.dirname, "../discord.json");

const source = process.argv[2] ?? defaultSource;

const previous = await readPreviousSnapshot();
const { chunk, data } = await readData();

const entries = toEntries(data);

validate(entries, previous);

const snapshot: Snapshot = { chunk, entries, source };

// Discord redeploys constantly, and every deploy renames the chunk. Rewriting
// the file for a rename alone would churn it -and open empty refresh pull
// requests- for data that hasn't changed.
if (previous && isSameData(previous.entries, entries)) {
	console.log(
		`Read ${entries.length.toString()} emoji from ${chunk}, unchanged from the snapshot.`,
	);
} else {
	await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");
	console.log(`Wrote ${entries.length.toString()} emoji from ${chunk}.`);
}

/**
 * Pulls the data blob out of a script, as the JavaScript string literal it's
 * embedded in rather than by matching its shape, so that a new field or a
 * reordering of the existing ones doesn't need this to change.
 */
function extractData(script: string) {
	const start = script.indexOf(dataPrefix);
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
		throw new Error("Found the emoji data, but it was never closed.");
	}

	const literal = script
		.slice(open, end)
		// The only escapes the bundler emits that JSON doesn't share.
		.replaceAll("\\'", "'")
		.replaceAll(/\\x([0-9a-fA-F]{2})/g, "\\u00$1");

	return JSON.parse(literal) as RawData;
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

function isSameData(left: DiscordItem[], right: DiscordItem[]) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function isUrl(text: string) {
	const parsed = URL.parse(text);

	return parsed?.protocol === "http:" || parsed?.protocol === "https:";
}

async function readPreviousSnapshot() {
	try {
		return JSON.parse(await fs.readFile(snapshotPath, "utf8")) as Snapshot;
	} catch {
		return undefined;
	}
}

/**
 * Finds the emoji data, either in a script given on the command line or among
 * the scripts the web client loads.
 *
 * Discord splits that data into its own named chunk, which is what this looks
 * for first. The name is Discord's to change, so a miss falls back to reading
 * every script, which is slower but doesn't depend on the name at all.
 */
async function readData() {
	const page = await readSource();

	// A script given on the command line carries the data itself, rather than
	// listing the scripts that might.
	const direct = extractData(page);

	if (direct) {
		return { chunk: path.basename(source), data: direct };
	}

	const chunks = [
		...new Set(
			[...page.matchAll(/\/assets\/([\w.-]+\.js)/g)].map((match) => match[1]),
		),
	];

	if (!chunks.length) {
		throw new Error(`No scripts were listed by ${source}.`);
	}

	const named = chunks.filter((chunk) => chunk.startsWith(namedChunkPrefix));

	for (const chunk of [...named, ...chunks.filter((c) => !named.includes(c))]) {
		const data = extractData(await fetchText(`${assetOrigin}/assets/${chunk}`));

		if (data) {
			return { chunk, data };
		}
	}

	throw new Error(
		`None of the ${chunks.length.toString()} scripts listed by ${source} contained emoji data.`,
	);
}

/**
 * Reads whatever the source is, which is the web client's page by default and
 * otherwise any path or URL given on the command line, such as a script saved
 * from a browser when the page stops listing the one with the data in it.
 */
async function readSource() {
	if (isUrl(source)) {
		return await fetchText(source);
	}

	try {
		return await fs.readFile(source, "utf8");
	} catch (error) {
		throw new Error(
			`Could not read ${source}. Pass the path to a saved Discord script to read that instead.`,
			{ cause: error },
		);
	}
}

/**
 * Keeps the emoji the picker lists, which are the ones a category covers.
 *
 * The data also carries every skin tone variant of those, but only to route
 * shortcodes like `wave_tone3` to them. Those names are mechanical suffixes on
 * the base emoji's, so there's nothing in them to fold back in, and keeping
 * them would give one emoji a tone axis nothing else in the data set has.
 */
function toEntries({ emojis, emojisByCategory }: RawData) {
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
 * Nothing here is a supported API: it's a blob inside a bundle that Discord
 * rebuilds many times a day. A refresh that reads a stale chunk, or only part
 * of the list, shouldn't overwrite the snapshot with it.
 */
function validate(entries: DiscordItem[], previous: Snapshot | undefined) {
	const problems: string[] = [];

	if (entries.length < minimumEntries) {
		problems.push(
			`Only ${entries.length.toString()} emoji were read, out of at least ${minimumEntries.toString()} expected.`,
		);
	}

	if (previous && entries.length < previous.entries.length * 0.95) {
		problems.push(
			`Emoji count fell from ${previous.entries.length.toString()} to ${entries.length.toString()}, more than refreshing should change it.`,
		);
	}

	for (const category of expectedCategories) {
		const count = entries.filter((entry) => entry.category === category).length;

		if (count < minimumEntriesPerCategory) {
			problems.push(
				`Category '${category}' has ${count.toString()} emoji, out of at least ${minimumEntriesPerCategory.toString()} expected.`,
			);
		}
	}

	for (const [emoji, name] of Object.entries(canaryNames)) {
		const entry = entries.find((candidate) => candidate.emoji === emoji);

		if (!entry) {
			problems.push(`${emoji} is missing entirely.`);
		} else if (![entry.name, ...entry.aliases].includes(name)) {
			problems.push(`${emoji} no longer lists the shortcode '${name}'.`);
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

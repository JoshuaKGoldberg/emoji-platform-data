import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";

import { MacOSItem } from "../src/dataTypes.js";

interface RawEntry {
	appleName: string;
	category: null | string;
	emoji: string;
	isCommon: boolean;
	keywordWeights: Record<string, number>;
	order: null | number;
	speechName: string;
	unicodeName: string;
	voiceOverName: string;
}

interface Snapshot {
	coreEmojiVersion: string;
	entries: MacOSItem[];
	localeIdentifier: string;
	macosVersion: string;
}

/**
 * Emoji that should always come back, with a keyword they should always have.
 *
 * A failure part-way through the frameworks tends to produce entries that look
 * structurally fine but have lost their keywords, which these catch.
 */
const canaryKeywords = {
	"❤️": "love",
	"🏳️‍🌈": "pride",
	"🐙": "octopus",
	"😀": "grin",
};

const coreEmojiInfoPlist =
	"/System/Library/PrivateFrameworks/CoreEmoji.framework/Versions/A/Resources/Info.plist";

/**
 * The picker's search index only exists per-locale, and this package is
 * English-only. en_US is the locale whose index macOS ships as SearchModel-en.
 */
const localeIdentifier = "en_US";

/** The smallest category holds a few hundred emoji, so this is a wide margin. */
const minimumEntriesPerCategory = 50;

const minimumEntries = 1500;

const extractorPath = path.join(import.meta.dirname, "extractMacOS.js");
const snapshotPath = path.join(import.meta.dirname, "../macos.json");

const run = promisify(execFile);

if (process.platform !== "darwin") {
	throw new Error(
		`This script reads macOS's own emoji picker data, so it only runs on macOS. This is ${process.platform}.`,
	);
}

const previous = await readPreviousSnapshot();
const entries = (await runExtractor())
	.filter((entry) => Object.keys(entry.keywordWeights).length > 0)
	.map(toItem)
	.sort(compareItems);

validate(entries, previous);

const snapshot: Snapshot = {
	coreEmojiVersion: await readCoreEmojiVersion(),
	entries,
	localeIdentifier,
	macosVersion: await readMacOSVersion(),
};

await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");

console.log(
	`Wrote ${entries.length.toString()} emoji from macOS ${snapshot.macosVersion} (CoreEmoji ${snapshot.coreEmojiVersion}).`,
);

/**
 * Sorts by the order macOS's picker shows emoji in, keeping the handful that
 * no category lists -such as ⏩ and ✊🏽- together at the end.
 */
function compareItems(a: MacOSItem, b: MacOSItem) {
	if (a.order === undefined) {
		return b.order === undefined ? compareStrings(a.emoji, b.emoji) : 1;
	}

	if (b.order === undefined) {
		return -1;
	}

	return a.order - b.order;
}

/**
 * Compares by code unit rather than with localeCompare, so that refreshing on
 * two different Macs can't produce two different orderings.
 */
function compareStrings(a: string, b: string) {
	if (a < b) {
		return -1;
	}

	return a > b ? 1 : 0;
}

function countByCategory(entries: MacOSItem[]) {
	const counts = new Map<string, number>();

	for (const { category } of entries) {
		if (category !== undefined) {
			counts.set(category, (counts.get(category) ?? 0) + 1);
		}
	}

	return counts;
}

async function readCoreEmojiVersion() {
	const { stdout } = await run("plutil", [
		"-extract",
		"CFBundleVersion",
		"raw",
		"-o",
		"-",
		coreEmojiInfoPlist,
	]);

	return stdout.trim();
}

async function readMacOSVersion() {
	const { stdout } = await run("sw_vers", ["-productVersion"]);

	return stdout.trim();
}

async function readPreviousSnapshot() {
	try {
		return JSON.parse(await fs.readFile(snapshotPath, "utf8")) as Snapshot;
	} catch {
		return undefined;
	}
}

async function runExtractor() {
	try {
		const { stdout } = await run(
			"osascript",
			["-l", "JavaScript", extractorPath, localeIdentifier],
			{ maxBuffer: 128 * 1024 * 1024 },
		);

		return JSON.parse(stdout) as RawEntry[];
	} catch (error) {
		const details = (error as { stderr?: string }).stderr?.trim();

		throw new Error(
			[`Could not read macOS emoji data.`, details].filter(Boolean).join("\n"),
			{ cause: error },
		);
	}
}

/**
 * Keeps only the fields the package publishes, dropping each keyword's search
 * weight once it has served its purpose of ordering the keywords.
 */
function toItem(entry: RawEntry): MacOSItem {
	return {
		appleName: entry.appleName,
		category: entry.category ?? undefined,
		emoji: entry.emoji,
		isCommon: entry.isCommon,
		keywords: Object.entries(entry.keywordWeights)
			.sort(
				([aTerm, aWeight], [bTerm, bWeight]) =>
					bWeight - aWeight || compareStrings(aTerm, bTerm),
			)
			.map(([term]) => term),
		order: entry.order ?? undefined,
		speechName: entry.speechName,
		unicodeName: entry.unicodeName || undefined,
		voiceOverName: entry.voiceOverName,
	};
}

/**
 * Refuses to write data that looks like a partial read of the frameworks.
 *
 * These are all private APIs: a macOS update can leave them in place but have
 * them return nothing, which would otherwise overwrite the snapshot with a
 * smaller, quietly wrong one.
 */
function validate(entries: MacOSItem[], previous: Snapshot | undefined) {
	const problems: string[] = [];

	if (entries.length < minimumEntries) {
		problems.push(
			`Only ${entries.length.toString()} emoji have keywords, out of at least ${minimumEntries.toString()} expected.`,
		);
	}

	if (previous && entries.length < previous.entries.length * 0.95) {
		problems.push(
			`Emoji count fell from ${previous.entries.length.toString()} to ${entries.length.toString()}, more than refreshing should change it.`,
		);
	}

	for (const [emoji, keyword] of Object.entries(canaryKeywords)) {
		const entry = entries.find((candidate) => candidate.emoji === emoji);

		if (!entry) {
			problems.push(`${emoji} is missing entirely.`);
		} else if (!entry.keywords.includes(keyword)) {
			problems.push(`${emoji} no longer lists the keyword '${keyword}'.`);
		}
	}

	const counts = countByCategory(entries);

	for (const [category, count] of counts) {
		if (count < minimumEntriesPerCategory) {
			problems.push(
				`The ${category} category only has ${count.toString()} emoji, out of at least ${minimumEntriesPerCategory.toString()} expected.`,
			);
		}
	}

	const incomplete = entries.filter(
		(entry) =>
			!entry.appleName ||
			!entry.keywords.length ||
			!entry.speechName ||
			!entry.voiceOverName,
	);

	if (incomplete.length) {
		problems.push(
			`${incomplete.length.toString()} emoji are missing a name or keywords, such as ${incomplete[0].emoji}.`,
		);
	}

	if (problems.length) {
		throw new Error(
			[
				"The data read out of macOS doesn't look right, so the snapshot wasn't written:",
				...problems.map((problem) => `  ${problem}`),
			].join("\n"),
		);
	}
}

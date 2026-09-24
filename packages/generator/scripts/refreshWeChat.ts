import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";

import { WeChatItem } from "../src/dataTypes.js";

interface RawEntry {
	aliases: string[];

	/** Absent for the handful of GitHub-only images, such as `:octocat:`. */
	description?: string;

	/** Absent for the handful of GitHub-only images, such as `:octocat:`. */
	emoji?: string;

	tags: string[];
}

interface Snapshot {
	entries: WeChatItem[];
	source: string;
	wechatVersion?: string;
}

/**
 * Emoji that should always come back, with a name or tag they should always have.
 */
const canaryTerms = {
	"❤️": "heart",
	"🎉": "tada",
	"👍": "thumbsup",
	"😄": "smile",
};

/**
 * Where WeChat for macOS keeps the emoji data behind its search.
 */
const defaultSource =
	"/Applications/WeChat.app/Contents/Resources/NgEmojiMap.bundle/gemoji.json";

const wechatInfoPlist = "/Applications/WeChat.app/Contents/Info.plist";

const minimumEntries = 800;

const snapshotPath = path.join(import.meta.dirname, "../wechat.json");

const run = promisify(execFile);

const source = process.argv[2] ?? defaultSource;

const previous = await readPreviousSnapshot();
const raw = JSON.parse(await readSource()) as RawEntry[];

// WeChat ships GitHub's emoji list as-is, including its few image-only
// shortcodes, such as `:octocat:`. Those aren't emoji, so they're dropped.
const entries = raw.filter(isEmojiEntry).map(toItem);

validate(entries, previous);

const snapshot: Snapshot = {
	entries,
	source,
	wechatVersion: await readWeChatVersion(),
};

await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");

console.log(
	`Wrote ${entries.length.toString()} emoji from ${source}, skipping ${(raw.length - entries.length).toString()} non-emoji shortcodes.`,
);

function isEmojiEntry(
	entry: RawEntry,
): entry is RawEntry & Required<Pick<RawEntry, "description" | "emoji">> {
	return !!entry.description && !!entry.emoji;
}

async function readPreviousSnapshot() {
	try {
		return JSON.parse(await fs.readFile(snapshotPath, "utf8")) as Snapshot;
	} catch {
		return undefined;
	}
}

/**
 * Reads the data WeChat ships, either from a local install or from any path or
 * URL given on the command line, such as a copy taken from another machine.
 */
function isUrl(text: string) {
	const parsed = URL.parse(text);

	return parsed?.protocol === "http:" || parsed?.protocol === "https:";
}

async function readSource() {
	if (isUrl(source)) {
		const response = await fetch(source);
		if (!response.ok) {
			throw new Error(
				`Could not fetch ${source}: ${response.status.toString()} ${response.statusText}.`,
			);
		}

		return await response.text();
	}

	try {
		return await fs.readFile(source, "utf8");
	} catch (error) {
		throw new Error(
			`Could not read ${source}. Pass the path to a copy of WeChat's gemoji.json to read that instead.`,
			{ cause: error },
		);
	}
}

/**
 * Records which WeChat the data came from, when it came from an installed one.
 */
async function readWeChatVersion() {
	if (source !== defaultSource || process.platform !== "darwin") {
		return undefined;
	}

	const { stdout } = await run("plutil", [
		"-extract",
		"CFBundleShortVersionString",
		"raw",
		"-o",
		"-",
		wechatInfoPlist,
	]);

	return stdout.trim();
}

function toItem(
	entry: RawEntry & Required<Pick<RawEntry, "description" | "emoji">>,
): WeChatItem {
	return {
		aliases: entry.aliases,
		description: entry.description,
		emoji: entry.emoji,
		tags: entry.tags,
	};
}

/**
 * Refuses to write data that doesn't look like WeChat's emoji list.
 *
 * The file is an implementation detail of an app that can change its shape or
 * move in any update, so a refresh that reads something else -or only part of
 * the list- shouldn't overwrite the snapshot with it.
 */
function validate(entries: WeChatItem[], previous: Snapshot | undefined) {
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

	for (const [emoji, term] of Object.entries(canaryTerms)) {
		const entry = entries.find((candidate) => candidate.emoji === emoji);

		if (!entry) {
			problems.push(`${emoji} is missing entirely.`);
		} else if (![...entry.aliases, ...entry.tags].includes(term)) {
			problems.push(`${emoji} no longer lists the term '${term}'.`);
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

	const incomplete = entries.filter((entry) => !entry.aliases.length);

	if (incomplete.length) {
		problems.push(
			`${incomplete.length.toString()} emoji have no name, such as ${incomplete[0].emoji}.`,
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

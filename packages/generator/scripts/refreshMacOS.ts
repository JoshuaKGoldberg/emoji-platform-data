import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
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

const coreEmojiInfoPlist =
	"/System/Library/PrivateFrameworks/CoreEmoji.framework/Versions/A/Resources/Info.plist";

/**
 * The picker's search index only exists per-locale, and this package is
 * English-only. en_US is the locale whose index macOS ships as SearchModel-en.
 */
const localeIdentifier = "en_US";

const extractorPath = path.join(import.meta.dirname, "extractMacOS.m");
const snapshotPath = path.join(import.meta.dirname, "../macos.json");

const run = promisify(execFile);

if (process.platform !== "darwin") {
	throw new Error(
		[
			`This script reads macOS's own emoji picker data, so it only runs on macOS (this is ${process.platform}).`,
			`Its output is committed as packages/generator/macos.json, so building the packages doesn't need a Mac.`,
		].join("\n"),
	);
}

const temporaryDirectory = await fs.mkdtemp(
	path.join(os.tmpdir(), "emoji-platform-data-"),
);

try {
	const binaryPath = path.join(temporaryDirectory, "extractMacOS");

	await compileExtractor(binaryPath);

	const entries = (await runExtractor(binaryPath))
		.filter((entry) => Object.keys(entry.keywordWeights).length > 0)
		.map(toItem)
		.sort(compareItems);

	const snapshot = {
		coreEmojiVersion: await readCoreEmojiVersion(),
		entries,
		localeIdentifier,
		macosVersion: await readMacOSVersion(),
	};

	await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");

	console.log(
		`Wrote ${entries.length.toString()} emoji from macOS ${snapshot.macosVersion} (CoreEmoji ${snapshot.coreEmojiVersion}).`,
	);
} finally {
	await fs.rm(temporaryDirectory, { force: true, recursive: true });
}

async function compileExtractor(binaryPath: string) {
	try {
		await run("clang", [
			"-fobjc-arc",
			"-framework",
			"Foundation",
			"-o",
			binaryPath,
			extractorPath,
		]);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			throw new Error(
				"Could not find clang. Install the Xcode Command Line Tools with `xcode-select --install`, then try again.",
				{ cause: error },
			);
		}

		throw error;
	}
}

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

async function runExtractor(binaryPath: string) {
	const { stdout } = await run(binaryPath, [localeIdentifier], {
		maxBuffer: 128 * 1024 * 1024,
	});

	return JSON.parse(stdout) as RawEntry[];
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
		unicodeName: entry.unicodeName,
		voiceOverName: entry.voiceOverName,
	};
}

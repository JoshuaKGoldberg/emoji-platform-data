import { execFileSync } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { WindowsItem } from "../src/dataTypes.js";

/** One build as UUP dump lists it. */
interface RawBuild {
	arch: string;
	build: string;
	title: string;
	uuid: string;
}

/** One file of a build as UUP dump lists it, served from Microsoft's CDN. */
interface RawFile {
	sha256: string;
	url: string;
}

interface Snapshot {
	build: string;
	component: string;
	entries: WindowsItem[];
	release: string;
}

/**
 * Emoji that should always come back, with terms they should always have.
 * Each has a term no Unicode CLDR annotation does, so that data falling back
 * to CLDR's is caught as well as data going missing.
 */
const canaryTerms = {
	"❤️": ["love", "<3"],
	"🎉": ["celebrate", "tada"],
	"🐙": ["creature", "ocean"],
	"👋": ["hello", "ttyl"],
};

/** The feature on demand that carries a language's typing data, emoji keywords included. */
const cabName =
	"Microsoft-Windows-LanguageFeatures-Basic-en-us-Package-amd64.cab";

/** The emoji panel's keyword data for en-US, named for its locale ID, 0x0409. */
const datamapName = "datamap.0409.dat";

const minimumEntries = 1500;

const minimumEntriesWithKeywords = 1400;

/** Retail releases, rather than Insider, preview, or servicing-stack builds. */
const releaseTitle = /^Windows 11, version (\w+) \((\d+)\.(\d+)\)$/;

const skinTones = /[\u{1F3FB}-\u{1F3FF}]/u;

const snapshotPath = path.join(import.meta.dirname, "../windows.json");

const uupApi = "https://api.uupdump.net";

const previous = await readPreviousSnapshot();

const build = await pickLatestBuild();
const file = await fetchFile(build.uuid, cabName);

const directory = await fs.mkdtemp(path.join(os.tmpdir(), "refresh-windows-"));

try {
	const cabPath = path.join(directory, cabName);
	await fs.writeFile(cabPath, await download(file));

	const { component, contents } = extractDatamap(cabPath);
	const entries = toEntries(readDatamap(contents));

	validate(entries, previous);

	const snapshot: Snapshot = {
		build: build.build,
		component,
		entries,
		release: build.release,
	};

	// Windows ships a cumulative update every month, and the build number moves
	// with each, but this feature on demand only changes with a new release.
	// Rewriting the snapshot for a build bump alone would churn it -and open
	// empty refresh pull requests- for data that hasn't changed.
	if (previous && isSameData(previous.entries, entries)) {
		console.log(
			`Read ${entries.length.toString()} emoji from Windows 11 ${build.release} (${build.build}), unchanged from the snapshot.`,
		);
	} else {
		await fs.writeFile(
			snapshotPath,
			JSON.stringify(snapshot, null, "\t") + "\n",
		);
		console.log(
			`Wrote ${entries.length.toString()} emoji from Windows 11 ${build.release} (${build.build}), with keywords for ${countWithKeywords(entries).toString()} of them.`,
		);
	}
} finally {
	await fs.rm(directory, { force: true, recursive: true });
}

function countWithKeywords(entries: WindowsItem[]) {
	return entries.filter((entry) => entry.keywords.length).length;
}

async function download(file: RawFile) {
	const response = await fetch(file.url);
	if (!response.ok) {
		throw new Error(
			`Could not download ${cabName}: ${response.status.toString()} ${response.statusText}.`,
		);
	}

	const contents = Buffer.from(await response.arrayBuffer());
	const sha256 = crypto.createHash("sha256").update(contents).digest("hex");

	// UUP dump only brokers the link: the file itself comes from Microsoft's
	// CDN, and the hash Windows Update published for it is what vouches for it.
	if (sha256 !== file.sha256.toLowerCase()) {
		throw new Error(
			`${cabName} hashed to ${sha256}, but Windows Update lists it as ${file.sha256}.`,
		);
	}

	return contents;
}

/**
 * Pulls the keyword data out of the feature on demand.
 *
 * The cabinet is LZX-compressed, which Node can't inflate, so 7-Zip does.
 * GitHub's Ubuntu runners have it installed as `7z`, and Homebrew's `sevenzip`
 * installs it as `7zz`.
 */
function extractDatamap(cabPath: string) {
	const sevenZip = findSevenZip();
	const listing = execFileSync(sevenZip, ["l", "-slt", "-ba", cabPath], {
		encoding: "utf8",
		maxBuffer: 16 * 1024 * 1024,
	});

	const matches = [...listing.matchAll(/^Path = (.+)$/gm)]
		.map((match) => match[1].trim())
		.filter((name) => name.endsWith(`/${datamapName}`));

	// A name that starts matching twice is as much a sign of the package having
	// moved on as one that stops matching.
	if (matches.length !== 1) {
		throw new Error(
			`Expected exactly one ${datamapName} in ${cabName}, but found ${matches.length.toString()}.`,
		);
	}

	// Component directories are named like
	// amd64_microsoft-windows-s..states-english-main_31bf3856ad364e35_10.0.28000.1_none_7971444a4f973921.
	const component = /_(\d+\.\d+\.\d+\.\d+)_/.exec(matches[0])?.[1];

	if (!component) {
		throw new Error(`Could not read a version out of '${matches[0]}'.`);
	}

	const contents = execFileSync(sevenZip, ["e", "-so", cabPath, matches[0]], {
		maxBuffer: 16 * 1024 * 1024,
	});

	return { component, contents };
}

async function fetchFile(uuid: string, name: string) {
	const files = await fetchUup<Partial<Record<string, RawFile>>>(
		`get.php?id=${uuid}&lang=en-us&edition=professional`,
		"files",
	);

	const file = files[name];

	if (!file) {
		throw new Error(`Windows Update lists no ${name} for build ${uuid}.`);
	}

	return file;
}

/**
 * Asks UUP dump, which reads Windows Update's own listings, for one field of
 * its answer. It leaves fields out now and then under load, so it gets a few
 * tries before that's taken as the field really being missing.
 */
async function fetchUup<T>(query: string, key: string): Promise<T> {
	for (let attempt = 1; ; attempt += 1) {
		const response = await fetch(`${uupApi}/${query}`);
		const body = response.ok
			? ((await response.json()) as {
					response?: Partial<Record<string, unknown>>;
				})
			: undefined;
		const value = body?.response?.[key];

		if (value) {
			return value as T;
		}

		if (attempt === 3) {
			throw new Error(
				`UUP dump's answer to '${query}' had no ${key}: ${JSON.stringify(body?.response?.error ?? `${response.status.toString()} ${response.statusText}`)}.`,
			);
		}

		await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
	}
}

function findSevenZip() {
	for (const command of ["7zz", "7z"]) {
		try {
			execFileSync(command, ["i"], { stdio: "ignore" });
			return command;
		} catch {
			// Not installed under this name; try the next.
		}
	}

	throw new Error(
		"Reading the Windows data needs 7-Zip installed as 7zz or 7z, such as with `brew install sevenzip` or `apt install 7zip`.",
	);
}

function isSameData(left: WindowsItem[], right: WindowsItem[]) {
	return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * The newest retail release of Windows 11.
 *
 * That's by build number rather than by release name or date: releases for
 * new hardware can be a newer build than the release existing PCs get later
 * in the same year, and they carry the newer emoji data.
 */
async function pickLatestBuild() {
	const builds = await fetchUup<Record<string, RawBuild>>(
		`listid.php?search=${encodeURIComponent("Windows 11, version")}&sortByDate=1`,
		"builds",
	);

	const candidates = Object.values(builds)
		.filter((build) => build.arch === "amd64")
		.flatMap((build) => {
			const match = releaseTitle.exec(build.title);

			return match
				? [
						{
							build: build.build,
							major: Number(match[2]),
							minor: Number(match[3]),
							release: match[1],
							uuid: build.uuid,
						},
					]
				: [];
		})
		.sort((a, b) => a.major - b.major || a.minor - b.minor);

	const latest = candidates.at(-1);

	if (!latest) {
		throw new Error("UUP dump listed no retail Windows 11 builds.");
	}

	return latest;
}

/**
 * Reads the emoji panel's keyword data.
 *
 * The file opens with a hash table: a bucket count, then that many offsets
 * into what follows it. After that come two kinds of record, interleaved:
 *
 * - Strings, as null-terminated UTF-16, each written once, where first used
 * - Pairs of an emoji and one of its terms, as the offsets of those two
 *   strings, followed by an ID that counts down from -2
 *
 * Each emoji's first pair is its name, and the rest are its keywords, in
 * order. Past the last pair are the lists the buckets point to, which index
 * the same pairs for lookup rather than adding any, so reading stops at the
 * first of those.
 */
function readDatamap(contents: Buffer) {
	const bucketCount = contents.readUInt32LE(0);
	const base = 4 + bucketCount * 4;
	let end = contents.length - base;

	for (let bucket = 0; bucket < bucketCount; bucket += 1) {
		const offset = contents.readUInt32LE(4 + bucket * 4);

		if (offset) {
			end = Math.min(end, offset);
		}
	}

	const strings = new Map<number, string>();
	const terms = new Map<string, string[]>();
	let expectedId = -2;
	let position = 0;

	while (position < end) {
		const at = base + position;

		// A string would need U+FFFF, which isn't a character, where a pair keeps
		// its ID to be mistaken for one.
		if (position + 12 <= end && contents.readInt32LE(at + 8) === expectedId) {
			const emoji = strings.get(contents.readUInt32LE(at));
			const term = strings.get(contents.readUInt32LE(at + 4));

			if (emoji === undefined || term === undefined) {
				throw new Error(
					`The pair at ${position.toString()} points somewhere other than a string.`,
				);
			}

			const existing = terms.get(emoji);

			if (existing) {
				existing.push(term);
			} else {
				terms.set(emoji, [term]);
			}

			expectedId -= 1;
			position += 12;
			continue;
		}

		let terminator = at;
		while (terminator + 1 < base + end && contents.readUInt16LE(terminator)) {
			terminator += 2;
		}

		strings.set(position, contents.toString("utf16le", at, terminator));
		position = terminator + 2 - base;
	}

	if (position !== end) {
		throw new Error(
			`Reading ${datamapName} ended at ${position.toString()}, not where its index starts, ${end.toString()}.`,
		);
	}

	return terms;
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

/**
 * Turns each emoji's terms into an entry, in the data's own order.
 *
 * The data lists each skin tone combination of the emoji that show more than
 * one person, such as 🫱🏻‍🫲🏼. Those only add the tones' names to their base
 * emoji's keywords, so they're dropped, as other platforms' variants are.
 */
function toEntries(terms: Map<string, string[]>) {
	return [...terms]
		.filter(([emoji]) => !skinTones.test(emoji))
		.map(([emoji, [name, ...keywords]]) => ({ emoji, keywords, name }));
}

function validate(entries: WindowsItem[], previous: Snapshot | undefined) {
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

	for (const [emoji, terms] of Object.entries(canaryTerms)) {
		const entry = entries.find((candidate) => candidate.emoji === emoji);

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

	const unnamed = entries.filter((entry) => !entry.name);

	if (unnamed.length) {
		problems.push(
			`${unnamed.length.toString()} emoji have no name, such as ${unnamed[0].emoji}.`,
		);
	}

	if (problems.length) {
		throw new Error(
			[
				"The data read for Windows doesn't look right, so the snapshot wasn't written:",
				...problems.map((problem) => `  ${problem}`),
			].join("\n"),
		);
	}
}

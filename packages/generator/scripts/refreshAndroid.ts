import { spawnSync } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import * as zlib from "node:zlib";

import { compareStrings } from "../src/compareStrings.js";
import { AndroidItem } from "../src/dataTypes.js";
import { readMarisaKeys } from "./marisa.js";
import { readPreviousSnapshot, writeSnapshot } from "./shared/snapshots.js";
import {
	checkCanaryKeywords,
	checkCounts,
	emojiCount,
	throwIfProblems,
} from "./shared/validate.js";
import {
	fetchZipDataStart,
	inflateZipEntry,
	readCentralDirectory,
	readZipEntries,
	ZipEntry,
} from "./shared/zip.js";

/** A byte range of the system image that belongs to the product partition. */
interface ProductRange {
	/** Where the range starts in the product partition. */
	destination: number;
	end: number;
	start: number;
}

interface Snapshot {
	entries: AndroidItem[];
	image: string;
	pack: string;
}

/** A system image as the Android SDK's repository lists it. */
interface SystemImage {
	apiLevel: number;
	path: string;
	url: string;
}

/** Where Gboard sits in the product partition of Google's system images. */
const apkPath = "/app/LatinIMEGooglePrebuilt/LatinIMEGooglePrebuilt.apk";

/**
 * Emoji that should always come back, with terms they should always have.
 * Each has a term no Unicode CLDR annotation does, so that data falling back
 * to CLDR's is caught as well as data going missing.
 */
const canaryTerms = {
	"🎉": ["confetti", "tada"],
	"🐙": ["kraken", "tentacle"],
	"👍": ["good job", "yep"],
	"😂": ["lmao", "lol"],
};

/**
 * Google's CDN gzips responses for clients that accept it, as fetch does, and
 * then reports the gzipped size, which says nothing about where the zip's
 * index is. Asking for the file as-is keeps sizes and ranges in its own bytes.
 */
const asIs = { "Accept-Encoding": "identity" };

/** How much of the zip's tail to read when looking for its central directory. */
const centralDirectoryTailSize = 65_536;

/** How much of the system image to hold on to while looking for the partition tables in it. */
const headLimit = 64 * 1024 * 1024;

/** The emoji dictionary's own header, before the trie of its terms. */
const dictionaryMagic = 0x9bc13afe;

/** The newest system image listing schema version when this was written. */
const knownListingVersion = 5;

const minimumEntries = 1500;

const minimumKeywords = 10_000;

/** Emoji search data for English, which Gboard bundles rather than downloading. */
const packPattern = /^assets\/emoji_en_us_\d{14}\.zip$/;

const repositoryUrl =
	"https://dl.google.com/android/repository/sys-img/google_apis_playstore/";

const sectorSize = 512;

const snapshotPath = path.join(import.meta.dirname, "../android.json");

const previous = await readPreviousSnapshot<Snapshot>(snapshotPath);

const image = await pickLatestImage();
const directory = await fs.mkdtemp(path.join(os.tmpdir(), "refresh-android-"));

try {
	const productPath = path.join(directory, "product.img");

	console.log(`Reading the product partition out of ${image.path}...`);
	await extractProduct(new URL(image.url, repositoryUrl).href, productPath);

	const apk = await readApk(productPath);
	const { contents, pack } = readPack(apk);
	const entries = toEntries(readDictionary(contents));

	validate(entries, previous);

	const snapshot: Snapshot = { entries, image: image.path, pack };

	// Google rebuilds its system images every few months, but Gboard's bundled
	// emoji data changes less often than that. Rewriting the snapshot for a new
	// image alone would churn it -and open empty refresh pull requests- for data
	// that hasn't changed.
	await writeSnapshot({
		details: `, with ${countKeywords(entries).toString()} keywords between them`,
		from: `${pack} in ${image.path}`,
		previous,
		snapshot,
		snapshotPath,
	});
} finally {
	await fs.rm(directory, { force: true, recursive: true });
}

function countKeywords(entries: AndroidItem[]) {
	return entries.reduce((total, entry) => total + entry.keywords.length, 0);
}

/**
 * Streams the system image out of the remote zip, keeping only the product
 * partition, which is where Gboard is.
 *
 * The image is a ~2.8GB disk: a GPT partition table, whose `super` partition
 * holds Android's dynamic partitions, one of which is `product`. It's deflated
 * as one stream, so it can't be read piecemeal the way WeChat's app is, but it
 * doesn't need to all be on disk at once either. The partition tables come
 * first, so once they've streamed past, only the product partition's ranges
 * are written out.
 */
async function extractProduct(url: string, productPath: string) {
	const centralDirectory = await readCentralDirectory(url, {
		headers: asIs,
		tailSize: centralDirectoryTailSize,
	});
	const entry = findZipEntry(
		readZipEntries(centralDirectory),
		(name) => name.endsWith("/system.img"),
		url,
	);

	const start = await fetchZipDataStart(url, entry, asIs);
	const response = await fetch(url, {
		headers: {
			...asIs,
			Range: `bytes=${start.toString()}-${(start + entry.compressedSize - 1).toString()}`,
		},
	});

	if (response.status !== 206 || !response.body) {
		throw new Error(
			`Expected a partial response from ${url}, but got ${response.status.toString()} ${response.statusText}.`,
		);
	}

	if (entry.method !== 8) {
		throw new Error(
			`The system image is compressed with method ${entry.method.toString()}, which this script can't read.`,
		);
	}

	const product = await fs.open(productPath, "w");

	try {
		const head: Buffer[] = [];
		let headSize = 0;
		let nextAttempt = 1024 * 1024;
		let crc = 0;
		let position = 0;
		let ranges: ProductRange[] | undefined;

		try {
			await pipeline(
				Readable.fromWeb(
					response.body as Parameters<typeof Readable.fromWeb>[0],
				),
				zlib.createInflateRaw(),
				async (inflated: AsyncIterable<Buffer>) => {
					for await (const chunk of inflated) {
						crc = zlib.crc32(chunk, crc);

						if (!ranges) {
							head.push(chunk);
							headSize += chunk.length;

							// Inflating yields small chunks, so the head is only put together
							// and tried each time it's doubled, rather than for every one.
							if (headSize < nextAttempt) {
								continue;
							}

							const joined = Buffer.concat(head);
							ranges = findProductRanges(joined);

							if (!ranges) {
								if (headSize > headLimit) {
									throw new Error(
										`Found no product partition in the first ${headLimit.toString()} bytes of the system image.`,
									);
								}

								nextAttempt *= 2;
								continue;
							}

							await writeProductRanges(product, ranges, joined, 0);
							position = headSize;
							head.length = 0;
							continue;
						}

						await writeProductRanges(product, ranges, chunk, position);
						position += chunk.length;
					}
				},
			);
		} catch (error) {
			throw new Error(`Could not read the product partition out of ${url}.`, {
				cause: error,
			});
		}

		if (position !== entry.size) {
			throw new Error(
				`The system image inflated to ${position.toString()} bytes, but the zip says it's ${entry.size.toString()}.`,
			);
		}

		if (crc !== entry.crc32) {
			throw new Error(
				"The system image doesn't match the checksum the zip lists for it.",
			);
		}
	} finally {
		await product.close();
	}
}

/**
 * Fetches a file's text, or undefined if the server says there's no such file.
 */
async function fetchText(url: string) {
	const response = await fetch(url);

	if (response.status === 404) {
		return undefined;
	}

	if (!response.ok) {
		throw new Error(
			`Could not fetch ${url}: ${response.status.toString()} ${response.statusText}.`,
		);
	}

	return await response.text();
}

/**
 * Finds the product partition in the start of the system image, if enough of
 * it has streamed in to say.
 *
 * The GPT header, one sector in, says where its partition entries are, one of
 * which is `super`. Inside that, after 4KB reserved and two 4KB copies of its
 * geometry, is the dynamic partition metadata: a header, then tables of
 * partitions and of the extents each is made of.
 * @see https://android.googlesource.com/platform/system/core/+/refs/heads/main/fs_mgr/liblp/include/liblp/metadata_format.h
 */
function findProductRanges(head: Buffer): ProductRange[] | undefined {
	if (head.length < sectorSize * 2) {
		return undefined;
	}

	if (head.toString("latin1", sectorSize, sectorSize + 8) !== "EFI PART") {
		throw new Error("The system image doesn't start with a GPT header.");
	}

	const entriesStart =
		Number(head.readBigUInt64LE(sectorSize + 72)) * sectorSize;
	const entryCount = head.readUInt32LE(sectorSize + 80);
	const entrySize = head.readUInt32LE(sectorSize + 84);

	if (head.length < entriesStart + entryCount * entrySize) {
		return undefined;
	}

	let superStart: number | undefined;

	for (let index = 0; index < entryCount; index += 1) {
		const entry = entriesStart + index * entrySize;
		const name = head
			.toString("utf16le", entry + 56, entry + 128)
			.replace(/\0.*$/s, "");

		if (name === "super") {
			superStart = Number(head.readBigUInt64LE(entry + 32)) * sectorSize;
		}
	}

	if (superStart === undefined) {
		throw new Error("The system image has no super partition.");
	}

	const geometry = superStart + 4096;
	const metadata = superStart + 4096 * 3;

	if (head.length < metadata + 128) {
		return undefined;
	}

	if (head.readUInt32LE(geometry) !== 0x616c4467) {
		throw new Error("The super partition has no dynamic partition geometry.");
	}

	if (head.readUInt32LE(metadata) !== 0x414c5030) {
		throw new Error("The super partition has no dynamic partition metadata.");
	}

	const headerSize = head.readUInt32LE(metadata + 8);
	const tablesSize = head.readUInt32LE(metadata + 44);
	const tables = metadata + headerSize;

	if (head.length < tables + tablesSize) {
		return undefined;
	}

	const tablesChecksum = crypto
		.createHash("sha256")
		.update(head.subarray(tables, tables + tablesSize))
		.digest();

	if (!tablesChecksum.equals(head.subarray(metadata + 48, metadata + 80))) {
		throw new Error("The dynamic partition tables don't match their checksum.");
	}

	const readTable = (descriptor: number) => ({
		count: head.readUInt32LE(metadata + descriptor + 4),
		offset: tables + head.readUInt32LE(metadata + descriptor),
		size: head.readUInt32LE(metadata + descriptor + 8),
	});

	const partitions = readTable(80);
	const extents = readTable(92);
	const products: ProductRange[][] = [];

	for (let index = 0; index < partitions.count; index += 1) {
		const partition = partitions.offset + index * partitions.size;
		const name = head
			.toString("latin1", partition, partition + 36)
			.replace(/\0.*$/s, "");

		if (!/^product(?:_a)?$/.test(name)) {
			continue;
		}

		const firstExtent = head.readUInt32LE(partition + 40);
		const extentCount = head.readUInt32LE(partition + 44);
		const ranges: ProductRange[] = [];
		let destination = 0;

		for (let extent = 0; extent < extentCount; extent += 1) {
			const at = extents.offset + (firstExtent + extent) * extents.size;
			const length = Number(head.readBigUInt64LE(at)) * sectorSize;
			const targetType = head.readUInt32LE(at + 8);

			// Zero extents read as zeros, which the file already does where
			// nothing's written.
			if (targetType === 0) {
				const start =
					superStart + Number(head.readBigUInt64LE(at + 12)) * sectorSize;
				ranges.push({ destination, end: start + length, start });
			}

			destination += length;
		}

		products.push(ranges);
	}

	if (products.length !== 1) {
		throw new Error(
			`Expected exactly one product partition, but found ${products.length.toString()}.`,
		);
	}

	return products[0];
}

/**
 * Finds one file in a zip, insisting it appears exactly once. A name that
 * starts matching twice is as much a sign of the image having moved on as one
 * that stops matching.
 */
function findZipEntry(
	entries: ZipEntry[],
	matches: (name: string) => boolean,
	source: string,
) {
	const found = entries.filter((entry) => matches(entry.name));

	if (found.length !== 1) {
		throw new Error(
			`Expected exactly one matching file in ${source}, but found ${found.length.toString()}: ${found.map((entry) => entry.name).join(", ")}.`,
		);
	}

	return found[0];
}

/**
 * The newest stable Android system image with Google Play, and so Gboard.
 *
 * The SDK's repository lists them in an XML file whose name carries a schema
 * version, which is bumped now and then, so the newest schema that exists is
 * the one read. Extension builds and betas are left out, and so are the images
 * for 16KB memory pages, whose partitions are formatted as ext4 rather than
 * EROFS. They carry the same Gboard.
 */
async function pickLatestImage() {
	let xml: string | undefined;

	for (let version = knownListingVersion; ; version += 1) {
		const listing = await fetchText(
			`${repositoryUrl}sys-img2-${version.toString()}.xml`,
		);

		if (listing === undefined) {
			break;
		}

		xml = listing;
	}

	if (!xml) {
		throw new Error(`Found no system image listing in ${repositoryUrl}.`);
	}

	const images: SystemImage[] = [];

	for (const [, packagePath, body] of xml.matchAll(
		/<remotePackage path="([^"]+)">(.*?)<\/remotePackage>/gs,
	)) {
		const match =
			/^system-images;android-(\d+(?:\.\d+)?);google_apis_playstore;x86_64$/.exec(
				packagePath,
			);
		const url = /<url>([^<]+)<\/url>/.exec(body)?.[1];

		if (match && url && body.includes('<channelRef ref="channel-0"/>')) {
			images.push({ apiLevel: Number(match[1]), path: packagePath, url });
		}
	}

	const latest = images.sort((a, b) => a.apiLevel - b.apiLevel).at(-1);

	if (!latest) {
		throw new Error("The SDK repository listed no stable Google Play images.");
	}

	return latest;
}

/**
 * Pulls Gboard out of the product partition.
 *
 * The partition is EROFS, which is compressed, so erofs-utils reads it.
 * It needs version 1.8.5 or newer, for `dump.erofs --cat`: Homebrew has one, as
 * does apt on Ubuntu 25.04 and newer.
 */
async function readApk(productPath: string) {
	const superblock = Buffer.alloc(4);
	const product = await fs.open(productPath);

	try {
		await product.read(superblock, 0, 4, 1024);
	} finally {
		await product.close();
	}

	if (superblock.readUInt32LE(0) !== 0xe0f5e1e2) {
		throw new Error(
			"The product partition isn't EROFS, so erofs-utils can't read Gboard out of it.",
		);
	}

	const result = spawnSync(
		"dump.erofs",
		["--cat", `--path=${apkPath}`, productPath],
		{ maxBuffer: 512 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
	);

	const failure = `Could not read ${apkPath} out of the product partition. That needs erofs-utils 1.8.5 or newer, such as with \`brew install erofs-utils\`.`;

	if (result.error) {
		throw new Error(failure, { cause: result.error });
	}

	const stderr = result.stderr.toString().trim();

	if (result.status !== 0 || !result.stdout.length || stderr) {
		throw new Error(
			[
				failure,
				result.signal && `dump.erofs was killed by ${result.signal}.`,
				stderr,
			]
				.filter(Boolean)
				.join("\n"),
		);
	}

	return result.stdout;
}

/**
 * Reads the emoji search dictionary: which terms find which emoji.
 *
 * After its own 16-byte header comes a marisa trie of every term, then, for
 * each term in the trie's ID order, the emoji it finds as indexes into a list
 * of emoji that comes last. The two lists are each preceded by their size,
 * and aligned to eight bytes.
 */
function readDictionary(contents: Buffer) {
	if (contents.readUInt32LE(0) !== dictionaryMagic) {
		throw new Error("The emoji dictionary doesn't start as expected.");
	}

	const { end, keys } = readMarisaKeys(contents, 16);
	let position = end;

	const listsSize = Number(contents.readBigUInt64LE(position));
	const listsEnd = position + 8 + listsSize;
	position += 8;

	const termCount = contents.readUInt32LE(position);
	position += 4;

	if (termCount !== keys.length) {
		throw new Error(
			`The emoji dictionary lists emoji for ${termCount.toString()} terms, but its trie has ${keys.length.toString()}.`,
		);
	}

	const lists: number[][] = [];

	for (let term = 0; term < termCount; term += 1) {
		const count = contents.readUInt32LE(position);
		position += 4;

		const list: number[] = [];
		for (let index = 0; index < count; index += 1) {
			list.push(contents.readUInt32LE(position));
			position += 4;
		}

		lists.push(list);
	}

	if (position !== listsEnd) {
		throw new Error(
			`The emoji dictionary's term lists ended at ${position.toString()}, not ${listsEnd.toString()}.`,
		);
	}

	position = Math.ceil(position / 8) * 8;

	const emojiCount = Number(contents.readBigUInt64LE(position));
	const emojiSize = Number(contents.readBigUInt64LE(position + 8));
	position += 16;

	const emojiEnd = position + emojiSize;
	const emoji: string[] = [];

	while (position < emojiEnd) {
		const length = contents[position];
		emoji.push(contents.toString("utf8", position + 1, position + 1 + length));
		position += 1 + length;
	}

	if (emoji.length !== emojiCount || position !== contents.length) {
		throw new Error(
			`The emoji dictionary's emoji list has ${emoji.length.toString()} emoji and ends at ${position.toString()}, not ${emojiCount.toString()} and ${contents.length.toString()}.`,
		);
	}

	const terms = new Map(emoji.map((glyph) => [glyph, [] as string[]]));

	for (const [term, list] of lists.entries()) {
		for (const index of list) {
			const glyph = emoji.at(index);

			if (glyph === undefined) {
				throw new Error(
					`The term '${keys[term]}' points to emoji ${index.toString()}, past the ${emoji.length.toString()} there are.`,
				);
			}

			terms.get(glyph)?.push(keys[term]);
		}
	}

	return terms;
}

function readLocalZipEntries(zip: Buffer, source: string) {
	const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));

	if (end === -1) {
		throw new Error(`${source} doesn't end like a zip file.`);
	}

	const directorySize = zip.readUInt32LE(end + 12);
	const directoryOffset = zip.readUInt32LE(end + 16);

	return readZipEntries(
		zip.subarray(directoryOffset, directoryOffset + directorySize),
	);
}

function readLocalZipFile(zip: Buffer, entry: ZipEntry) {
	const start =
		entry.offset +
		30 +
		zip.readUInt16LE(entry.offset + 26) +
		zip.readUInt16LE(entry.offset + 28);

	return inflateZipEntry(
		entry,
		zip.subarray(start, start + entry.compressedSize),
	);
}

/**
 * Finds Gboard's bundled English emoji data, a zip inside the app.
 *
 * Gboard downloads emoji data for other languages as it needs them, and can
 * download newer English data too, but the English it ships with is the only
 * data that comes with the app itself. The pack's name carries when it was
 * built, such as emoji_en_us_20250115185814.
 */
function readPack(apk: Buffer) {
	const packEntry = findZipEntry(
		readLocalZipEntries(apk, "Gboard"),
		(name) => packPattern.test(name),
		"Gboard",
	);
	const pack = readLocalZipFile(apk, packEntry);
	const dictionaryEntry = findZipEntry(
		readLocalZipEntries(pack, packEntry.name),
		(name) => name === "en_us",
		packEntry.name,
	);

	return {
		contents: readLocalZipFile(pack, dictionaryEntry),
		pack: path.basename(packEntry.name, ".zip"),
	};
}

/**
 * Turns the dictionary into one entry per emoji, in the dictionary's own order.
 * Keywords are sorted, since the order they come in is only the trie's.
 */
function toEntries(terms: Map<string, string[]>) {
	return [...terms].map(([emoji, keywords]) => ({
		emoji,
		keywords: keywords.sort(compareStrings),
	}));
}

function validate(entries: AndroidItem[], previous: Snapshot | undefined) {
	const problems = checkCounts(entries, previous?.entries, [
		{ ...emojiCount, minimum: minimumEntries },
		{
			count: countKeywords,
			counted: "keywords were read",
			minimum: minimumKeywords,
			name: "Keyword count",
		},
	]);

	checkCanaryKeywords(problems, entries, canaryTerms);

	const empty = entries.filter((entry) => !entry.keywords.length);

	if (empty.length) {
		problems.push(
			`${empty.length.toString()} emoji have no keywords, such as ${empty[0].emoji}.`,
		);
	}

	throwIfProblems(problems, "for Android");
}

/**
 * Writes whatever part of a chunk of the system image falls in the product
 * partition to where it goes in the product partition.
 */
async function writeProductRanges(
	product: fs.FileHandle,
	ranges: ProductRange[],
	chunk: Buffer,
	chunkStart: number,
) {
	const chunkEnd = chunkStart + chunk.length;

	for (const range of ranges) {
		const start = Math.max(range.start, chunkStart);
		const end = Math.min(range.end, chunkEnd);

		if (start < end) {
			await product.write(
				chunk,
				start - chunkStart,
				end - start,
				range.destination + start - range.start,
			);
		}
	}
}

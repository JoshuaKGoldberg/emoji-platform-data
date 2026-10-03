import * as zlib from "node:zlib";

/** Where one file sits inside a zip, and how it's compressed. */
export interface ZipEntry {
	compressedSize: number;
	crc32: number;
	method: number;
	name: string;
	offset: number;
	size: number;
}

interface RemoteZip {
	/** Sent with every request for the zip. */
	headers?: Record<string, string>;

	/** How much of the zip's tail to read when looking for its central directory. */
	tailSize: number;
}

async function fetchRange(
	url: string,
	start: number,
	end: number,
	headers?: Record<string, string>,
) {
	const response = await fetch(url, {
		headers: {
			...headers,
			Range: `bytes=${start.toString()}-${end.toString()}`,
		},
	});

	// A server that ignores the range answers 200 with the whole file, which
	// would be a surprise of hundreds of megabytes or more rather than the
	// slice being asked for.
	if (response.status !== 206) {
		throw new Error(
			`Expected a partial response from ${url}, but got ${response.status.toString()} ${response.statusText}.`,
		);
	}

	return Buffer.from(await response.arrayBuffer());
}

/**
 * Finds where a file's data starts in the remote zip.
 *
 * The central directory says where a file's local header is, but not how long
 * that header is, so the header is read first to find where its data starts.
 */
export async function fetchZipDataStart(
	url: string,
	entry: ZipEntry,
	headers?: Record<string, string>,
) {
	const header = await fetchRange(
		url,
		entry.offset,
		entry.offset + 29,
		headers,
	);

	if (header.readUInt32LE(0) !== 0x04034b50) {
		throw new Error(
			`'${entry.name}' has no local file header where ${url}'s central directory puts it.`,
		);
	}

	return entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
}

export function inflateZipEntry(entry: ZipEntry, compressed: Buffer) {
	checkZipMethod(entry);

	return entry.method === 8 ? zlib.inflateRawSync(compressed) : compressed;
}

function checkZipMethod(entry: ZipEntry) {
	if (entry.method !== 0 && entry.method !== 8) {
		throw new Error(
			`'${entry.name}' is compressed with method ${entry.method.toString()}, which this script can't read.`,
		);
	}
}

/**
 * Reads the remote zip's index: the tail holds a record saying where the
 * central directory is, and the central directory says where every file in it
 * is. Zips over 4GB keep those in a Zip64 record instead.
 */
export async function readCentralDirectory(
	url: string,
	{ headers, tailSize }: RemoteZip,
) {
	const head = await fetch(url, { headers, method: "HEAD" });
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
		Math.max(0, size - tailSize),
		size - 1,
		headers,
	);
	const end = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));

	if (end === -1) {
		throw new Error(`${url} doesn't end like a zip file.`);
	}

	let directorySize = tail.readUInt32LE(end + 12);
	let directoryOffset = tail.readUInt32LE(end + 16);

	if (directorySize === 0xffffffff || directoryOffset === 0xffffffff) {
		const zip64 = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x06, 0x06]));

		if (zip64 === -1) {
			throw new Error(`${url} is missing its Zip64 end record.`);
		}

		directorySize = Number(tail.readBigUInt64LE(zip64 + 40));
		directoryOffset = Number(tail.readBigUInt64LE(zip64 + 48));
	}

	if (directoryOffset + directorySize > size) {
		throw new Error(`${url} has a central directory that runs past its end.`);
	}

	return await fetchRange(
		url,
		directoryOffset,
		directoryOffset + directorySize - 1,
		headers,
	);
}

export function readZipEntries(centralDirectory: Buffer) {
	const entries: ZipEntry[] = [];
	let position = 0;

	while (
		position + 46 <= centralDirectory.length &&
		centralDirectory.readUInt32LE(position) === 0x02014b50
	) {
		const nameLength = centralDirectory.readUInt16LE(position + 28);
		const extraLength = centralDirectory.readUInt16LE(position + 30);
		const commentLength = centralDirectory.readUInt16LE(position + 32);
		const extraStart = position + 46 + nameLength;

		const entry: ZipEntry = {
			compressedSize: centralDirectory.readUInt32LE(position + 20),
			crc32: centralDirectory.readUInt32LE(position + 16),
			method: centralDirectory.readUInt16LE(position + 10),
			name: centralDirectory.toString("utf8", position + 46, extraStart),
			offset: centralDirectory.readUInt32LE(position + 42),
			size: centralDirectory.readUInt32LE(position + 24),
		};

		readZip64Extra(
			entry,
			centralDirectory.subarray(extraStart, extraStart + extraLength),
		);
		entries.push(entry);

		position += 46 + nameLength + extraLength + commentLength;
	}

	return entries;
}

/**
 * Reads one file out of the remote zip.
 */
export async function readZipFile(
	url: string,
	entry: ZipEntry,
	headers?: Record<string, string>,
) {
	checkZipMethod(entry);

	const start = await fetchZipDataStart(url, entry, headers);

	return inflateZipEntry(
		entry,
		await fetchRange(url, start, start + entry.compressedSize - 1, headers),
	);
}

/**
 * Sizes and offsets too large for 32 bits are written as all ones, with the
 * real values in a Zip64 extra field, in the order the fields appear.
 */
function readZip64Extra(entry: ZipEntry, extra: Buffer) {
	for (let position = 0; position + 4 <= extra.length;) {
		const id = extra.readUInt16LE(position);
		const size = extra.readUInt16LE(position + 2);

		if (id === 0x0001) {
			let field = position + 4;

			for (const key of ["size", "compressedSize", "offset"] as const) {
				if (entry[key] === 0xffffffff) {
					entry[key] = Number(extra.readBigUInt64LE(field));
					field += 8;
				}
			}
		}

		position += 4 + size;
	}
}

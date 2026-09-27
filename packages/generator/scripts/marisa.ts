/**
 * Just enough of a reader for marisa-trie's serialized tries to list their
 * keys, for the Gboard emoji data that's stored as one.
 *
 * A marisa trie is a LOUDS trie whose edge labels are single bytes, except
 * where a chain of them is stored as a link: either into a tail buffer, or into
 * another, smaller trie of those chains written in reverse. Each key has an ID,
 * which is its rank among the nodes that end a key.
 * @see https://github.com/s-yata/marisa-trie
 */

interface BitVector {
	get(index: number): boolean;
	ones: number;
	rank1(index: number): number;
	select1(index: number): number;
	size: number;
}

interface FlatVector {
	get(index: number): number;
}

interface LoudsTrie {
	bases: Buffer;
	extras: FlatVector;
	linkFlags: BitVector;
	louds: BitVector;
	nextTrie: LoudsTrie | undefined;
	numL1Nodes: number;
	tail: Tail;
	terminalFlags: BitVector;
}

interface Tail {
	buffer: Buffer;
	endFlags: BitVector | undefined;
}

const magic = "We love Marisa.\0";

class Reader {
	position: number;

	constructor(
		private data: Buffer,
		position: number,
	) {
		this.position = position;
	}

	bytes(length: number) {
		if (this.position + length > this.data.length) {
			throw new Error("The marisa trie runs past the end of its data.");
		}

		const bytes = this.data.subarray(this.position, this.position + length);
		this.position += length;
		return bytes;
	}

	uint32() {
		return this.bytes(4).readUInt32LE(0);
	}

	uint64() {
		return Number(this.bytes(8).readBigUInt64LE(0));
	}

	/**
	 * A Vector: its size in bytes, then its contents, padded to eight bytes.
	 */
	vector() {
		const size = this.uint64();
		const contents = this.bytes(size);
		this.bytes((8 - (size % 8)) % 8);
		return contents;
	}
}

/**
 * Reads a serialized trie that starts at `offset`, returning its keys by ID
 * and where the trie's data ends.
 */
export function readMarisaKeys(data: Buffer, offset: number) {
	const reader = new Reader(data, offset);

	if (reader.bytes(magic.length).toString("latin1") !== magic) {
		throw new Error(`No marisa trie starts at ${offset.toString()}.`);
	}

	const trie = readTrie(reader);
	const keys: string[] = [];

	// Each node that ends a key is a one in the terminal flags, in ID order.
	for (let id = 0; id < trie.terminalFlags.ones; id += 1) {
		keys.push(restoreKey(trie, id).toString("utf8"));
	}

	return { end: reader.position, keys };
}

function getBit(units: Buffer, index: number) {
	return ((units[index >> 3] >> (index & 7)) & 1) === 1;
}

/**
 * A BitVector: its bits, its size and count of ones, then rank and select
 * indexes. Those indexes are only for speed, so they're skipped, and rank and
 * select are worked out from the bits instead: these tries are small.
 */
function readBitVector(reader: Reader): BitVector {
	const units = reader.vector();
	const size = reader.uint32();
	const ones = reader.uint32();
	reader.vector();
	reader.vector();
	reader.vector();

	const ranks = new Uint32Array(size + 1);
	const selects: number[] = [];

	for (let index = 0; index < size; index += 1) {
		const bit = getBit(units, index);
		ranks[index + 1] = ranks[index] + (bit ? 1 : 0);

		if (bit) {
			selects.push(index);
		}
	}

	if (selects.length !== ones) {
		throw new Error(
			`A bit vector says it has ${ones.toString()} ones, but has ${selects.length.toString()}.`,
		);
	}

	return {
		get: (index) => getBit(units, index),
		ones,
		rank1: (index) => ranks[index],
		select1: (index) => selects[index],
		size,
	};
}

/**
 * A FlatVector: values packed at a fixed bit width, then that width and a
 * mask for it as 32-bit numbers, and how many values there are as a 64-bit one.
 */
function getLink(trie: LoudsTrie, nodeId: number) {
	return (
		trie.bases[nodeId] + trie.extras.get(trie.linkFlags.rank1(nodeId)) * 256
	);
}

function readFlatVector(reader: Reader): FlatVector {
	const units = reader.vector();
	const valueSize = reader.uint32();
	reader.uint32();
	reader.uint64();

	return {
		get(index) {
			let value = 0;

			for (let bit = 0; bit < valueSize; bit += 1) {
				if (getBit(units, index * valueSize + bit)) {
					value += 2 ** bit;
				}
			}

			return value;
		},
	};
}

function readTrie(reader: Reader): LoudsTrie {
	const louds = readBitVector(reader);
	const terminalFlags = readBitVector(reader);
	const linkFlags = readBitVector(reader);
	const bases = reader.vector();
	const extras = readFlatVector(reader);
	const tailBuffer = reader.vector();
	const endFlags = readBitVector(reader);

	// Tails are either null-terminated, or marked by end flags when a key's
	// bytes can include null.
	const tail = {
		buffer: tailBuffer,
		endFlags: endFlags.size ? endFlags : undefined,
	};

	// Chains go in a tail buffer in the smallest trie, and in another trie
	// otherwise, which is written right after this one.
	const nextTrie =
		linkFlags.ones && !tailBuffer.length ? readTrie(reader) : undefined;

	// The cache only speeds up lookups, and the config only matters for
	// building, so neither is needed to read keys back out.
	reader.vector();
	const numL1Nodes = reader.uint32();
	reader.uint32();

	return {
		bases,
		extras,
		linkFlags,
		louds,
		nextTrie,
		numL1Nodes,
		tail,
		terminalFlags,
	};
}

/**
 * Appends the chain a link points to, in the order it's stored in.
 */
function restoreLink(trie: LoudsTrie, link: number, bytes: number[]) {
	if (trie.nextTrie) {
		restoreFromNode(trie.nextTrie, link, bytes);
		return;
	}

	const { buffer, endFlags } = trie.tail;

	if (!endFlags) {
		for (let index = link; buffer[index] !== 0; index += 1) {
			bytes.push(buffer[index]);
		}

		return;
	}

	let index = link;
	do {
		bytes.push(buffer[index]);
	} while (!endFlags.get(index++));
}

/**
 * Walks from a node up to the root, appending each label on the way, which
 * spells the key in reverse.
 */
function restoreFromNode(trie: LoudsTrie, start: number, bytes: number[]) {
	let nodeId = start;

	for (;;) {
		if (trie.linkFlags.get(nodeId)) {
			restoreLink(trie, getLink(trie, nodeId), bytes);
		} else {
			bytes.push(trie.bases[nodeId]);
		}

		if (nodeId <= trie.numL1Nodes) {
			return;
		}

		nodeId = trie.louds.select1(nodeId) - nodeId - 1;
	}
}

function restoreKey(trie: LoudsTrie, id: number) {
	const bytes: number[] = [];
	let nodeId = trie.terminalFlags.select1(id);

	if (nodeId === 0) {
		return Buffer.alloc(0);
	}

	for (;;) {
		if (trie.linkFlags.get(nodeId)) {
			// Links are stored in the order they're read, but everything else here
			// is gathered from the leaf up, so each link's chain is flipped to match.
			const linked: number[] = [];
			restoreLink(trie, getLink(trie, nodeId), linked);
			bytes.push(...linked.reverse());
		} else {
			bytes.push(trie.bases[nodeId]);
		}

		if (nodeId <= trie.numL1Nodes) {
			return Buffer.from(bytes.reverse());
		}

		nodeId = trie.louds.select1(nodeId) - nodeId - 1;
	}
}

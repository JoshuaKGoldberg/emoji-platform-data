import * as fs from "node:fs/promises";

interface SnapshotWrite<Snapshot extends { entries: unknown[] }> {
	/**
	 * The fields holding the data itself, rather than where it was read from.
	 * Only a change in these rewrites the snapshot.
	 */
	dataFields?: (keyof Snapshot)[];

	/** Added to the message when the snapshot is written, such as ", with keywords for 1500 of them". */
	details?: string;

	/** Where the data was read from, such as "GTK 4.18.6". */
	from: string;

	previous: Snapshot | undefined;
	snapshot: Snapshot;
	snapshotPath: string;
}

export async function readPreviousSnapshot<Snapshot>(snapshotPath: string) {
	try {
		return JSON.parse(await fs.readFile(snapshotPath, "utf8")) as Snapshot;
	} catch {
		return undefined;
	}
}

/**
 * Writes the snapshot, unless its data is the same as the previous snapshot's.
 */
export async function writeSnapshot<Snapshot extends { entries: unknown[] }>({
	dataFields = ["entries"],
	details = "",
	from,
	previous,
	snapshot,
	snapshotPath,
}: SnapshotWrite<Snapshot>) {
	const count = snapshot.entries.length.toString();

	if (
		previous &&
		dataFields.every((field) => isSameData(previous[field], snapshot[field]))
	) {
		console.log(
			`Read ${count} emoji from ${from}, unchanged from the snapshot.`,
		);
		return;
	}

	await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");
	console.log(`Wrote ${count} emoji from ${from}${details}.`);
}

function isSameData(left: unknown, right: unknown) {
	return JSON.stringify(left) === JSON.stringify(right);
}

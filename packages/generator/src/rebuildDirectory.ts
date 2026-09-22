import * as fs from "node:fs/promises";
import * as path from "node:path";

import { generateAll } from "./all.js";
import { formatExportLine } from "./formatExportLine.js";
import { EmojiPlatformData } from "./types.js";

export type EmojiPlatformDataSource =
	"emojipedia" | "fluemoji" | "gemoji" | "twemoji";

export interface RebuildSettings {
	directory: string;
}

export interface RebuildSourceSettings extends RebuildSettings {
	source: EmojiPlatformDataSource;
}

interface DataEntry {
	data: unknown;
	platformData: EmojiPlatformData;
}

interface WriteDataDirectorySettings {
	directory: string;
	entries: DataEntry[];
	typeName: string;
}

const sourceTypeNames: Record<EmojiPlatformDataSource, string> = {
	emojipedia: "EmojipediaItem",
	fluemoji: "FluemojiItem",
	gemoji: "GemojiItem",
	twemoji: "TwemojiItem",
};

/**
 * Regenerates a directory exporting the combined data of all platforms.
 */
export async function rebuildDirectory({ directory }: RebuildSettings) {
	const byTitle = await generateAll();

	await writeDataDirectory({
		directory,
		entries: Object.values(byTitle).map((platformData) => ({
			data: platformData,
			platformData,
		})),
		typeName: "EmojiPlatformData",
	});
}

/**
 * Regenerates a directory exporting only the data from a single platform.
 */
export async function rebuildSourceDirectory({
	directory,
	source,
}: RebuildSourceSettings) {
	const byTitle = await generateAll();

	await writeDataDirectory({
		directory,
		entries: Object.values(byTitle)
			.filter((platformData) => platformData[source])
			.map((platformData) => ({
				data: platformData[source],
				platformData,
			})),
		typeName: sourceTypeNames[source],
	});
}

async function writeDataDirectory({
	directory,
	entries,
	typeName,
}: WriteDataDirectorySettings) {
	await fs.rm(directory, { force: true, recursive: true });
	await fs.mkdir(path.join(directory, "data"), { recursive: true });

	const byTitleFile = path.join(directory, "byTitle");
	const exportLines: string[] = [];
	const byEmojiLines: string[] = [];

	for (const { data, platformData } of entries) {
		const { slug } = platformData;
		const { exportLine, exportName } = formatExportLine(
			platformData.emojipedia?.currentCldrName,
			slug,
			platformData.title,
		);

		exportLines.push(exportLine);
		byEmojiLines.push(
			`\t${JSON.stringify(platformData.emoji)}: byTitle.${exportName},`,
		);

		await fs.writeFile(
			path.join(directory, "data", `${slug}.json`),
			JSON.stringify(sortObjectKeys(data), null, 4),
		);
	}

	await Promise.all([
		fs.writeFile(`${byTitleFile}.d.mts`, exportLines.join("")),
		fs.writeFile(`${byTitleFile}.mjs`, exportLines.join("")),
		fs.writeFile(
			path.join(directory, "index.d.mts"),
			[
				`export const byEmoji: Record<string, ${typeName}>;`,
				`export const byTitle: Record<string, ${typeName}>;`,
				"",
				await readDataTypes(),
			].join("\n"),
		),
		fs.writeFile(
			path.join(directory, "index.mjs"),
			[
				`import * as byTitle from "./byTitle.mjs";`,
				"",
				`export { byTitle };`,
				"",
				`export const byEmoji = {`,
				...byEmojiLines,
				`};`,
				"",
			].join("\n"),
		),
	]);
}

/**
 * Reads the compiled declarations for dataTypes.ts, which are emitted next to
 * this file, to inline into each data package's index.d.mts.
 */
async function readDataTypes() {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, "dataTypes.d.ts"),
		"utf8",
	);

	return raw
		.split("\n")
		.filter((line) => !line.startsWith("//# sourceMappingURL="))
		.join("\n");
}

function sortObjectKeys(data: unknown) {
	if (typeof data !== "object" || data === null) {
		return data;
	}

	return Object.fromEntries(
		Object.entries(data).sort(([a], [b]) => a.localeCompare(b)),
	);
}

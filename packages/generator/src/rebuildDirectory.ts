import * as fs from "node:fs/promises";
import * as path from "node:path";

import { generateAll, GenerateAllSettings, getEmojiGlyphs } from "./all.js";
import { compareStrings } from "./compareStrings.js";
import { formatExportLine } from "./formatExportLine.js";
import { EmojiPlatformData } from "./types.js";

export type EmojiPlatformDataSource =
	| "android"
	| "discord"
	| "emojiMart"
	| "emojipedia"
	| "fluemoji"
	| "gemoji"
	| "gnome"
	| "joypixels"
	| "macos"
	| "slack"
	| "twemoji"
	| "wechat"
	| "windows";

export interface RebuildSettings extends GenerateAllSettings {
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
	android: "AndroidItem",
	discord: "DiscordItem",
	emojiMart: "EmojiMartItem",
	emojipedia: "EmojipediaItem",
	fluemoji: "FluemojiItem",
	gemoji: "GemojiItem",
	gnome: "GnomeItem",
	joypixels: "JoyPixelsItem",
	macos: "MacOSItem",
	slack: "SlackItem",
	twemoji: "TwemojiItem",
	wechat: "WeChatItem",
	windows: "WindowsItem",
};

/**
 * Regenerates a directory exporting the combined data of all platforms.
 */
export async function rebuildDirectory({
	directory,
	...settings
}: RebuildSettings) {
	const byTitle = await generateAll(settings);

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
	...settings
}: RebuildSourceSettings) {
	const byTitle = await generateAll(settings);

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
	const exportNames = new Set<string>();
	const exportLines: string[] = [];
	const declarationLines: string[] = [];
	const byEmojiLines: string[] = [];

	// Which export each byEmoji key points to, so that two entries can't both
	// claim a glyph: the later one would silently win in the object literal.
	const byEmojiOwners = new Map<string, string>();

	for (const { data, platformData } of entries) {
		const { slug } = platformData;

		// Slugs become file names, so a stray `:` or `/` would break the build on
		// Windows or every platform respectively, and only for whoever runs it.
		if (!/^[a-z0-9-]+$/.test(slug)) {
			throw new Error(
				`Slug '${slug}' for '${platformData.title}' isn't file name safe.`,
			);
		}

		const { exportLine, exportName } = formatExportLine(
			platformData.emojipedia?.currentCldrName,
			slug,
			platformData.title,
		);

		// Export names become identifiers in the generated modules, which build
		// fine either way but throw a SyntaxError on import if one isn't valid.
		if (
			!/^[\p{ID_Start}$_][\p{ID_Continue}$\u200C\u200D]*$/u.test(exportName)
		) {
			throw new Error(
				`Export name '${exportName}' for '${platformData.title}' isn't a valid identifier.`,
			);
		}

		if (exportNames.has(exportName)) {
			throw new Error(
				`Export name '${exportName}' for '${platformData.title}' is used more than once.`,
			);
		}

		exportNames.add(exportName);
		exportLines.push(exportLine);
		declarationLines.push(`export const ${exportName}: ${typeName};`);

		for (const glyph of getEmojiGlyphs(platformData)) {
			const owner = byEmojiOwners.get(glyph);

			if (owner === undefined) {
				byEmojiOwners.set(glyph, exportName);
				byEmojiLines.push(`\t${JSON.stringify(glyph)}: byTitle.${exportName},`);
			} else if (owner !== exportName) {
				throw new Error(
					`'${platformData.title}' and '${owner}' are both known as ${glyph}.`,
				);
			}
		}

		await fs.writeFile(
			path.join(directory, "data", `${slug}.json`),
			JSON.stringify(sortObjectKeys(data), null, 4),
		);
	}

	await Promise.all([
		fs.writeFile(
			`${byTitleFile}.d.mts`,
			[
				`import type { ${typeName} } from "./index.mjs";`,
				"",
				...declarationLines,
				"",
			].join("\n"),
		),
		fs.writeFile(`${byTitleFile}.mjs`, exportLines.join("")),
		fs.writeFile(
			path.join(directory, "index.d.mts"),
			[
				`import * as byTitle from "./byTitle.mjs";`,
				"",
				`export { byTitle };`,
				"",
				`export const byEmoji: Record<string, ${typeName}>;`,
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
 * Reads the compiled declarations for dataTypes.ts, which are emitted into the
 * generator's lib, to inline into each data package's index.d.mts.
 */
async function readDataTypes() {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, "../lib/dataTypes.d.ts"),
		"utf8",
	);

	return raw
		.split("\n")
		.filter((line) => !line.startsWith("//# sourceMappingURL="))
		.join("\n");
}

function sortObjectKeys(data: unknown): unknown {
	if (Array.isArray(data)) {
		return data.map(sortObjectKeys);
	}

	if (typeof data !== "object" || data === null) {
		return data;
	}

	return Object.fromEntries(
		Object.entries(data)
			.sort(([a], [b]) => compareStrings(a, b))
			.map(([key, value]) => [key, sortObjectKeys(value)]),
	);
}

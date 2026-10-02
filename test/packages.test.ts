import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

import {
	EmojiPlatformDataSource,
	rebuildDirectory,
	rebuildSourceDirectory,
} from "../packages/generator/src/index.js";

/**
 * What every data package exports, keyed by glyph and by PascalCase title.
 */
interface DataExports {
	byEmoji: Record<string, unknown>;
	byTitle: Record<string, unknown>;
}

interface DataPackage {
	directory: string;
	entry: string;
	name: string;
}

/**
 * The package combining every platform, which the others each take one of.
 */
const combinedName = "emoji-platform-data";

const packagesDirectory = path.join(import.meta.dirname, "../packages");

/**
 * Every package whose export is generated into its lib/ directory, which is all
 * of them but the generator. They're found rather than listed, so that a newly
 * added platform is tested without anyone having to remember to add it here.
 */
async function listDataPackages() {
	const dataPackages: DataPackage[] = [];

	for (const directory of await fs.readdir(packagesDirectory)) {
		const { exports, name } = JSON.parse(
			await fs.readFile(
				path.join(packagesDirectory, directory, "package.json"),
				"utf8",
			),
		) as { exports: Record<string, unknown>; name: string };
		const entry = exports["."];

		if (typeof entry === "string" && entry.startsWith("./lib/")) {
			dataPackages.push({
				directory: path.join(packagesDirectory, directory),
				entry,
				name,
			});
		}
	}

	return dataPackages;
}

/**
 * Imports a package through its package.json export, as a consumer would.
 */
async function importPackage({ directory, entry, name }: DataPackage) {
	const file = path.join(directory, entry);

	try {
		await fs.access(file);
	} catch {
		throw new Error(`${name} has no ${entry}; run pnpm build first.`);
	}

	return (await import(pathToFileURL(file).href)) as DataExports;
}

/**
 * Every file under a directory, keyed by its path relative to the directory.
 */
async function readFiles(directory: string) {
	const files: Record<string, string> = {};

	for (const entry of await fs.readdir(directory, {
		recursive: true,
		withFileTypes: true,
	})) {
		if (entry.isFile()) {
			const file = path.join(entry.parentPath, entry.name);
			files[path.relative(directory, file)] = await fs.readFile(file, "utf8");
		}
	}

	return files;
}

/**
 * The key a platform's data sits under in the combined package, such as
 * "emojiMart" for `@emoji-platform-data/emoji-mart`.
 */
function toSourceKey(name: string) {
	return name
		.replace("@emoji-platform-data/", "")
		.replaceAll(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * How many emoji each platform's committed snapshot has, keyed by the package
 * directory it's published from, for the platforms that are read from one.
 */
async function countSnapshotEntries(dataPackages: DataPackage[]) {
	const counts = new Map<string, number>();

	for (const { directory } of dataPackages) {
		const snapshot = path.join(
			packagesDirectory,
			"generator",
			`${path.basename(directory)}.json`,
		);

		try {
			const { entries } = JSON.parse(await fs.readFile(snapshot, "utf8")) as {
				entries: unknown[];
			};
			counts.set(directory, entries.length);
		} catch {
			// This platform's data comes from a dependency, not a snapshot.
		}
	}

	return counts;
}

/**
 * The glyph a platform's data is for. Emojipedia's is left out, since its data
 * lists a few emoji under glyphs no platform uses, such as 🧕 as 🧕‍♀️.
 */
function getPlatformGlyph(source: string, data: unknown) {
	switch (source) {
		case "emojiMart":
			return (data as { skins: { native: string }[] }).skins[0].native;
		case "emojipedia":
			return undefined;
		case "fluemoji":
			return (data as { glyph: string }).glyph;
		case "twemoji":
			return String.fromCodePoint(
				...(data as { unicode: string }).unicode
					.split("-")
					.map((hex) => parseInt(hex, 16)),
			);
		default:
			return (data as { emoji: string }).emoji;
	}
}

function withoutVariationSelectors(glyph: string) {
	return glyph.replaceAll("\uFE0F", "");
}

const dataPackages = await listDataPackages();

const snapshotCounts = await countSnapshotEntries(dataPackages);

const combinedPackage = dataPackages.find(
	(dataPackage) => dataPackage.name === combinedName,
);

if (!combinedPackage) {
	throw new Error(`Could not find the ${combinedName} package.`);
}

describe.each(dataPackages)("$name", (dataPackage) => {
	it("exports byEmoji and byTitle when imported by Node", async () => {
		const { byEmoji, byTitle } = await importPackage(dataPackage);

		expect(Object.keys(byEmoji).length).toBeGreaterThan(1000);
		expect(Object.keys(byTitle).length).toBeGreaterThan(1000);
	});

	it("reaches every byTitle entry from byEmoji when platforms title one emoji two ways", async () => {
		const { byEmoji, byTitle } = await importPackage(dataPackage);
		const fromTitle = new Set(Object.values(byTitle));
		const fromEmoji = new Set(Object.values(byEmoji));

		expect([...fromEmoji].filter((entry) => !fromTitle.has(entry))).toEqual([]);
		expect(fromEmoji.size).toBe(fromTitle.size);
	});

	it("resolves its byTitle entry point when imported directly", async () => {
		const { exports } = JSON.parse(
			await fs.readFile(
				path.join(dataPackage.directory, "package.json"),
				"utf8",
			),
		) as { exports: Record<string, string> };

		await expect(
			import(
				pathToFileURL(path.join(dataPackage.directory, exports["./byTitle"]))
					.href
			),
		).resolves.toBeDefined();
	});

	it("writes the same files as its lib when rebuilt from the generator's source", async () => {
		const directory = await fs.mkdtemp(
			path.join(os.tmpdir(), "emoji-platform-data-"),
		);

		try {
			await (dataPackage === combinedPackage
				? rebuildDirectory({ directory })
				: rebuildSourceDirectory({
						directory,
						source: toSourceKey(dataPackage.name) as EmojiPlatformDataSource,
					}));

			expect(await readFiles(directory)).toEqual(
				await readFiles(path.join(dataPackage.directory, "lib")),
			);
		} finally {
			await fs.rm(directory, { force: true, recursive: true });
		}
	});

	it("names byTitle exports without underscores when a name has digits", async () => {
		const { byTitle } = await importPackage(dataPackage);

		expect(Object.keys(byTitle).filter((name) => name.includes("_"))).toEqual(
			[],
		);
	});

	it("keys byEmoji by glyph when an emoji only has Twemoji's code points", async () => {
		const { byEmoji } = await importPackage(dataPackage);

		expect(
			Object.keys(byEmoji).filter((emoji) => /^[\da-f-]+$/.test(emoji)),
		).toEqual([]);
	});

	it("looks up every entry by its platform's glyph when the glyph has or lacks variation selectors", async () => {
		const { byEmoji, byTitle } = await importPackage(dataPackage);
		const source =
			dataPackage === combinedPackage
				? undefined
				: toSourceKey(dataPackage.name);
		const misses = Object.values(byTitle).flatMap((entry) => {
			const glyph = source
				? getPlatformGlyph(source, entry)
				: (entry as { emoji: string }).emoji;

			return glyph
				? [glyph, withoutVariationSelectors(glyph)].filter(
						(candidate) => byEmoji[candidate] !== entry,
					)
				: [];
		});

		expect(misses).toEqual([]);
	});

	it("writes a separate data file for every byTitle entry when two titles share a slug", async () => {
		const { byTitle } = await importPackage(dataPackage);
		const files = await fs.readdir(
			path.join(dataPackage.directory, "lib/data"),
		);

		expect(files).toHaveLength(Object.keys(byTitle).length);
	});

	const snapshotCount = snapshotCounts.get(dataPackage.directory);

	if (snapshotCount !== undefined) {
		it("has an entry for every emoji in its platform's snapshot when read from one", async () => {
			const { byTitle } = await importPackage(dataPackage);

			expect(Object.keys(byTitle)).toHaveLength(snapshotCount);
		});
	}

	if (dataPackage !== combinedPackage) {
		it(`has the same entries as ${combinedName}'s ${toSourceKey(dataPackage.name)} data when it's a single platform's package`, async () => {
			const source = toSourceKey(dataPackage.name);
			const combined = await importPackage(combinedPackage);
			const { byTitle } = await importPackage(dataPackage);

			expect(Object.values(byTitle)).toEqual(
				Object.values(combined.byTitle)
					.map((entry) => (entry as Record<string, unknown>)[source])
					.filter((entry) => entry !== undefined),
			);
		});
	}
});

describe(combinedName, () => {
	it("keeps both emoji when Emojipedia titles them the same", async () => {
		const { byEmoji } = await importPackage(combinedPackage);

		for (const emoji of ["🤵", "🤵‍♂️", "👯", "👯‍♀️"]) {
			expect(byEmoji[emoji]).toMatchObject({ emoji, macos: { emoji } });
		}
	});

	it("gives each emoji its own Twemoji data when Twemoji's description names another emoji", async () => {
		const { byEmoji } = await importPackage(combinedPackage);

		for (const [emoji, unicode] of [
			["😁", "1f601"],
			["😄", "1f604"],
			["👰", "1f470"],
			["👰‍♀️", "1f470-200d-2640-fe0f"],
			["🕴️", "1f574"],
			["🕴️‍♂️", "1f574-fe0f-200d-2642-fe0f"],
			["☃️", "2603"],
			["⛄", "26c4"],
		]) {
			expect(byEmoji[emoji]).toMatchObject({ emoji, twemoji: { unicode } });
		}
	});

	it("keys an emoji by platforms' glyph when Emojipedia's glyph differs", async () => {
		const { byEmoji } = await importPackage(combinedPackage);

		expect(byEmoji["🧕‍♀️"]).toBe(byEmoji["🧕"]);
		expect(byEmoji["🧕"]).toMatchObject({
			android: { emoji: "🧕" },
			emoji: "🧕",
			emojipedia: { code: "🧕‍♀️" },
			macos: { emoji: "🧕" },
			slack: { emoji: "🧕" },
			wechat: { emoji: "🧕" },
		});
	});

	it("titles emoji without underscores when a title comes from a platform's shortcode", async () => {
		const { byTitle } = await importPackage(combinedPackage);

		expect(
			Object.values(byTitle)
				.map((entry) => (entry as { title: string }).title)
				.filter((title) => title.includes("_")),
		).toEqual([]);
	});

	it("looks up an emoji by every glyph its platforms write it as when they disagree on variation selectors", async () => {
		const { byEmoji, byTitle } = await importPackage(combinedPackage);
		const misses = Object.values(byTitle).flatMap((entry) =>
			Object.entries(entry as Record<string, unknown>)
				.filter(([key]) => !["emoji", "slug", "title"].includes(key))
				.flatMap(([source, data]) => {
					const glyph =
						source === "emojipedia"
							? (data as { code: string }).code
							: getPlatformGlyph(source, data);

					return glyph && byEmoji[glyph] !== entry
						? [
								`${source} writes ${(entry as { emoji: string }).emoji} as ${glyph}`,
							]
						: [];
				}),
		);

		expect(misses).toEqual([]);
	});

	it("finds the same entry with or without a variation selector when macOS and Twemoji write an emoji differently", async () => {
		const { byEmoji } = await importPackage(combinedPackage);

		expect(byEmoji["⚓"]).toMatchObject({ emoji: "⚓", title: "Anchor" });
		expect(byEmoji["⚓️"]).toBe(byEmoji["⚓"]);
		expect(byEmoji["✈️"]).toMatchObject({ emoji: "✈️", title: "Airplane" });
		expect(byEmoji["✈"]).toBe(byEmoji["✈️"]);
	});

	it("places emoji in macOS's picker categories when the picker lists them with a variation selector", async () => {
		const { byEmoji } = await importPackage(combinedPackage);

		for (const emoji of ["⏩", "⏪", "⏫", "⏬"]) {
			expect(byEmoji[emoji]).toMatchObject({ macos: { category: "Symbols" } });
		}
	});

	it("leaves out empty keywords when a source's keyword list has them", async () => {
		const { byEmoji } = await importPackage(combinedPackage);

		for (const [emoji, source] of [
			["😐", "emojiMart"],
			["😑", "emojiMart"],
			["#️⃣", "emojiMart"],
			["*️⃣", "emojiMart"],
			["👨‍👩‍👧", "twemoji"],
		]) {
			const entry = byEmoji[emoji] as Record<string, { keywords: string[] }>;

			expect(entry[source].keywords).not.toContain("");
		}
	});

	it("finds the same entry when an emoji is written with only some of its variation selectors", async () => {
		const { byEmoji } = await importPackage(combinedPackage);

		expect(byEmoji["🏳️‍⚧️"]).toMatchObject({ title: "Transgender Flag" });
		expect(byEmoji["\u{1F3F3}\uFE0F\u200D\u26A7"]).toBe(byEmoji["🏳️‍⚧️"]);
		expect(byEmoji["\u{1F3F3}\u200D\u26A7\uFE0F"]).toBe(byEmoji["🏳️‍⚧️"]);
		expect(byEmoji["\u{1F575}\uFE0F\u200D\u2642"]).toBe(byEmoji["🕵️‍♂️"]);
	});

	it("gives an emoji GNOME's other locales when they write it as its skin tone template", async () => {
		const { byEmoji } = await importPackage(combinedPackage);

		expect(byEmoji["👯‍♂️"]).toMatchObject({
			gnome: { namesByLocale: { de: "Männer mit Hasenohren" } },
		});
		expect(byEmoji["👨‍🐰‍👨"]).toBeUndefined();
	});

	it("gives each emoji only data for its own glyph when platforms are matched to it by name", async () => {
		const { byTitle } = await importPackage(combinedPackage);
		const mismatches = Object.values(byTitle).flatMap((entry) => {
			const { emoji } = entry as { emoji: string };

			return Object.entries(entry as Record<string, unknown>)
				.filter(([key]) => !["emoji", "slug", "title"].includes(key))
				.flatMap(([source, data]) => {
					const glyph = getPlatformGlyph(source, data);

					return glyph &&
						withoutVariationSelectors(glyph) !==
							withoutVariationSelectors(emoji)
						? [`${emoji} has ${source} data for ${glyph}`]
						: [];
				});
		});

		expect(mismatches).toEqual([]);
	});
});

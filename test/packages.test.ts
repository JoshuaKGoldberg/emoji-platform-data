import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

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
 * The key a platform's data sits under in the combined package, such as
 * "emojiMart" for `@emoji-platform-data/emoji-mart`.
 */
function toSourceKey(name: string) {
	return name
		.replace("@emoji-platform-data/", "")
		.replaceAll(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
}

const dataPackages = await listDataPackages();

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

	it("reaches every byTitle entry from byEmoji", async () => {
		const { byEmoji, byTitle } = await importPackage(dataPackage);
		const fromTitle = new Set(Object.values(byTitle));
		const fromEmoji = new Set(Object.values(byEmoji));

		expect([...fromEmoji].filter((entry) => !fromTitle.has(entry))).toEqual([]);
		expect(fromEmoji.size).toBe(fromTitle.size);
	});

	it("writes a separate data file for every byTitle entry", async () => {
		const { byTitle } = await importPackage(dataPackage);
		const files = await fs.readdir(
			path.join(dataPackage.directory, "lib/data"),
		);

		expect(files).toHaveLength(Object.keys(byTitle).length);
	});

	if (dataPackage !== combinedPackage) {
		it(`has the same entries as ${combinedName}'s ${toSourceKey(dataPackage.name)} data`, async () => {
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

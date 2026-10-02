import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GeneratedEmojipediaData } from "../packages/generator/src/emojipedia.js";
import { generateFluemoji } from "../packages/generator/src/fluemoji.js";
import { FluemojiItem } from "../packages/generator/src/types.js";

const emojipedia: GeneratedEmojipediaData = {
	aliases: new Map(),
	byCldr: {},
	byCode: {},
	items: [],
};

let directory: string;

beforeEach(async () => {
	directory = await fs.mkdtemp(path.join(os.tmpdir(), "emoji-platform-data-"));
});

afterEach(async () => {
	vi.restoreAllMocks();
	await fs.rm(directory, { force: true, recursive: true });
});

async function writeAsset(entry: FluemojiItem) {
	const assetDirectory = path.join(directory, "assets", entry.cldr);

	await fs.mkdir(assetDirectory, { recursive: true });
	await fs.writeFile(
		path.join(assetDirectory, "metadata.json"),
		JSON.stringify(entry),
	);
}

const wheelchair: FluemojiItem = {
	cldr: "woman in motorized wheelchair",
	fromVersion: "12.0",
	glyph: "\u{1F469}\u200D\u{1F9BC}",
	group: "People & Body",
	keywords: [],
	tts: "woman in motorized wheelchair",
	unicode: "1f469 200d 1f9bc",
};

describe(generateFluemoji, () => {
	it("keeps an entry's glyph when it matches its unicode", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		await writeAsset(wheelchair);

		expect(await generateFluemoji(emojipedia, directory)).toEqual({
			"Woman in Motorized Wheelchair": wheelchair,
		});
		expect(warn).not.toHaveBeenCalled();
	});

	it("takes an entry's glyph from its unicode and warns when they don't match", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const facingRight = {
			...wheelchair,
			cldr: "woman in motorized wheelchair facing right",
			tts: "woman in motorized wheelchair facing right",
			unicode: "1f469 200d 1f9bc 200d 27a1 fe0f",
		};
		const glyph = "\u{1F469}\u200D\u{1F9BC}\u200D\u27A1\uFE0F";

		await writeAsset(facingRight);

		expect(await generateFluemoji(emojipedia, directory)).toEqual({
			"Woman in Motorized Wheelchair Facing Right": { ...facingRight, glyph },
		});
		expect(warn).toHaveBeenCalledExactlyOnceWith(
			`fluemoji glyph for 'woman in motorized wheelchair facing right' (${wheelchair.glyph}) doesn't match its unicode (1f469 200d 1f9bc 200d 27a1 fe0f); using ${glyph}.`,
		);
	});
});

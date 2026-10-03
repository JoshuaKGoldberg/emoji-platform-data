import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GeneratedEmojipediaData } from "../packages/generator/src/emojipedia.js";
import { generateFluemoji } from "../packages/generator/src/fluemoji.js";

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
	await fs.rm(directory, { force: true, recursive: true });
});

describe(generateFluemoji, () => {
	it("throws when the directory has no assets", async () => {
		await expect(generateFluemoji(emojipedia, directory)).rejects.toThrow(
			`No fluemoji assets found in ${directory}.`,
		);
	});
});

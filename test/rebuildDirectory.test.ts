import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateAll } from "../packages/generator/src/all.js";
import {
	EmojiPlatformDataSource,
	rebuildDirectory,
	rebuildSourceDirectory,
} from "../packages/generator/src/rebuildDirectory.js";
import { DiscordItem } from "../packages/generator/src/types.js";

vi.mock("../packages/generator/src/all.js", { spy: true });

const brokenChain = "⛓️‍💥";

let directory: string;

beforeEach(async () => {
	directory = await fs.mkdtemp(path.join(os.tmpdir(), "emoji-platform-data-"));
});

afterEach(async () => {
	await fs.rm(directory, { force: true, recursive: true });
});

describe(rebuildDirectory, () => {
	it.each(["broken:chain", "broken/chain", "Broken-Chain"])(
		"throws when a slug is %s",
		async (slug) => {
			vi.mocked(generateAll).mockResolvedValueOnce({
				"Broken Chain": { emoji: brokenChain, slug, title: "Broken Chain" },
			});

			await expect(rebuildDirectory({ directory })).rejects.toThrow(
				`Slug '${slug}' for 'Broken Chain' isn't file name safe.`,
			);
		},
	);

	it("throws when an export name would start with a digit", async () => {
		vi.mocked(generateAll).mockResolvedValueOnce({
			"1st Place Medal": {
				emoji: "🥇",
				slug: "1st-place-medal",
				title: "1st Place Medal",
			},
		});

		await expect(rebuildDirectory({ directory })).rejects.toThrow(
			"Export name '1stPlaceMedal' for '1st Place Medal' isn't a valid identifier.",
		);
	});

	it("throws when two titles have the same export name", async () => {
		vi.mocked(generateAll).mockResolvedValueOnce({
			Broken_chain: {
				emoji: brokenChain,
				slug: "broken-chain",
				title: "Broken_chain",
			},
			"Broken Chain": {
				emoji: "⛓️",
				slug: "broken-chain-2",
				title: "Broken Chain",
			},
		});

		await expect(rebuildDirectory({ directory })).rejects.toThrow(
			"Export name 'BrokenChain' for 'Broken Chain' is used more than once.",
		);
	});

	it("throws when two titles are known by the same glyph", async () => {
		vi.mocked(generateAll).mockResolvedValueOnce({
			"Broken Chain": {
				emoji: brokenChain,
				slug: "broken-chain",
				title: "Broken Chain",
			},
			"Chain Broken": {
				emoji: brokenChain,
				slug: "chain-broken",
				title: "Chain Broken",
			},
		});

		await expect(rebuildDirectory({ directory })).rejects.toThrow(
			`'Chain Broken' and 'BrokenChain' are both known as ${brokenChain}.`,
		);
	});
});

describe(rebuildSourceDirectory, () => {
	it("throws when one title's platform data has another title's glyph", async () => {
		const discord = { emoji: brokenChain } as DiscordItem;

		vi.mocked(generateAll).mockResolvedValueOnce({
			"Broken Chain": {
				discord,
				emoji: brokenChain,
				slug: "broken-chain",
				title: "Broken Chain",
			},
			"Chain Broken": {
				discord,
				emoji: "⛓️",
				slug: "chain-broken",
				title: "Chain Broken",
			},
		});

		await expect(
			rebuildSourceDirectory({ directory, source: "discord" }),
		).rejects.toThrow(
			`'Chain Broken' and 'BrokenChain' are both known as ${brokenChain}.`,
		);
	});

	it("throws when asked for a source it has no types for", async () => {
		vi.mocked(generateAll).mockResolvedValueOnce({});

		await expect(
			rebuildSourceDirectory({
				directory,
				source: "unknown" as EmojiPlatformDataSource,
			}),
		).rejects.toThrow("dataTypes.d.ts doesn't declare");
	});
});

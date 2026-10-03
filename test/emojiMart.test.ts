import * as fs from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";

import { generateEmojiMart } from "../packages/generator/src/emojiMart.js";

vi.mock("node:fs/promises", { spy: true });

afterEach(() => {
	vi.restoreAllMocks();
});

const data = {
	aliases: {},
	categories: [{ emojis: ["person_in_tuxedo", "man_in_tuxedo"], id: "people" }],
	emojis: {
		man_in_tuxedo: {
			id: "man_in_tuxedo",
			keywords: [],
			name: "Man in Tuxedo",
			skins: [{ native: "🤵‍♂️", unified: "1f935-200d-2642-fe0f" }],
			version: 13,
		},
		person_in_tuxedo: {
			id: "person_in_tuxedo",
			keywords: [],
			name: "Person in Tuxedo",
			skins: [{ native: "🤵", unified: "1f935" }],
			version: 1,
		},
	},
};

const aliases = new Map([
	["🤵", "Man in Tuxedo"],
	["🤵‍♂️", "Man in Tuxedo"],
]);

describe(generateEmojiMart, () => {
	it("throws when two entries resolve to one title", async () => {
		vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(data));

		await expect(
			generateEmojiMart({ aliases, byCldr: {}, byCode: {}, items: [] }),
		).rejects.toThrow("Multiple emojiMart entries resolve to 'Man in Tuxedo'.");
	});
});

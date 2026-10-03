import * as fs from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";

import { generateEmojiMart } from "../packages/generator/src/emojiMart.js";
import { EmojipediaItem } from "../packages/generator/src/types.js";

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
	it.each([
		[
			"the entry with Emojipedia's codepoints",
			"man_in_tuxedo",
			{
				"Man in Tuxedo": {
					codepointsHex: ["U+1F935", "U+200D", "U+2642", "U+FE0F"],
				} as EmojipediaItem,
			},
		],
		["the first entry", "person_in_tuxedo", {}],
	])(
		"keeps %s and warns when two entries resolve to one title",
		async (_, kept, byCldr) => {
			const warn = vi
				.spyOn(console, "warn")
				.mockImplementation(() => undefined);

			vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(data));

			const result = await generateEmojiMart({
				aliases,
				byCldr,
				byCode: {},
				items: [],
			});

			expect(Object.keys(result)).toEqual(["Man in Tuxedo"]);
			expect(result["Man in Tuxedo"]).toMatchObject({ id: kept });
			expect(warn).toHaveBeenCalledExactlyOnceWith(
				`Multiple emojiMart entries resolve to 'Man in Tuxedo'; keeping '${kept}'.`,
			);
		},
	);
});

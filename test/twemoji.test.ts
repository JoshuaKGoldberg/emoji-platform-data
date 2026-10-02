import * as fs from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";

import { generateTwemoji } from "../packages/generator/src/twemoji.js";
import { normalizeTitle } from "../packages/generator/src/utils.js";

vi.mock("node:fs/promises", { spy: true });

const levitating = {
	description: "person in suit levitating",
	unicode: "1f574",
};

const manLevitating = {
	description: "man in business suit levitating",
	unicode: "1f574-fe0f-200d-2642-fe0f",
};

async function generate(items: object[]) {
	vi.mocked(fs.readFile).mockResolvedValueOnce(
		JSON.stringify([{ id: "people", items, title: "People" }]),
	);

	return generateTwemoji({
		aliases: new Map([
			["\u{1F574}", "Person in Suit Levitating"],
			[normalizeTitle(manLevitating.description), "Person in Suit Levitating"],
		]),
		byCldr: {},
		byCode: {},
		items: [],
	});
}

describe(generateTwemoji, () => {
	it("keeps an entry's title when its description is the only one that names it", async () => {
		expect(await generate([manLevitating])).toEqual({
			"Person in Suit Levitating": { ...manLevitating, keywords: [] },
		});
	});

	it.each([
		["after", [levitating, manLevitating]],
		["before", [manLevitating, levitating]],
	])(
		"titles an entry by its code points when its description names an emoji listed %s it by glyph",
		async (_, items) => {
			expect(await generate(items)).toEqual({
				"Person in Suit Levitating": { ...levitating, keywords: [] },
				"U+1F574 U+FE0F U+200D U+2642 U+FE0F": {
					...manLevitating,
					keywords: [],
				},
			});
		},
	);
});

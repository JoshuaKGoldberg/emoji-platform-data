import * as fs from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";

import { generateJoyPixels } from "../packages/generator/src/joypixels.js";

vi.mock("node:fs/promises", { spy: true });

function createEntry(
	fullyQualified: string,
	name: string,
	overrides: Record<string, unknown> = {},
) {
	return {
		ascii: [],
		category: "people",
		code_points: { diversity_parent: null, fully_qualified: fullyQualified },
		display: 1,
		diversity: null,
		keywords: [],
		name,
		order: 0,
		shortname: `:${name}:`,
		shortname_alternates: [],
		unicode_version: 6,
		...overrides,
	};
}

async function generate(data: Record<string, unknown>) {
	vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(data));

	return generateJoyPixels({
		aliases: new Map(),
		byCldr: {},
		byCode: {},
		items: [],
	});
}

describe(generateJoyPixels, () => {
	it("adds skin tone variants' keywords to their base emoji when they're not tones", async () => {
		const result = await generate({
			"1f932": createEntry("1f932", "palms up together", {
				keywords: ["palms", "uc10"],
			}),
			"1f932-1f3fb": createEntry("1f932-1f3fb", "palms up together: light", {
				code_points: {
					diversity_parent: "1f932",
					fully_qualified: "1f932-1f3fb",
				},
				diversity: "1f3fb",
				keywords: ["palms", "prayer", "light skin tone", "uc10"],
			}),
			"1f932-1f3fc": createEntry("1f932-1f3fc", "palms up together: medium", {
				code_points: {
					diversity_parent: "1f932",
					fully_qualified: "1f932-1f3fc",
				},
				diversity: "1f3fc",
				keywords: ["prayer", "together", "medium skin tone", "uc10"],
			}),
		});

		expect(Object.values(result)).toEqual([
			expect.objectContaining({
				emoji: "\u{1F932}",
				keywords: ["palms", "prayer", "together"],
			}),
		]);
	});

	it("leaves out a digit, # or * on its own when the picker doesn't show it", async () => {
		const result = await generate({
			"00a9": createEntry("00a9-fe0f", "copyright", { order: 0 }),
			"1f1e6": createEntry("1f1e6", "regional indicator a", {
				display: 0,
				order: 3,
			}),
			"0023-20e3": createEntry("0023-fe0f-20e3", "keycap: #", { order: 2 }),
			"0023": createEntry("0023-fe0f", "number sign", { display: 0, order: 1 }),
		});

		expect(Object.values(result).map((item) => item?.emoji)).toEqual([
			"\u00A9\uFE0F",
			"#\uFE0F\u20E3",
			"\u{1F1E6}",
		]);
	});

	it("unescapes ampersands when names and keywords have them", async () => {
		const result = await generate({
			"1f1f9-1f1f9": createEntry("1f1f9-1f1f9", "flag: Trinidad &amp; Tobago", {
				keywords: ["Trinidad &amp; Tobago", "uc6"],
			}),
		});

		expect(Object.values(result)).toEqual([
			expect.objectContaining({
				description: "flag: Trinidad & Tobago",
				keywords: ["Trinidad & Tobago"],
			}),
		]);
	});
});

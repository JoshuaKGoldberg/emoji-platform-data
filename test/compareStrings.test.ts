import { describe, expect, it } from "vitest";

import { compareStrings } from "../packages/generator/src/compareStrings.js";

describe(compareStrings, () => {
	it.each([
		["B", "_", -1],
		["_", "a", -1],
		["a", "b", -1],
		["b", "a", 1],
		["a", "a", 0],
	])("compares %s to %s as %i", (a, b, result) => {
		expect(compareStrings(a, b)).toBe(result);
	});

	it("sorts by code unit when strings differ in case and punctuation", () => {
		expect(["b", "_", "a", "B"].sort(compareStrings)).toEqual([
			"B",
			"_",
			"a",
			"b",
		]);
	});
});

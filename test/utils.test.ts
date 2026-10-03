import { describe, expect, it } from "vitest";

import { recordByCldr } from "../packages/generator/src/utils.js";

describe(recordByCldr, () => {
	it("keeps every entry when their titles are different", () => {
		expect(
			recordByCldr("discord", [
				["Broken Chain", 1],
				["Chains", 2],
			]),
		).toEqual({ "Broken Chain": 1, Chains: 2 });
	});

	it("throws when two entries have the same title", () => {
		expect(() =>
			recordByCldr("discord", [
				["Broken Chain", 1],
				["Broken Chain", 2],
			]),
		).toThrow("Multiple discord entries resolve to 'Broken Chain'.");
	});
});

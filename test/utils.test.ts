import { afterEach, describe, expect, it, vi } from "vitest";

import { recordByCldr } from "../packages/generator/src/utils.js";

afterEach(() => {
	vi.restoreAllMocks();
});

describe(recordByCldr, () => {
	it("keeps every entry without warning when their titles are different", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		expect(
			recordByCldr("discord", [
				["Broken Chain", 1],
				["Chains", 2],
			]),
		).toEqual({ "Broken Chain": 1, Chains: 2 });
		expect(warn).not.toHaveBeenCalled();
	});

	it("keeps the last entry and warns when two entries have the same title", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		expect(
			recordByCldr("discord", [
				["Broken Chain", 1],
				["Broken Chain", 2],
			]),
		).toEqual({ "Broken Chain": 2 });
		expect(warn).toHaveBeenCalledExactlyOnceWith(
			"Multiple discord entries resolve to 'Broken Chain'; keeping only the last.",
		);
	});
});

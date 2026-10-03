import { describe, expect, it } from "vitest";

import {
	fromUnicode,
	getEntryCldr,
	normalizeCodepoints,
	recordByCldr,
	toCodePointNotation,
	toUnicode,
} from "../packages/generator/src/utils.js";

const glyphs = [
	["\u00A9", "00a9"],
	["\u2693\uFE0F", "2693-fe0f"],
	["\u{1F44B}\u{1F3FD}", "1f44b-1f3fd"],
	["\u{1F9D1}\u200D\u{1F9B0}", "1f9d1-200d-1f9b0"],
];

describe(getEntryCldr, () => {
	it.each([
		["broken_chain", "Broken Chain"],
		["keycap_#", "Keycap Hash"],
		["keycap: *", "Keycap: Asterisk"],
		["men’s symbol", "Men’s Room"],
	])("titles %s as %s when Emojipedia doesn't know it", (entry, title) => {
		expect(
			getEntryCldr(
				{ aliases: new Map(), byCldr: {}, byCode: {}, items: [] },
				undefined,
				undefined,
				[entry],
			),
		).toBe(title);
	});
});

describe(normalizeCodepoints, () => {
	it.each([
		[["U+A9"], ["00a9"]],
		[
			["U+2693", "U+FE0F"],
			["2693", "fe0f"],
		],
		[
			["U+1F44B", "U+1F3FD"],
			["1f44b", "1f3fd"],
		],
	])("normalizes %j as %j", (codepointsHex, normalized) => {
		expect(normalizeCodepoints(codepointsHex)).toEqual(normalized);
	});
});

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

describe(toUnicode, () => {
	it.each(glyphs)("writes %s as %s", (glyph, unicode) => {
		expect(toUnicode(glyph)).toBe(unicode);
	});
});

describe(fromUnicode, () => {
	it.each(glyphs)("reads %s from %s", (glyph, unicode) => {
		expect(fromUnicode(unicode)).toBe(glyph);
	});
});

describe(toCodePointNotation, () => {
	it.each([
		["00a9", "U+00A9"],
		["1f9d1-200d-1f9b0", "U+1F9D1 U+200D U+1F9B0"],
	])("writes %s as %s", (unicode, notation) => {
		expect(toCodePointNotation(unicode)).toBe(notation);
	});
});

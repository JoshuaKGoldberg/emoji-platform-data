import { describe, expect, it } from "vitest";

import { formatExportLine } from "../packages/generator/src/formatExportLine.js";

describe(formatExportLine, () => {
	it.each([
		{
			currentCldrName: "person in tuxedo",
			exportName: "PersonInTuxedo",
			title: "Man in Tuxedo",
			when: "its CLDR name when it has one",
		},
		{
			currentCldrName: "1st place medal",
			exportName: "FirstPlaceMedal",
			title: "First Place Medal",
			when: "its title when its CLDR name starts with a digit",
		},
		{
			currentCldrName: undefined,
			exportName: "WomanWithHeadscarf",
			title: "Woman With Headscarf",
			when: "its title when it has no CLDR name",
		},
		{
			currentCldrName: "keycap: 1",
			exportName: "Keycap1",
			title: "Keycap: 1",
			when: "its CLDR name without separators when a digit follows punctuation",
		},
	])("names an export by $when", ({ currentCldrName, exportName, title }) => {
		expect(formatExportLine(currentCldrName, "slug", title)).toEqual({
			exportLine: `export { default as ${exportName} } from "./data/slug.json" with { type: "json" };\n`,
			exportName,
		});
	});
});

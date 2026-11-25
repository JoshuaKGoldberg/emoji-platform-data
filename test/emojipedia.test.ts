import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const personInTuxedo = {
	code: "\u{1F935}",
	currentCldrName: "Person in Tuxedo",
	title: "Man in Tuxedo",
};

const manInTuxedo = {
	code: "\u{1F935}\u200D\u2642\uFE0F",
	currentCldrName: "Man in Tuxedo",
	title: "Man in Tuxedo",
};

const grinningFace = {
	code: "\u{1F600}",
	currentCldrName: "grinning face",
	title: "Grinning Face",
};

vi.doMock(
	createRequire(
		new URL("../packages/generator/package.json", import.meta.url),
	).resolve("emojipedia/data"),
	() => ({ grinningFace, manInTuxedo, personInTuxedo }),
);

const { generateEmojipedia } =
	await import("../packages/generator/src/emojipedia.js");

describe(generateEmojipedia, () => {
	it("titles an item by its CLDR name when another item has the same title", () => {
		const { aliases, byCldr } = generateEmojipedia();

		expect(byCldr).toMatchObject({
			"Man in Tuxedo": manInTuxedo,
			"Person in Tuxedo": personInTuxedo,
		});
		expect(aliases.get(personInTuxedo.code)).toBe("Person in Tuxedo");
	});

	it("keeps an item's title when no other item has it, even when its CLDR name differs", () => {
		expect(generateEmojipedia().byCldr).toMatchObject({
			"Grinning Face": grinningFace,
		});
	});
});

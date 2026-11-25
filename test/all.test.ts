import { describe, expect, it, vi } from "vitest";

import { generateAll, getEmojiGlyphs } from "../packages/generator/src/all.js";
import { generateDiscord } from "../packages/generator/src/discord.js";
import { generateEmojipedia } from "../packages/generator/src/emojipedia.js";
import { generateGemoji } from "../packages/generator/src/gemoji.js";
import { generateMacOS } from "../packages/generator/src/macos.js";
import { generateSlack } from "../packages/generator/src/slack.js";
import { generateTwemoji } from "../packages/generator/src/twemoji.js";
import {
	DiscordItem,
	EmojipediaItem,
	GemojiItem,
	MacOSItem,
	SlackItem,
	TwemojiItem,
} from "../packages/generator/src/types.js";

vi.mock("../packages/generator/src/android.js", () => ({
	generateAndroid: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/discord.js", () => ({
	generateDiscord: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/emojiMart.js", () => ({
	generateEmojiMart: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/emojipedia.js", () => ({
	generateEmojipedia: vi.fn(() => ({
		aliases: new Map(),
		byCldr: {},
		byCode: {},
		items: [],
	})),
}));
vi.mock("../packages/generator/src/fluemoji.js", () => ({
	generateFluemoji: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/gemoji.js", () => ({
	generateGemoji: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/gnome.js", () => ({
	generateGnome: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/joypixels.js", () => ({
	generateJoyPixels: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/macos.js", () => ({
	generateMacOS: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/slack.js", () => ({
	generateSlack: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/twemoji.js", () => ({
	generateTwemoji: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/wechat.js", () => ({
	generateWeChat: vi.fn(() => ({})),
}));
vi.mock("../packages/generator/src/windows.js", () => ({
	generateWindows: vi.fn(() => ({})),
}));

const brokenChain = "⛓️‍💥";

const chains = "⛓️";

describe(generateAll, () => {
	it("throws when two titles share a slug but are different emoji", async () => {
		vi.mocked(generateDiscord).mockResolvedValueOnce({
			Broken_chain: { emoji: brokenChain } as DiscordItem,
		});
		vi.mocked(generateMacOS).mockResolvedValueOnce({
			"Broken Chain": { emoji: chains } as MacOSItem,
		});

		await expect(generateAll()).rejects.toThrow(
			"'Broken_chain' and 'Broken Chain' are different emoji with the same slug, 'broken-chain'.",
		);
	});

	it("throws when two titles are the same emoji and both have one platform's data", async () => {
		vi.mocked(generateDiscord).mockResolvedValueOnce({
			"Broken Chain": { emoji: brokenChain } as DiscordItem,
			"Chain Broken": { emoji: brokenChain } as DiscordItem,
		});

		await expect(generateAll()).rejects.toThrow(
			"'Broken Chain' and 'Chain Broken' are the same emoji, but both have discord data.",
		);
	});

	it("keeps Gemoji's title when a Discord title is the same emoji", async () => {
		const discord = { emoji: brokenChain } as DiscordItem;
		const gemoji = { emoji: brokenChain } as GemojiItem;

		vi.mocked(generateDiscord).mockResolvedValueOnce({ Broken_chain: discord });
		vi.mocked(generateGemoji).mockReturnValueOnce({ "Broken Chain": gemoji });

		expect(await generateAll()).toEqual({
			"Broken Chain": {
				discord,
				emoji: brokenChain,
				gemoji,
				slug: "broken-chain",
				title: "Broken Chain",
			},
		});
	});

	it("keeps macOS's title when a Discord title with another slug is the same emoji", async () => {
		const discord = { emoji: brokenChain } as DiscordItem;
		const macos = { emoji: brokenChain } as MacOSItem;

		vi.mocked(generateDiscord).mockResolvedValueOnce({ Broken_chain: discord });
		vi.mocked(generateMacOS).mockResolvedValueOnce({ "Chain Broken": macos });

		expect(await generateAll()).toEqual({
			"Chain Broken": {
				discord,
				emoji: brokenChain,
				macos,
				slug: "chain-broken",
				title: "Chain Broken",
			},
		});
	});

	it("keeps Gemoji's title when a Slack title after it is the same emoji", async () => {
		const gemoji = { emoji: brokenChain } as GemojiItem;
		const slack = { emoji: brokenChain } as SlackItem;

		vi.mocked(generateGemoji).mockReturnValueOnce({ "Broken Chain": gemoji });
		vi.mocked(generateSlack).mockResolvedValueOnce({ broken_chain: slack });

		expect(await generateAll()).toEqual({
			"Broken Chain": {
				emoji: brokenChain,
				gemoji,
				slack,
				slug: "broken-chain",
				title: "Broken Chain",
			},
		});
	});

	it.each([
		["Broken Chain", "broken-chain"],
		["Piñata", "pi-ata"],
		["A/B Button (Blood Type)", "a-b-button-blood-type"],
		["Keycap: *", "keycap"],
		["U+1F517", "u-1f517"],
	])("slugs %s as %s when no platform gives it a slug", async (title, slug) => {
		vi.mocked(generateMacOS).mockResolvedValueOnce({
			[title]: { emoji: "🔗" } as MacOSItem,
		});

		expect(await generateAll()).toMatchObject({ [title]: { slug } });
	});

	it("slugs a title by its Twemoji description when it has one", async () => {
		vi.mocked(generateTwemoji).mockResolvedValueOnce({
			"U+1F517": {
				description: "link symbol",
				unicode: "1f517",
			} as TwemojiItem,
		});

		expect(await generateAll()).toMatchObject({
			"U+1F517": { slug: "link-symbol" },
		});
	});

	it.each([
		{
			code: "\u{1F9D5}\u200D\u2640\uFE0F",
			emoji: "\u{1F9D5}",
			macos: "\u{1F9D5}",
			when: "no platform writes it as Emojipedia does",
		},
		{
			code: "\u2693",
			emoji: "\u2693",
			macos: "\u2693\uFE0F",
			when: "a platform writes it with another variation selector",
		},
		{
			code: "\u{1F9D5}\u200D\u2640\uFE0F",
			emoji: "\u{1F9D5}\u200D\u2640\uFE0F",
			macos: undefined,
			when: "no platform has it",
		},
	])("keys an emoji by $emoji when $when", async ({ code, emoji, macos }) => {
		vi.mocked(generateEmojipedia).mockReturnValueOnce({
			aliases: new Map(),
			byCldr: { Emoji: { code, slug: "emoji" } as EmojipediaItem },
			byCode: {},
			items: [],
		});
		vi.mocked(generateMacOS).mockResolvedValueOnce(
			macos ? { Emoji: { emoji: macos } as MacOSItem } : {},
		);

		expect(await generateAll()).toMatchObject({ Emoji: { emoji } });
	});
});

describe(getEmojiGlyphs, () => {
	it.each([
		{ count: 0, emoji: "\u2693", glyphs: ["\u2693"] },
		{
			count: 1,
			emoji: "\u2693\uFE0F",
			glyphs: ["\u2693\uFE0F", "\u2693"],
		},
		{
			count: 2,
			emoji: "\u{1F3F3}\uFE0F\u200D\u26A7\uFE0F",
			glyphs: [
				"\u{1F3F3}\uFE0F\u200D\u26A7\uFE0F",
				"\u{1F3F3}\uFE0F\u200D\u26A7",
				"\u{1F3F3}\u200D\u26A7\uFE0F",
				"\u{1F3F3}\u200D\u26A7",
			],
		},
		{
			count: 3,
			emoji: "a\uFE0Fb\uFE0Fc\uFE0F",
			glyphs: [
				"a\uFE0Fb\uFE0Fc\uFE0F",
				"a\uFE0Fb\uFE0Fc",
				"a\uFE0Fbc\uFE0F",
				"a\uFE0Fbc",
				"ab\uFE0Fc\uFE0F",
				"ab\uFE0Fc",
				"abc\uFE0F",
				"abc",
			],
		},
	])(
		"looks an emoji with $count variation selectors up by each combination of them kept or left out",
		({ emoji, glyphs }) => {
			expect(getEmojiGlyphs({ emoji, slug: "emoji", title: "Emoji" })).toEqual(
				new Set(glyphs),
			);
		},
	);
});

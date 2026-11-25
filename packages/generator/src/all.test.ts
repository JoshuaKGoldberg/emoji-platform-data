import { describe, expect, it, vi } from "vitest";

import { generateAll, getEmojiGlyphs } from "./all.ts";
import { generateDiscord } from "./discord.ts";
import { generateEmojipedia } from "./emojipedia.ts";
import { generateGemoji } from "./gemoji.ts";
import { generateMacOS } from "./macos.ts";
import { generateSlack } from "./slack.ts";
import { generateTwemoji } from "./twemoji.ts";
import type {
	DiscordItem,
	EmojipediaItem,
	GemojiItem,
	MacOSItem,
	SlackItem,
	TwemojiItem,
} from "./types.ts";

vi.mock("./android.ts", () => ({
	generateAndroid: vi.fn(() => ({})),
}));
vi.mock("./discord.ts", () => ({
	generateDiscord: vi.fn(() => ({})),
}));
vi.mock("./emojiMart.ts", () => ({
	generateEmojiMart: vi.fn(() => ({})),
}));
vi.mock("./emojipedia.ts", () => ({
	generateEmojipedia: vi.fn(() => ({
		aliases: new Map(),
		byCldr: {},
		byCode: {},
		items: [],
	})),
}));
vi.mock("./fluemoji.ts", () => ({
	generateFluemoji: vi.fn(() => ({})),
}));
vi.mock("./gemoji.ts", () => ({
	generateGemoji: vi.fn(() => ({})),
}));
vi.mock("./gnome.ts", () => ({
	generateGnome: vi.fn(() => ({})),
}));
vi.mock("./joypixels.ts", () => ({
	generateJoyPixels: vi.fn(() => ({})),
}));
vi.mock("./macos.ts", () => ({
	generateMacOS: vi.fn(() => ({})),
}));
vi.mock("./slack.ts", () => ({
	generateSlack: vi.fn(() => ({})),
}));
vi.mock("./twemoji.ts", () => ({
	generateTwemoji: vi.fn(() => ({})),
}));
vi.mock("./wechat.ts", () => ({
	generateWeChat: vi.fn(() => ({})),
}));
vi.mock("./windows.ts", () => ({
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

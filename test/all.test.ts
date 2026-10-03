import { describe, expect, it, vi } from "vitest";

import { generateAll } from "../packages/generator/src/all.js";
import { generateDiscord } from "../packages/generator/src/discord.js";
import { generateGemoji } from "../packages/generator/src/gemoji.js";
import { generateMacOS } from "../packages/generator/src/macos.js";
import { generateSlack } from "../packages/generator/src/slack.js";
import {
	DiscordItem,
	GemojiItem,
	MacOSItem,
	SlackItem,
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
});

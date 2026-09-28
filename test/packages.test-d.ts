import { describe, expectTypeOf, it } from "vitest";

import * as discord from "../packages/discord/lib/index.mjs";
import * as combined from "../packages/emoji-platform-data/lib/index.mjs";
import * as twemoji from "../packages/twemoji/lib/index.mjs";

/**
 * These import the built packages by path, the way test/packages.test.ts does,
 * so they need `pnpm build` first.
 */
describe("byTitle", () => {
	it("types each title as the package's item", () => {
		expectTypeOf(
			discord.byTitle.SparklingHeart,
		).toEqualTypeOf<discord.DiscordItem>();
		expectTypeOf(
			combined.byTitle.SparklingHeart,
		).toEqualTypeOf<combined.EmojiPlatformData>();
		expectTypeOf(
			twemoji.byTitle.SparklingHeart,
		).toEqualTypeOf<twemoji.TwemojiItem>();
	});

	it("rejects a name that is not an emoji title", () => {
		expectTypeOf(discord.byTitle).not.toHaveProperty("NotAnEmojiTitle");
	});
});

describe("byEmoji", () => {
	it("types each glyph's entry as the package's item", () => {
		expectTypeOf(
			combined.byEmoji["💖"],
		).toEqualTypeOf<combined.EmojiPlatformData>();
	});
});

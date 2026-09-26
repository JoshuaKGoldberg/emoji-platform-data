import { generateDiscord } from "./discord.js";
import { generateEmojiMart } from "./emojiMart.js";
import { generateEmojipedia } from "./emojipedia.js";
import { generateFluemoji } from "./fluemoji.js";
import { generateGemoji } from "./gemoji.js";
import { generateMacOS } from "./macos.js";
import { generateSlack } from "./slack.js";
import { generateTwemoji } from "./twemoji.js";
import { AllEmojiPlatformData, EmojiPlatformData } from "./types.js";
import { generateWeChat } from "./wechat.js";

export interface GenerateAllSettings {
	/**
	 * Directory containing microsoft/fluentui-emoji's assets/ folder.
	 * @default the fluemoji dependency installed alongside this package
	 */
	fluemojiDirectory?: string;
}

export async function generateAll({
	fluemojiDirectory,
}: GenerateAllSettings = {}): Promise<AllEmojiPlatformData> {
	const allEmojipedia = generateEmojipedia();
	const allGemoji = generateGemoji(allEmojipedia);
	const [
		allDiscord,
		allEmojiMart,
		allFluemoji,
		allMacOS,
		allSlack,
		allTwemoji,
		allWeChat,
	] = await Promise.all([
		generateDiscord(allEmojipedia),
		generateEmojiMart(allEmojipedia),
		generateFluemoji(allEmojipedia, fluemojiDirectory),
		generateMacOS(allEmojipedia),
		generateSlack(allEmojipedia),
		generateTwemoji(allEmojipedia),
		generateWeChat(allEmojipedia),
	]);
	const allPlatforms = [
		allDiscord,
		allEmojiMart,
		allFluemoji,
		allGemoji,
		allMacOS,
		allSlack,
		allTwemoji,
		allWeChat,
	];

	const allKeys = new Set(
		[allEmojipedia.byCldr, ...allPlatforms].flatMap((platform) =>
			Object.keys(platform),
		),
	);

	return Object.fromEntries(
		Array.from(allKeys)
			.map((title): [string, EmojiPlatformData] => {
				const discord = allDiscord[title];
				const emojiMart = allEmojiMart[title];
				const emojipedia = allEmojipedia.byCldr[title];
				const fluemoji = allFluemoji[title];
				const gemoji = allGemoji[title];
				const macos = allMacOS[title];
				const slack = allSlack[title];
				const twemoji = allTwemoji[title];
				const wechat = allWeChat[title];

				const platformData = {
					discord,
					emoji:
						// One of these must have been defined.
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						(emojipedia?.code ??
							discord?.emoji ??
							emojiMart?.skins[0]?.native ??
							fluemoji?.glyph ??
							gemoji?.emoji ??
							macos?.emoji ??
							slack?.emoji ??
							twemoji?.unicode ??
							wechat?.emoji)!,
					emojiMart,
					emojipedia,
					fluemoji,
					gemoji,
					macos,
					slack,
					slug: emojipedia?.slug ?? slugify(twemoji?.description ?? title),
					title,
					twemoji,
					wechat,
				};

				return [title, platformData];
			})
			.sort(([, a], [, b]) => a.slug.localeCompare(b.slug)),
	);
}

/**
 * Mirrors Emojipedia's slug shape for titles that don't have one. Slugs become
 * file names, so anything Windows reserves (`:`) or that `fs` reads as a path
 * separator (`/`) has to go — macOS supplies both.
 */
function slugify(text: string) {
	return text
		.toLowerCase()
		.replaceAll(/[^a-z0-9]+/g, "-")
		.replaceAll(/^-+|-+$/g, "");
}

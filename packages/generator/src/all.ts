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

	const byTitle = Object.fromEntries(
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

	return Object.fromEntries(
		mergeSameEmoji(Object.values(byTitle))
			.sort((a, b) => a.slug.localeCompare(b.slug))
			.map((platformData) => [platformData.title, platformData]),
	);
}

/**
 * Platforms that aren't matched to an Emojipedia title fall back to titles of
 * their own, which can name one emoji two ways, such as Discord's "Broken_chain"
 * and macOS's "Broken Chain" for ⛓️‍💥. Those would write the same file and export
 * name twice when they come out as the same slug, and would leave one of them
 * unreachable from `byEmoji` when they don't.
 *
 * Titles that share a slug and a glyph, or that are the same glyph, are one
 * emoji, so they're merged, under the title of whichever came from the platform
 * earliest in this list. That's the order platforms were added in, so adding
 * one never renames an emoji that another platform already titled, except that
 * WeChat goes last: it has no names of its own, so it only titles the emoji
 * nothing else names, and those by their code points.
 */
const titlePriority = [
	"emojipedia",
	"gemoji",
	"twemoji",
	"fluemoji",
	"emojiMart",
	"macos",
	"discord",
	"slack",
	"wechat",
] as const satisfies (keyof EmojiPlatformData)[];

function getGlyphs(platformData: EmojiPlatformData) {
	return new Set(
		[
			platformData.discord?.emoji,
			platformData.emojiMart?.skins[0]?.native,
			platformData.emojipedia?.code,
			platformData.fluemoji?.glyph,
			platformData.gemoji?.emoji,
			platformData.macos?.emoji,
			platformData.slack?.emoji,
			platformData.twemoji?.unicode,
			platformData.wechat?.emoji,
		]
			.filter((glyph) => glyph !== undefined)
			.map(withoutVariationSelectors),
	);
}

function getTitlePriority(platformData: EmojiPlatformData) {
	return titlePriority.findIndex((platform) => platformData[platform]);
}

function mergeEntries(existing: EmojiPlatformData, entry: EmojiPlatformData) {
	const [kept, merged] =
		getTitlePriority(existing) <= getTitlePriority(entry)
			? [existing, entry]
			: [entry, existing];

	for (const platform of titlePriority) {
		if (kept[platform] && merged[platform]) {
			throw new Error(
				`'${kept.title}' and '${merged.title}' are the same emoji, but both have ${platform} data.`,
			);
		}
	}

	return {
		...kept,
		...Object.fromEntries(
			titlePriority
				.filter((platform) => merged[platform])
				.map((platform) => [platform, merged[platform]]),
		),
	};
}

function mergeSameEmoji(entries: EmojiPlatformData[]) {
	const merged: EmojiPlatformData[] = [];
	const bySlug = new Map<string, number>();
	const byGlyph = new Map<string, number>();

	for (const entry of entries) {
		const glyph = withoutVariationSelectors(entry.emoji);
		const sameSlug = bySlug.get(entry.slug);
		const index = sameSlug ?? byGlyph.get(glyph) ?? merged.length;

		if (index === merged.length) {
			merged.push(entry);
		} else {
			const existing = merged[index];

			if (
				index === sameSlug &&
				![...getGlyphs(entry)].some((other) => getGlyphs(existing).has(other))
			) {
				throw new Error(
					`'${existing.title}' and '${entry.title}' are different emoji with the same slug, '${entry.slug}'.`,
				);
			}

			merged[index] = mergeEntries(existing, entry);
		}

		bySlug.set(entry.slug, index);
		byGlyph.set(glyph, index);
	}

	return merged;
}

function withoutVariationSelectors(glyph: string) {
	return glyph.replaceAll("\uFE0F", "");
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

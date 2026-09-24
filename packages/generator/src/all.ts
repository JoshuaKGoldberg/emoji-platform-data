import { generateEmojipedia } from "./emojipedia.js";
import { generateFluemoji } from "./fluemoji.js";
import { generateGemoji } from "./gemoji.js";
import { generateMacOS } from "./macos.js";
import { generateTwemoji } from "./twemoji.js";
import { AllEmojiPlatformData, EmojiPlatformData } from "./types.js";

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
	const [allFluemoji, allMacOS, allTwemoji] = await Promise.all([
		generateFluemoji(allEmojipedia, fluemojiDirectory),
		generateMacOS(allEmojipedia),
		generateTwemoji(allEmojipedia),
	]);
	const allPlatforms = [allFluemoji, allGemoji, allMacOS, allTwemoji];

	const allKeys = new Set(
		[allEmojipedia.byCldr, ...allPlatforms].flatMap((platform) =>
			Object.keys(platform),
		),
	);

	return Object.fromEntries(
		Array.from(allKeys)
			.map((title): [string, EmojiPlatformData] => {
				const emojipedia = allEmojipedia.byCldr[title];
				const fluemoji = allFluemoji[title];
				const gemoji = allGemoji[title];
				const macos = allMacOS[title];
				const twemoji = allTwemoji[title];

				const platformData = {
					emoji:
						// One of these must have been defined.
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						(emojipedia?.code ??
							fluemoji?.glyph ??
							gemoji?.emoji ??
							macos?.emoji ??
							twemoji?.unicode)!,
					emojipedia,
					fluemoji,
					gemoji,
					macos,
					slug: emojipedia?.slug ?? slugify(twemoji?.description ?? title),
					title,
					twemoji,
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

import { generateEmojipedia } from "./emojipedia.js";
import { generateFluemoji } from "./fluemoji.js";
import { generateGemoji } from "./gemoji.js";
import { generateTwemoji } from "./twemoji.js";
import { AllEmojiPlatformData, EmojiPlatformData } from "./types.js";

export async function generateAll(): Promise<AllEmojiPlatformData> {
	const allEmojipedia = generateEmojipedia();
	const allPlatforms = await Promise.all([
		generateFluemoji(allEmojipedia),
		generateGemoji(allEmojipedia),
		generateTwemoji(allEmojipedia),
	]);
	const [allFluemoji, allGemoji, allTwemoji] = allPlatforms;

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
				const twemoji = allTwemoji[title];

				const platformData = {
					emoji:
						// One of these four must have been defined.
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						(emojipedia?.code ??
							fluemoji?.glyph ??
							gemoji?.emoji ??
							twemoji?.unicode)!,
					emojipedia,
					fluemoji,
					gemoji,
					slug:
						emojipedia?.slug ??
						(twemoji?.description ?? title).replaceAll(" ", "-").toLowerCase(),
					title,
					twemoji,
				};

				return [title, platformData];
			})
			.sort(([, a], [, b]) => a.slug.localeCompare(b.slug)),
	);
}

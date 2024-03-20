import fg from "fast-glob";
import fs from "node:fs/promises";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllFluemojiData, FluemojiItem } from "./types.js";
import { getEntryCldr } from "./utils.js";

export async function generateFluemoji(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllFluemojiData>> {
	const files = await fg(`./node_modules/fluemoji/assets/*/metadata.json`);

	const pending = files.map(
		async (file) =>
			JSON.parse((await fs.readFile(file)).toString()) as FluemojiItem,
	);

	return Object.fromEntries(
		(await Promise.all(pending)).map((entry) => [
			getEntryCldr(emojipedia, entry.glyph, entry.unicode, [entry.cldr]),
			entry,
		]),
	);
}

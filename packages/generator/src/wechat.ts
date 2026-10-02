import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllWeChatData, WeChatItem } from "./types.js";
import {
	getEntryCldr,
	recordByCldr,
	toCodePointNotation,
	toUnicode,
} from "./utils.js";

interface WeChatSnapshot {
	entries: WeChatItem[];
}

/**
 * Reads the WeChat data snapshot committed alongside this package.
 */
export async function generateWeChat(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllWeChatData>> {
	const raw = await fs.readFile(
		path.join(import.meta.dirname, "../wechat.json"),
		"utf8",
	);
	const { entries } = JSON.parse(raw) as WeChatSnapshot;

	return recordByCldr(
		"wechat",
		entries.map((entry) => {
			// WeChat names its emoji in Chinese, so unlike every other platform
			// here there's no name to fall back to matching a title by. Emoji
			// nothing else names are titled by their code points instead.
			const unicode = toUnicode(entry.emoji);

			return [
				getEntryCldr(emojipedia, entry.emoji, [toCodePointNotation(unicode)]),
				entry,
			];
		}),
	);
}

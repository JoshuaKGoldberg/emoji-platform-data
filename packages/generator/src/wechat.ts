import * as fs from "node:fs/promises";
import * as path from "node:path";

import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllWeChatData, WeChatItem } from "./types.js";
import { getEntryCldr, recordByCldr } from "./utils.js";

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
		entries.map((entry) => [
			getEntryCldr(emojipedia, entry.emoji, undefined, [
				entry.description,
				...entry.aliases,
			]),
			entry,
		]),
	);
}

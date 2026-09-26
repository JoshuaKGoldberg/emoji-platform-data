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
		entries.map((entry) => {
			// WeChat names its emoji in Chinese, so unlike every other platform
			// here there's no name to fall back to matching a title by. Emoji
			// nothing else names are titled by their code points instead.
			const unicode = toUnicode(entry.emoji);

			return [
				getEntryCldr(emojipedia, entry.emoji, unicode, [
					toCodePointNotation(unicode),
				]),
				entry,
			];
		}),
	);
}

/**
 * Code points as Unicode writes them, such as "U+1F9D1 U+200D U+1F9B0".
 */
function toCodePointNotation(unicode: string) {
	return unicode
		.split("-")
		.map((hex) => `U+${hex.toUpperCase()}`)
		.join(" ");
}

function toUnicode(emoji: string) {
	// Code points are the unit Emojipedia writes its codepoint lists in.
	// eslint-disable-next-line @typescript-eslint/no-misused-spread
	return [...emoji]
		.map((character) =>
			(character.codePointAt(0) ?? 0).toString(16).padStart(4, "0"),
		)
		.join("-");
}

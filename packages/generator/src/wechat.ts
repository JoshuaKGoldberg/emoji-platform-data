import { GeneratedEmojipediaData } from "./emojipedia.js";
import { AllWeChatData, WeChatItem } from "./types.js";
import {
	getEntryCldr,
	readSnapshot,
	toCodePointNotation,
	toUnicode,
} from "./utils.js";

/**
 * Reads the WeChat data snapshot committed alongside this package.
 */
export function generateWeChat(
	emojipedia: GeneratedEmojipediaData,
): Promise<Partial<AllWeChatData>> {
	return readSnapshot("wechat", (entry: WeChatItem) => {
		// WeChat names its emoji in Chinese, so unlike every other platform
		// here there's no name to fall back to matching a title by. Emoji
		// nothing else names are titled by their code points instead.
		const unicode = toUnicode(entry.emoji);

		return getEntryCldr(emojipedia, entry.emoji, [
			toCodePointNotation(unicode),
		]);
	});
}

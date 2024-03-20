import type * as emojipedia from "emojipedia/data";
import type { Gemoji } from "gemoji";

export type AllEmojiPlatformData = Record<string, EmojiPlatformData>;

export interface EmojiPlatformData {
	emoji: string;
	emojipedia?: EmojipediaItem;
	fluemoji?: FluemojiItem;
	gemoji?: Gemoji;
	slug: string;
	title: string;
	twemoji?: TwemojiItem;
}

export type Emoji = string;

export type EmojipediaItem = (typeof emojipedia)[keyof typeof emojipedia] & {
	alsoKnownAs?: string[];
	appleName?: string;
	currentCldrName?: string;
};

export type AllEmojipediaData = Record<Emoji, EmojipediaItem>;

export interface FluemojiItem {
	cldr: string;
	fromVersion: string;
	glyph: string;
	group: string;
	keywords: string[];
	mappedToEmoticons: string[];
	tts: string;
	unicode: string;
	unicodeSkintones?: string[];
}

export type AllFluemojiData = Record<Emoji, FluemojiItem>;

export type AllGemojiData = Record<Emoji, Gemoji>;

export interface TwemojiItemBase {
	description: string;
	type?: "diversity" | "regional" | "variant";
	unicode: string;
}

export interface TwemojiItemExcluded extends TwemojiItemBase {
	exclude_from_picker: true;
}

export interface TwemojiItemIncluded extends TwemojiItemBase {
	keywords: string[];
}

export type TwemojiItem = TwemojiItemExcluded | TwemojiItemIncluded;

export type AllTwemojiData = Record<Emoji, TwemojiItem>;

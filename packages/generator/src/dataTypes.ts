export type AllDiscordData = Record<string, DiscordItem>;

export type AllEmojiMartData = Record<string, EmojiMartItem>;

export type AllEmojipediaData = Record<string, EmojipediaItem>;

export type AllEmojiPlatformData = Record<string, EmojiPlatformData>;

export type AllFluemojiData = Record<string, FluemojiItem>;

export type AllGemojiData = Record<string, GemojiItem>;

export type AllMacOSData = Record<string, MacOSItem>;

export type AllSlackData = Record<string, SlackItem>;

export type AllTwemojiData = Record<string, TwemojiItem>;

export type AllWeChatData = Record<string, WeChatItem>;

/**
 * One emoji as Discord's emoji picker knows it.
 */
export interface DiscordItem {
	/** Other shortcodes Discord accepts for the emoji, such as "+1" for 👍. */
	aliases: string[];

	/** Picker category listing the emoji, such as "nature". */
	category: string;

	emoji: string;

	/** Terms the picker matches searches against, beyond the shortcodes. Flags and a few sequences have none. */
	keywords: string[];

	/** Discord's shortcode for the emoji, such as "octopus". */
	name: string;

	/** Where the emoji falls in the picker's overall order, across all categories. */
	order: number;

	/** Emoji version that introduced the emoji, such as 6.1. */
	unicodeVersion: number;
}

export interface EmojiMartItem {
	/** Other shortcodes emoji-mart accepts for the emoji, such as "thumbsup" for 👍. */
	aliases?: string[];

	/** Picker category listing the emoji, such as "nature". */
	category: string;

	/** Text emoticons the emoji stands in for, such as ":)" for 😃. */
	emoticons?: string[];

	/** emoji-mart's shortcode for the emoji, such as "octopus". */
	id: string;

	/** Terms the picker matches searches against. */
	keywords: string[];

	/** How emoji-mart names the emoji, such as "Octopus". */
	name: string;

	/** Where the emoji falls in the picker's overall order, across all categories. */
	order: number;

	/** The emoji, then each of its skin tone variants. */
	skins: EmojiMartSkin[];

	/** Emoji version that introduced the emoji, such as 1. */
	version: number;
}

export interface EmojiMartSkin {
	/** The variant's glyph, such as "👋🏽". */
	native: string;

	/** The variant's codepoints, such as "1f44b-1f3fd". */
	unified: string;
}

export interface EmojipediaComponent {
	alsoKnownAs?: string[];
	appleName?: string;
	code: string;
	codepointsHex: string[];
	currentCldrName?: string;
	description: string;
	id: string;
	modifiers?: boolean;
	shortcodes?: EmojipediaComponentShortcode[];
	slug: string;
	title: string;
}

export interface EmojipediaComponentShortcode {
	code: string;
	vendor: EmojipediaVendor;
}

export interface EmojipediaEmojiVersion {
	date: number;
	name: string;
	slug: string;
	status: number;
}

export interface EmojipediaItem {
	alsoKnownAs?: string[];
	appleName?: string;
	code: string;
	codepointsHex: string[];
	components: EmojipediaComponent[];
	currentCldrName?: string;
	description: string;
	emojiVersion?: EmojipediaEmojiVersion;
	id: string;
	modifiers?: boolean;
	shortcodes?: EmojipediaShortcode[];
	slug: string;
	title: string;
	type: string;
	version?: EmojipediaUnicodeVersion;
}

export interface EmojipediaShortcode {
	code: string;
	source: string;
	vendor: EmojipediaVendor;
}

export interface EmojipediaUnicodeVersion {
	date: number;
	description: string;
	name: string;
	slug: string;
	status: number;
}

export interface EmojipediaVendor {
	slug: string;
	title: string;
}

export interface EmojiPlatformData {
	discord?: DiscordItem;
	emoji: string;
	emojiMart?: EmojiMartItem;
	emojipedia?: EmojipediaItem;
	fluemoji?: FluemojiItem;
	gemoji?: GemojiItem;
	macos?: MacOSItem;
	slack?: SlackItem;
	slug: string;
	title: string;
	twemoji?: TwemojiItem;
	wechat?: WeChatItem;
}

export interface FluemojiItem {
	cldr: string;
	comments?: string[];
	fromVersion: string;
	glyph: string;
	glyphAsUtfInEmoticons?: string[];
	group: string;
	keywords: string[];
	mappedToEmoticons?: string[];
	tts: string;
	unicode: string;
	unicodeSkintones?: string[];
}

export interface GemojiItem {
	category: string;
	description: string;
	emoji: string;
	names: string[];
	tags: string[];
}

/**
 * One emoji as macOS's own emoji picker knows it.
 */
export interface MacOSItem {
	/** How macOS names the emoji, such as "octopus". */
	appleName: string;

	/** Picker category listing the emoji, such as "Nature". A few emoji, such as ⏩ and ✊🏽, are in none. */
	category?: string;

	emoji: string;

	/** Whether macOS seeds its "Frequently Used" category with the emoji. */
	isCommon: boolean;

	/** Terms the picker matches searches against, most relevant first. */
	keywords: string[];

	/** Where the emoji falls in the picker's overall order, across all categories. */
	order?: number;

	/** How macOS speaks the emoji aloud, such as "an octopus emoji". */
	speechName: string;

	/** The emoji's Unicode name, such as "OCTOPUS". macOS omits it for newer emoji. */
	unicodeName?: string;

	/** How VoiceOver describes the emoji, such as "an octopus". */
	voiceOverName: string;
}

/**
 * One emoji as Slack's emoji picker knows it.
 */
export interface SlackItem {
	/** Other shortcodes Slack accepts for the emoji, such as "thumbsup" for 👍. */
	aliases: string[];

	/** Picker category listing the emoji, such as "Animals & Nature". Emoji the picker doesn't list have none. */
	category?: string;

	emoji: string;

	/** Terms the picker matches searches against in English, beyond the shortcodes. A few dozen emoji, mostly newer people variants and less common flags, have none. */
	keywords: string[];

	/** The same terms as the picker searches them in each of Slack's other locales, keyed by locale, such as "de-DE". Terms a locale has no translation for stay in English, as they do in the picker. */
	keywordsByLocale: Record<string, string[]>;

	/** Slack's shortcode for the emoji, such as "octopus". */
	name: string;

	/** How Slack names the emoji in each of its other locales, keyed by locale, such as "oktopus" for "de-DE". */
	namesByLocale: Record<string, string>;

	/** Where the emoji falls in the picker's overall order, across all categories. */
	order?: number;
}

export type TwemojiItem = TwemojiItemExcluded | TwemojiItemIncluded;

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

/**
 * One emoji as WeChat's emoji picker knows it.
 */
export interface WeChatItem {
	/** Picker category listing the emoji, such as "动物". Emoji the picker doesn't list have none. */
	category?: string;

	emoji: string;

	/** Terms the picker matches searches against, in Simplified Chinese, Traditional Chinese, and English. */
	keywords: string[];

	/** Where the emoji falls in the picker's overall order, across all categories. */
	order?: number;
}

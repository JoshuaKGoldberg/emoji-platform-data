export type AllAndroidData = Record<string, AndroidItem>;

export type AllDiscordData = Record<string, DiscordItem>;

export type AllEmojiMartData = Record<string, EmojiMartItem>;

export type AllEmojipediaData = Record<string, EmojipediaItem>;

export type AllEmojiPlatformData = Record<string, EmojiPlatformData>;

export type AllFluemojiData = Record<string, FluemojiItem>;

export type AllGemojiData = Record<string, GemojiItem>;

export type AllGnomeData = Record<string, GnomeItem>;

export type AllJoyPixelsData = Record<string, JoyPixelsItem>;

export type AllMacOSData = Record<string, MacOSItem>;

export type AllSlackData = Record<string, SlackItem>;

export type AllTwemojiData = Record<string, TwemojiItem>;

export type AllWeChatData = Record<string, WeChatItem>;

export type AllWindowsData = Record<string, WindowsItem>;

/**
 * One emoji as Gboard, Android's keyboard, knows it.
 */
export interface AndroidItem {
	emoji: string;

	/** Terms Gboard's emoji search finds the emoji by, sorted. */
	keywords: string[];
}

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
	android?: AndroidItem;
	discord?: DiscordItem;
	emoji: string;
	emojiMart?: EmojiMartItem;
	emojipedia?: EmojipediaItem;
	fluemoji?: FluemojiItem;
	gemoji?: GemojiItem;
	gnome?: GnomeItem;
	joypixels?: JoyPixelsItem;
	macos?: MacOSItem;
	slack?: SlackItem;
	slug: string;
	title: string;
	twemoji?: TwemojiItem;
	wechat?: WeChatItem;
	windows?: WindowsItem;
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
 * One emoji as GNOME's emoji picker, GTK's emoji chooser, knows it.
 */
export interface GnomeItem {
	/** Picker section listing the emoji, such as "Animals & Nature". The hair components, which the picker doesn't show, have none. */
	category?: string;

	emoji: string;

	/** Terms the picker matches searches against in English, beyond the name. */
	keywords: string[];

	/** The terms the picker matches searches against in each of GTK's other locales, keyed by locale, such as "de". */
	keywordsByLocale: Record<string, string[]>;

	/** How GNOME names the emoji in English, such as "octopus". */
	name: string;

	/** How GNOME names the emoji in each of GTK's other locales, keyed by locale, such as "Oktopus" for "de". */
	namesByLocale: Record<string, string>;

	/** Where the emoji falls in the English picker's overall order, across all categories. Emoji only GTK's other locales know yet have none. */
	order?: number;
}

/**
 * One emoji as JoyPixels' emoji-toolkit knows it, which is also how Zoom's Team Chat emoji picker knows it.
 */
export interface JoyPixelsItem {
	/** Other shortcodes JoyPixels accepts for the emoji, such as "+1" and "thumbs_up" for 👍. */
	aliases: string[];

	/** Picker category listing the emoji, such as "nature". Emoji the picker doesn't show, such as most families, have none. */
	category?: string;

	/** How JoyPixels names the emoji, such as "octopus". */
	description: string;

	emoji: string;

	/** Text emoticons the emoji stands in for, such as "&lt;3" for ❤️. Only a few dozen emoji have them. */
	emoticons?: string[];

	/** Terms a picker matches searches against, beyond the shortcodes. */
	keywords: string[];

	/** JoyPixels' shortcode for the emoji, such as "octopus". */
	name: string;

	/** Where the emoji falls in the picker's overall order, across all categories. */
	order?: number;

	/** Unicode version that introduced the emoji, such as 6. */
	unicodeVersion: number;
}

/**
 * One emoji as macOS's own emoji picker knows it.
 */
export interface MacOSItem {
	/** How macOS names the emoji, such as "octopus". */
	appleName: string;

	/** Picker category listing the emoji, such as "Nature". A few emoji, such as ⚕️ and 🧑‍🤝‍🧑, are in none. */
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

/**
 * One emoji as Twemoji's emoji picker knows it.
 */
export interface TwemojiItem {
	/** How Twemoji names the emoji, such as "Octopus". */
	description: string;

	/** Terms the picker matches searches against. */
	keywords: string[];

	/** For people emoji whose people can each have their own skin tone, the code points of the emoji with two different tones, with "skintone" where each goes. */
	multi_diversity_base_different?: string;

	/** Whether Twemoji only has the tone pairs of `multi_diversity_base_different` in one order. */
	multi_diversity_base_different_is_sorted?: boolean;

	/** For people emoji whose people can each have their own skin tone, the code points of the emoji with one tone for all of them, with "skintone" where it goes. */
	multi_diversity_base_same?: string;

	/** How Twemoji treats the emoji, such as "diversity" for those with skin tone variants. */
	type?:
		| "diversity"
		| "flag"
		| "keycap"
		| "multi-diversity"
		| "text-default"
		| "variant"
		| "variant,diversity";

	/** The emoji's code points, such as "1f419". */
	unicode: string;
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

/**
 * One emoji as Windows' own emoji panel knows it.
 */
export interface WindowsItem {
	emoji: string;

	/** Terms the panel matches searches against, beyond the name. A handful of emoji, such as ✏️, have none. */
	keywords: string[];

	/** How Windows names the emoji, such as "octopus". */
	name: string;
}

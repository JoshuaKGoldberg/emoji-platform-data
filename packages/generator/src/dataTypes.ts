export type AllEmojipediaData = Record<string, EmojipediaItem>;

export type AllEmojiPlatformData = Record<string, EmojiPlatformData>;

export type AllFluemojiData = Record<string, FluemojiItem>;

export type AllGemojiData = Record<string, GemojiItem>;

export type AllMacOSData = Record<string, MacOSItem>;

export type AllTwemojiData = Record<string, TwemojiItem>;

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
	emoji: string;
	emojipedia?: EmojipediaItem;
	fluemoji?: FluemojiItem;
	gemoji?: GemojiItem;
	macos?: MacOSItem;
	slug: string;
	title: string;
	twemoji?: TwemojiItem;
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

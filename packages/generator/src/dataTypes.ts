// These types describe the JSON data emitted into the data packages.
// They are copied verbatim into each package's index.d.mts, so they must be
// self-contained: no imports from emojipedia, gemoji, or any other package.
// Upstream compatibility is checked where upstream data is assigned to them:
// emojipedia.ts (EmojipediaItem) and gemoji.ts (GemojiItem).

export type AllEmojipediaData = Record<string, EmojipediaItem>;

export type AllEmojiPlatformData = Record<string, EmojiPlatformData>;

export type AllFluemojiData = Record<string, FluemojiItem>;

export type AllGemojiData = Record<string, GemojiItem>;

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
	slug: string;
	title: string;
	twemoji?: TwemojiItem;
}

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

export interface GemojiItem {
	category: string;
	description: string;
	emoji: string;
	names: string[];
	tags: string[];
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

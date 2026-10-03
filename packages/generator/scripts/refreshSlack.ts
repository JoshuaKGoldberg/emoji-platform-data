import * as crypto from "node:crypto";
import * as path from "node:path";

import { compareStrings } from "../src/compareStrings.js";
import { SlackItem } from "../src/dataTypes.js";
import {
	extractJsonBlobs,
	findOnly,
	listScripts,
	searchScripts,
	toJsonEscapes,
} from "./shared/bundles.js";
import { fetchText } from "./shared/fetch.js";
import { readPreviousSnapshot, writeSnapshot } from "./shared/snapshots.js";
import {
	checkCanaryShortcodes,
	checkCounts,
	checkDuplicates,
	countWithKeywords,
	emojiCount,
	emojiWithKeywordsCount,
	throwIfProblems,
} from "./shared/validate.js";

/** One picker category, listing its emoji by shortcode in the order it shows them. */
interface RawCategory {
	emoji_names: string[];
	name: string;
}

interface RawEmoji {
	/** Set only on alternate shortcodes, to the shortcode they stand in for. */
	aliasOf?: string;

	name: string;

	/** Code points in hex, joined by dashes, such as "2764-fe0f". */
	unicode: string;
}

/** The emoji data, keyed by every shortcode Slack accepts, aliases included. */
type RawEmojiData = Record<string, RawEmoji>;

/** Everything the web client's standard emoji module holds. */
interface RawModule {
	categories: RawCategory[];
	emojis: RawEmojiData;

	/** English search terms, keyed by the emoji's shortcode. */
	keywords: Record<string, string[]>;

	/** The English text each emoji name is translated from, keyed by the shortcode. */
	names: Record<string, string>;
}

interface Snapshot {
	chunk: string;
	entries: SlackItem[];
	locales: string[];
	source: string;
}

/** One locale's translations of the client's English strings. */
interface Translations {
	keywords: TranslationTable;
	names: TranslationTable;
}

/**
 * One namespace of a locale's translations, keyed by a prefix of the SHA-1 of
 * the English text. A 0 means the text is the same as the English.
 */
type TranslationTable = Partial<Record<string, 0 | string>>;

/**
 * Emoji that should always come back, with a shortcode and a keyword they
 * should always have.
 */
const canaryTerms = {
	"❤️": { keyword: "love", name: "heart" },
	"🎉": { keyword: "celebrate", name: "tada" },
	"🐙": { keyword: "creature", name: "octopus" },
	"👍": { keyword: "like", name: "thumbsup" },
};

/**
 * Translations that should always come back.
 *
 * These are looked up by hashing the English text, so they catch the hashing
 * going wrong as well as a locale's translations going missing.
 */
const canaryTranslations = {
	"🎉": { keyword: "庆祝", locale: "zh-CN", name: "礼花" },
	"🐙": { keyword: "kreatur", locale: "de-DE", name: "oktopus" },
};

/**
 * The page listing the scripts the web client loads.
 * It's the page a signed-out visitor gets too, so reading it needs no account.
 */
const defaultSource = "https://app.slack.com/client";

/**
 * The categories the picker lists, each with the fewest emoji it should have.
 * Kept as a list rather than read from the data so that one disappearing is
 * caught rather than silently accepted.
 */
const expectedCategories = {
	Activities: 50,
	"Animals & Nature": 50,
	Flags: 50,
	"Food & Drink": 50,
	Objects: 50,
	"Skin Tones": 5,
	"Smileys & People": 50,
	Symbols: 50,
	"Travel & Places": 50,
};

/** The locales Slack translates its emoji into, beyond the English source. */
const expectedLocales = [
	"de-DE",
	"en-GB",
	"es-ES",
	"es-LA",
	"fr-FR",
	"it-IT",
	"ja-JP",
	"ko-KR",
	"pt-BR",
	"zh-CN",
	"zh-TW",
];

/**
 * How many characters of a SHA-1 the client tries, in order, when looking up
 * a translation. Keys are cut to the shortest that's unique in the locale.
 */
const hashLengths = [7, 10, 20, 40];

/** The keyword map lists a stray key or two that aren't emoji, such as "undefined". */
const maximumUnknownKeywordNames = 5;

const minimumEntries = 1800;

/** A few dozen emoji have no keywords, so this is well under the number that do. */
const minimumEntriesWithKeywords = 1700;

/**
 * How much of the English text each locale's translations must have a key
 * for. Every one does as of writing, so a drop means the hashing is off.
 */
const minimumTranslatedShare = 0.95;

/**
 * Sent in place of fetch's own, which Slack answers with an older build of the
 * client for browsers it doesn't support, rather than the one people use.
 */
const userAgent =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const headers = { "User-Agent": userAgent };

/** The chunk holding the standard emoji module, when it still names it that. */
const dataChunkPrefix = "gantry-v2-shared.";

/** The locale the client's source strings, and so the keywords, are written in. */
const sourceLocale = "en-US";

const snapshotPath = path.join(import.meta.dirname, "../slack.json");

const source = process.argv[2] ?? defaultSource;

const previous = await readPreviousSnapshot<Snapshot>(snapshotPath);

const page = await fetchText(source, { headers });

if (page.includes("unsupported_webclient_browser")) {
	throw new Error(
		`${source} answered with its page for unsupported browsers, so the Chrome version in this script's userAgent needs raising.`,
	);
}

const cdn = readCdn(page);

// Lazily loaded chunks are only named in the page, never loaded by it, so
// these are the loader's calls rather than every file name the page mentions.
const scripts = listScripts(
	page,
	/"([\w-]+\.[0-9a-f]{16}\.min\.js)(?:\?[^"]*)?","anonymous"/g,
	source,
);

const { chunk, data: module } = await searchScripts({
	description: "the standard emoji data",
	fetchScript: (script) => fetchText(cdn + script, { headers }),
	prefix: dataChunkPrefix,
	read: readModuleFrom,
	scripts,
	source,
});

const translations = await readTranslations();
const locales = [...translations.keys()];

const entries = toEntries(module, translations);

validate(entries, previous);

const snapshot: Snapshot = { chunk, entries, locales, source };

// Slack redeploys often, and every deploy renames the chunks. Rewriting the
// file for a rename alone would churn it -and open empty refresh pull
// requests- for data that hasn't changed.
await writeSnapshot({
	dataFields: ["entries", "locales"],
	details: `, with keywords for ${countWithKeywords(entries).toString()} of them, in ${(locales.length + 1).toString()} locales`,
	from: chunk,
	previous,
	snapshot,
	snapshotPath,
});

/**
 * Reads a JavaScript string literal's text without evaluating it, by turning
 * the escapes JavaScript has and JSON doesn't into JSON's.
 */
function decodeString(literal: string) {
	return JSON.parse(toJsonEscapes(literal)) as string;
}

function isCategories(value: unknown): value is RawCategory[] {
	return (
		Array.isArray(value) &&
		value.length > 0 &&
		value.every(
			(category: unknown) =>
				typeof category === "object" &&
				category !== null &&
				typeof (category as Record<string, unknown>).name === "string" &&
				Array.isArray((category as Record<string, unknown>).emoji_names),
		)
	);
}

function isEmojiData(value: unknown): value is RawEmojiData {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	const emojis = Object.values(value);

	return (
		emojis.length > 0 &&
		emojis.every(
			(emoji: unknown) =>
				typeof emoji === "object" &&
				emoji !== null &&
				typeof (emoji as Record<string, unknown>).name === "string" &&
				typeof (emoji as Record<string, unknown>).unicode === "string",
		)
	);
}

/**
 * The translation file for each of the page's locales, other than the source.
 */
function listTranslationFiles(page: string) {
	const files = new Map<string, string>();

	for (const [, locale, file] of page.matchAll(
		/"([a-z]{2}-[A-Z]{2})":"(gantry-v2-translations_\1\.[\w.-]+\.json)(?:\?[^"]*)?"/g,
	)) {
		if (locale !== sourceLocale) {
			files.set(locale, file);
		}
	}

	return new Map([...files].sort(([a], [b]) => compareStrings(a, b)));
}

/**
 * Where the page loads its scripts from, which it writes on its root element.
 */
function readCdn(page: string) {
	const cdn = findOnly(page, /\bdata-cdn="(https:\/\/[^"]+\/)"/g)?.[1];

	if (!cdn) {
		throw new Error(`Could not find where ${source} loads its scripts from.`);
	}

	return cdn;
}

/**
 * Reads the pieces of the standard emoji module from one script, if it has all
 * of them. The emoji and their categories are JSON blobs; the English names
 * and keywords are code, calls to the client's translation function.
 */
function readModuleFrom(script: string): RawModule | undefined {
	let categories: RawCategory[] | undefined;
	let emojis: RawEmojiData | undefined;

	for (const blob of extractJsonBlobs(script)) {
		if (isCategories(blob)) {
			categories ??= blob;
		} else if (isEmojiData(blob)) {
			emojis ??= blob;
		}
	}

	if (!categories || !emojis) {
		return undefined;
	}

	const keywords = readTranslatedMap(script, "emoji_keywords");
	const names = readTranslatedMap(script, "emoji_names");

	if (!keywords || !names) {
		return undefined;
	}

	return {
		categories,
		emojis,
		keywords: Object.fromEntries(
			Object.entries(keywords).map(([name, terms]) => [name, [terms].flat()]),
		),
		names: Object.fromEntries(
			Object.entries(names).map(([name, text]) => [name, [text].flat()[0]]),
		),
	};
}

/**
 * Reads an object literal of the client's translatable strings, such as
 * `{octopus:[c.t("animal"),c.t("creature")],…}`, without evaluating it.
 *
 * Each namespace gets its own translator, such as `c=new o.Ay("emoji_keywords")`.
 * The namespace is a string the client has to keep, since it names the strings'
 * translations too, so the map is found through it: the first object literal
 * after the translator is made whose values are calls to it.
 */
function readTranslatedMap(script: string, namespace: string) {
	const declaration = findOnly(
		script,
		RegExp(`([\\w$]+)=new [\\w$.]+\\("${namespace}"\\)`, "g"),
	);

	if (!declaration) {
		return undefined;
	}

	const translator = declaration[1].replaceAll("$", "\\$");
	const string = String.raw`"(?:[^"\\]|\\.)*"`;
	const call = `${translator}\\.t\\((${string})\\)`;

	const opening = RegExp(`\\{(?=(?:${string}|[\\w$]+):\\[?${call})`, "g");
	opening.lastIndex = declaration.index;

	const open = opening.exec(script);

	if (!open) {
		return undefined;
	}

	const keyPattern = RegExp(`(${string}|[\\w$]+):`, "y");
	const callPattern = RegExp(call, "y");
	const map: Record<string, string | string[]> = {};
	let index = open.index + 1;

	const expect = (pattern: RegExp) => {
		pattern.lastIndex = index;
		const match = pattern.exec(script);

		if (!match) {
			throw new Error(
				`Could not read the ${namespace} map at '${script.slice(index, index + 80)}'.`,
			);
		}

		index = pattern.lastIndex;
		return match[1];
	};

	while (script[index] !== "}") {
		const rawKey = expect(keyPattern);
		const key = rawKey.startsWith('"') ? decodeString(rawKey) : rawKey;

		if (script[index] === "[") {
			const terms: string[] = [];
			index += 1;

			while (script[index] !== "]") {
				terms.push(decodeString(expect(callPattern)));

				if (script[index] === ",") {
					index += 1;
				}
			}

			index += 1;
			map[key] = terms;
		} else {
			map[key] = decodeString(expect(callPattern));
		}

		if (script[index] === ",") {
			index += 1;
		}
	}

	return map;
}

/**
 * Reads each locale's translations of the emoji names and keywords.
 * Those are two namespaces among the rest of the client's strings for the
 * locale, which come as one file per locale.
 */
async function readTranslations() {
	const files = listTranslationFiles(page);
	const translations = new Map<string, Translations>();

	for (const [locale, file] of files) {
		const all = JSON.parse(await fetchText(cdn + file, { headers })) as Record<
			string,
			TranslationTable | undefined
		>;
		const keywords = all.emoji_keywords;
		const names = all.emoji_names;

		if (!keywords || !names) {
			throw new Error(`${file} has no emoji translations for ${locale}.`);
		}

		translations.set(locale, { keywords, names });
	}

	return translations;
}

/**
 * Keeps the emoji Slack has a shortcode of their own for, which is every one
 * that isn't an alias of another.
 *
 * That includes 52 the picker doesn't list, which is why their position is
 * optional. They're mostly the gender-neutral forms of older people emoji,
 * such as 👮 `cop`, which the picker shows only as their man and woman variants.
 *
 * Skin tone variants, which route shortcodes like `wave::skin-tone-3`, aren't
 * records of their own: they're nested in their base emoji's record, under
 * `skinVariations`, so this never sees them. Those names are mechanical
 * suffixes on the base emoji's, so there's nothing in them to fold back in.
 */
function toEntries(module: RawModule, translations: Map<string, Translations>) {
	const positions = new Map<string, { category: string; order: number }>();
	let order = 0;

	for (const category of module.categories) {
		for (const name of category.emoji_names) {
			positions.set(name, { category: category.name, order });
			order += 1;
		}
	}

	const aliases = new Map<string, string[]>();

	for (const emoji of Object.values(module.emojis)) {
		if (emoji.aliasOf) {
			aliases.set(emoji.aliasOf, [
				...(aliases.get(emoji.aliasOf) ?? []),
				emoji.name,
			]);
		}
	}

	const entries: SlackItem[] = [];

	for (const emoji of Object.values(module.emojis)) {
		if (emoji.aliasOf) {
			continue;
		}

		const keywords = module.keywords[emoji.name] ?? [];
		const nameText = module.names[emoji.name] as string | undefined;
		const keywordsByLocale: Record<string, string[]> = {};
		const namesByLocale: Record<string, string> = {};

		for (const [locale, translation] of translations) {
			if (keywords.length) {
				keywordsByLocale[locale] = [
					...new Set(
						keywords.map((keyword) => translate(keyword, translation.keywords)),
					),
				];
			}

			if (nameText) {
				namesByLocale[locale] = translate(nameText, translation.names);
			}
		}

		const position = positions.get(emoji.name);

		entries.push({
			aliases: aliases.get(emoji.name) ?? [],
			category: position?.category,
			emoji: String.fromCodePoint(
				...emoji.unicode.split("-").map((hex) => parseInt(hex, 16)),
			),
			keywords,
			keywordsByLocale,
			name: emoji.name,
			namesByLocale,
			order: position?.order,
		});
	}

	return entries.sort(
		(a, b) =>
			(a.order ?? Infinity) - (b.order ?? Infinity) ||
			compareStrings(a.name, b.name),
	);
}

/**
 * Translates English text the way the client does: by looking up a prefix of
 * its SHA-1, trying longer ones until one is there. Like the client, falls
 * back to the English when there's no translation, or when it's marked 0 for
 * being the same.
 */
function translate(text: string, table: TranslationTable) {
	const hash = crypto.createHash("sha1").update(text).digest("hex");

	for (const length of hashLengths) {
		const translation = table[hash.slice(0, length)];

		if (translation !== undefined) {
			return translation === 0 ? text : translation;
		}
	}

	return text;
}

/**
 * The share of English texts a locale's translation table has a key for.
 */
function translatedShare(texts: string[], table: TranslationTable) {
	const found = texts.filter((text) => {
		const hash = crypto.createHash("sha1").update(text).digest("hex");
		return hashLengths.some((length) => hash.slice(0, length) in table);
	});

	return found.length / texts.length;
}

/**
 * Refuses to write data that doesn't look like Slack's emoji list.
 *
 * Nothing here is a supported API: it's a module inside a bundle that Slack
 * rebuilds often, and translations reached by reimplementing how the client
 * looks them up. A refresh that went wrong partway through shouldn't overwrite
 * the snapshot with what it found.
 */
function validate(entries: SlackItem[], previous: Snapshot | undefined) {
	const problems = checkCounts(entries, previous?.entries, [
		{ ...emojiCount, minimum: minimumEntries },
		{ ...emojiWithKeywordsCount, minimum: minimumEntriesWithKeywords },
	]);

	for (const [category, minimum] of Object.entries(expectedCategories)) {
		const count = entries.filter((entry) => entry.category === category).length;

		if (count < minimum) {
			problems.push(
				`Category '${category}' has ${count.toString()} emoji, out of at least ${minimum.toString()} expected.`,
			);
		}
	}

	const names = new Set(entries.map((entry) => entry.name));
	const unknownKeywordNames = Object.keys(module.keywords).filter(
		(name) => !names.has(name),
	);

	if (unknownKeywordNames.length > maximumUnknownKeywordNames) {
		problems.push(
			`${unknownKeywordNames.length.toString()} keyword lists are for shortcodes that aren't emoji, such as '${unknownKeywordNames[0]}'.`,
		);
	} else if (unknownKeywordNames.length) {
		console.warn(
			`Skipping keywords for shortcodes that aren't emoji: ${unknownKeywordNames.join(", ")}.`,
		);
	}

	const unlisted = module.categories
		.flatMap((category) => category.emoji_names)
		.filter((name) => !names.has(name));

	if (unlisted.length) {
		problems.push(
			`${unlisted.length.toString()} emoji the picker lists aren't in the emoji data, such as '${unlisted[0]}'.`,
		);
	}

	for (const locale of expectedLocales) {
		if (!translations.has(locale)) {
			problems.push(`There are no translations for ${locale}.`);
		}
	}

	const keywordTexts = [...new Set(Object.values(module.keywords).flat())];
	const nameTexts = Object.values(module.names);

	for (const [locale, translation] of translations) {
		for (const [kind, texts, table] of [
			["keywords", keywordTexts, translation.keywords],
			["names", nameTexts, translation.names],
		] as const) {
			const share = translatedShare(texts, table);

			if (share < minimumTranslatedShare) {
				problems.push(
					`Only ${(share * 100).toFixed(1)}% of ${kind} could be looked up for ${locale}, out of at least ${(minimumTranslatedShare * 100).toString()}% expected.`,
				);
			}
		}
	}

	checkCanaryShortcodes(problems, entries, canaryTerms);

	for (const [emoji, { keyword, locale, name }] of Object.entries(
		canaryTranslations,
	)) {
		const entry = entries.find((candidate) => candidate.emoji === emoji);

		if (!entry?.keywordsByLocale[locale]?.includes(keyword)) {
			problems.push(
				`${emoji} no longer lists the ${locale} keyword '${keyword}'.`,
			);
		}

		if (entry?.namesByLocale[locale] !== name) {
			problems.push(`${emoji} is no longer named '${name}' in ${locale}.`);
		}
	}

	checkDuplicates(problems, entries);
	throwIfProblems(problems, "for Slack");
}

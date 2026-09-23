/*
 * Dumps the raw emoji metadata macOS's emoji picker uses, as JSON on stdout.
 *
 * macOS keeps its emoji keywords in a search index under CoreEmoji.framework.
 * That index is keyed by an internal document ID rather than by emoji, and
 * nothing on disk maps those IDs back to emoji. EmojiFoundation.framework,
 * which is what the picker itself uses, exposes both halves: each
 * EMFEmojiToken knows its document ID, and EMFInvertedIndex reads the index.
 *
 * Neither framework is public API, so this runs as JavaScript for Automation,
 * whose Objective-C bridge can call them. scripts/refreshMacOS.ts compiles it,
 * runs it under osascript, and reshapes its output into macos.json.
 */

/**
 * The Objective-C bridge JavaScript for Automation puts in scope.
 *
 * These declarations describe only what this script touches. They're a map of
 * the API surface, not a guarantee of it: the bridge resolves every property
 * at runtime, so TypeScript can't know that any of these exist. That's what
 * preflight() is for, and the two lists are meant to be kept in step.
 */
declare const $: ObjCBridge;

declare const ObjC: {
	deepUnwrap: (value: ObjCObject) => unknown;
	import: (framework: string) => void;
};

interface ObjCBridge {
	(text: string): ObjCObject;
	NSClassFromString: (name: string) => ObjCObject;
	NSFileHandle: { fileHandleWithStandardOutput: ObjCObject };
	NSLocale: {
		localeWithLocaleIdentifier: (identifier: ObjCObject) => ObjCObject;
	};
	NSNumber: { numberWithInt: (value: number) => ObjCObject };
	NSProcessInfo: { processInfo: ObjCObject };
	NSSelectorFromString: (name: ObjCObject) => ObjCObject;
	NSUTF8StringEncoding: number;
}

/**
 * One object across the bridge. Every Objective-C class reached here shares
 * this one type, since the bridge itself makes no distinction between them.
 */
interface ObjCObject {
	bundleWithPath: (path: string) => ObjCObject;
	categoryIdentifierList: ObjCObject;
	count: number;
	dataUsingEncoding: (encoding: number) => ObjCObject;
	defaultIndexForBundle: (bundle: ObjCObject) => ObjCObject;
	emojiLocaleDataWithLocaleIdentifier: (identifier: ObjCObject) => ObjCObject;
	emojiTokensForOptionsPresentationStyle: (
		options: number,
		presentationStyle: number,
	) => ObjCObject;
	environment: ObjCObject;
	instancesRespondToSelector: (selector: ObjCObject) => boolean;
	isCommon: boolean;
	isNil: () => boolean;
	/** The bridged value as JavaScript: a string, or a number for numeric types. */
	js: number | string;
	load: boolean;
	nameForType: (type: number) => ObjCObject;
	objectAtIndex: (index: number) => ObjCObject;
	objectForKey: (key: ObjCObject) => ObjCObject;
	respondsToSelector: (selector: ObjCObject) => boolean;
	string: ObjCObject;
	termsForDocument: (documentId: ObjCObject) => ObjCObject;
	valueForKey: (key: ObjCObject) => ObjCObject;
	writeData: (data: ObjCObject) => void;
}

interface Placement {
	category: null | string;
	order: null | number;
}

interface RawEntry {
	appleName: null | string;
	category: null | string;
	emoji: string;
	isCommon: boolean;
	keywordWeights: Record<string, number>;
	order: null | number;
	speechName: null | string;
	unicodeName: null | string;
	voiceOverName: null | string;
}

const emojiFoundationPath =
	"/System/Library/PrivateFrameworks/EmojiFoundation.framework";

/**
 * Every class and selector below is private API, so a macOS update can rename
 * or remove any of them. They're all checked up front, because a bridged
 * property that no longer exists reads back as `undefined` rather than
 * throwing, which would otherwise write a snapshot with data quietly missing.
 */
const required: Record<string, { class: string[]; instance: string[] }> = {
	EMFEmojiCategory: {
		class: [
			"ActivityEmoji",
			"categoryIdentifierList",
			"computeEmojiFlagsSortedByLanguage",
			"FoodAndDrinkEmoji",
			"NatureEmoji",
			"ObjectsEmoji",
			"PeopleEmoji",
			"SymbolsEmoji",
			"TravelAndPlacesEmoji",
		],
		instance: [],
	},
	EMFEmojiLocaleData: {
		class: ["emojiLocaleDataWithLocaleIdentifier:"],
		instance: ["emojiTokensForOptions:presentationStyle:"],
	},
	EMFEmojiToken: {
		class: [],
		instance: ["_emojiIndex", "isCommon", "nameForType:", "string"],
	},
	EMFIndexLoader: { class: ["defaultIndexForBundle:"], instance: [] },
	EMFInvertedIndex: { class: [], instance: ["termsForDocument:"] },
	EMFSearchEngineBundleLoader: {
		class: ["assetBundleForLocale:"],
		instance: [],
	},
};

/** EMFEmojiToken's nameForType: values, as used by the picker and VoiceOver. */
const nameTypes = { apple: 1, speech: 4, unicode: 0, voiceOver: 3 };

ObjC.import("Foundation");

if (!$.NSClassFromString("NSBundle").bundleWithPath(emojiFoundationPath).load) {
	throw new Error(`Could not load ${emojiFoundationPath}.`);
}

preflight();

const localeIdentifier = readEnvironment("EMOJI_PLATFORM_DATA_LOCALE");
const localeData = $.NSClassFromString(
	"EMFEmojiLocaleData",
).emojiLocaleDataWithLocaleIdentifier($(localeIdentifier));
const bundle = callWithObject(
	$.NSClassFromString("EMFSearchEngineBundleLoader"),
	"assetBundleForLocale",
	$.NSLocale.localeWithLocaleIdentifier($(localeIdentifier)),
);

if (bundle.isNil()) {
	throw new Error(`No emoji search index bundle for ${localeIdentifier}.`);
}

const index =
	$.NSClassFromString("EMFIndexLoader").defaultIndexForBundle(bundle);
const placements = readCategoryPlacements();
const tokens = localeData.emojiTokensForOptionsPresentationStyle(0, 0);
const entries: RawEntry[] = [];

for (let i = 0; i < tokens.count; i += 1) {
	const token = tokens.objectAtIndex(i);
	const emoji = String(must(token.string, "EMFEmojiToken string").js);
	const placement: Placement = placements[emoji] ?? {
		category: null,
		order: null,
	};

	entries.push({
		appleName: nameOfType(token, nameTypes.apple),
		category: placement.category,
		emoji,
		isCommon: must(token.isCommon, "EMFEmojiToken isCommon"),
		keywordWeights: readKeywordWeights(index, token),
		order: placement.order,
		speechName: nameOfType(token, nameTypes.speech),
		unicodeName: nameOfType(token, nameTypes.unicode),
		voiceOverName: nameOfType(token, nameTypes.voiceOver),
	});
}

writeStandardOutput(JSON.stringify(entries));
console.log(
	`Extracted ${entries.length.toString()} emoji tokens for ${localeIdentifier}.`,
);

/**
 * Calls a selector the bridge resolves by name, for the few that this script
 * reaches dynamically rather than as a declared property.
 */
function callWithObject(
	target: ObjCObject,
	selector: string,
	argument: ObjCObject,
) {
	const method = (target as unknown as Record<string, unknown>)[selector];

	if (typeof method !== "function") {
		throw new Error(`${selector} is not a method of this object.`);
	}

	return (method as (value: ObjCObject) => ObjCObject).call(target, argument);
}

/**
 * Reads a bridged value that must exist, since a renamed selector reads back
 * as `undefined` instead of throwing.
 */
function must<T>(value: T, label: string) {
	if (value === undefined || value === null) {
		throw new Error(`${label} read back as ${String(value)}.`);
	}

	return value;
}

function nameOfType(token: ObjCObject, type: number) {
	const name = token.nameForType(type);

	return name.isNil() ? null : String(name.js);
}

function preflight() {
	const missing: string[] = [];

	for (const className of Object.keys(required)) {
		const objcClass = $.NSClassFromString(className);

		if (objcClass.isNil()) {
			missing.push(`class ${className}`);
			continue;
		}

		for (const selector of required[className].class) {
			if (!objcClass.respondsToSelector($.NSSelectorFromString($(selector)))) {
				missing.push(`+[${className} ${selector}]`);
			}
		}

		for (const selector of required[className].instance) {
			if (
				!objcClass.instancesRespondToSelector(
					$.NSSelectorFromString($(selector)),
				)
			) {
				missing.push(`-[${className} ${selector}]`);
			}
		}
	}

	if (missing.length) {
		throw new Error(
			[
				"EmojiFoundation is missing symbols this script depends on:",
				...missing.map((symbol) => `  ${symbol}`),
				"This version of macOS likely reorganized it.",
			].join("\n"),
		);
	}
}

/**
 * Maps each emoji to its category and its place in the picker's order.
 *
 * Categories come back in the order the picker shows them, as do the emoji
 * within each. Recents is skipped because it holds whatever this Mac has used.
 *
 * The per-category emoji come from EMFEmojiCategory's class-level sets, such
 * as +[EMFEmojiCategory NatureEmoji], with the country flags coming from
 * +[EMFEmojiCategory computeEmojiFlagsSortedByLanguage]. Its
 * -emojiTokensForLocaleData: would give all of this in one call, but reads
 * back as an empty array outside an app process.
 */
function readCategoryPlacements() {
	const categoryClass = $.NSClassFromString("EMFEmojiCategory");
	const identifiers = must(
		categoryClass.categoryIdentifierList,
		"EMFEmojiCategory categoryIdentifierList",
	);
	const placements: Record<string, Placement> = {};
	let order = 0;

	for (let i = 0; i < identifiers.count; i += 1) {
		const identifier = String(identifiers.objectAtIndex(i).js);

		if (identifier === "EMFEmojiCategoryRecents") {
			continue;
		}

		const name = identifier.replace("EMFEmojiCategory", "");
		const selector =
			name === "Flags" ? "computeEmojiFlagsSortedByLanguage" : `${name}Emoji`;
		const emojis = must(
			readProperty(categoryClass, selector),
			`EMFEmojiCategory ${selector}`,
		);

		for (let j = 0; j < emojis.count; j += 1) {
			const emoji = String(emojis.objectAtIndex(j).js);

			placements[emoji] ??= { category: name, order: order++ };
		}
	}

	return placements;
}

function readEnvironment(name: string) {
	const value = $.NSProcessInfo.processInfo.environment.objectForKey($(name));

	if (value.isNil()) {
		throw new Error(`${name} wasn't set.`);
	}

	return String(value.js);
}

/**
 * Reads one emoji's keywords and their search weights out of the index.
 */
function readKeywordWeights(index: ObjCObject, token: ObjCObject) {
	const documentId = must(
		token.valueForKey($("_emojiIndex")),
		"EMFEmojiToken _emojiIndex",
	).js;
	const terms = index.termsForDocument(
		$.NSNumber.numberWithInt(Number(documentId)),
	);

	if (terms.isNil()) {
		return {};
	}

	const postings = ObjC.deepUnwrap(terms) as Record<string, { w: number }>;
	const weights: Record<string, number> = {};

	for (const term of Object.keys(postings)) {
		weights[term] = postings[term].w;
	}

	return weights;
}

/**
 * Reads a property the bridge resolves by name, for the class-level emoji sets
 * whose names are built from category identifiers.
 */
function readProperty(target: ObjCObject, name: string) {
	return (target as unknown as Record<string, ObjCObject | undefined>)[name];
}

function writeStandardOutput(text: string) {
	$.NSFileHandle.fileHandleWithStandardOutput.writeData(
		$(text).dataUsingEncoding($.NSUTF8StringEncoding),
	);
}

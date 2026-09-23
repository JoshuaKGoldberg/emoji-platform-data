/*
 * Dumps the raw emoji metadata macOS's emoji picker uses, as JSON on stdout.
 *
 * macOS keeps its emoji keywords in a search index under CoreEmoji.framework.
 * That index is keyed by an internal document ID rather than by emoji, and
 * nothing on disk maps those IDs back to emoji. EmojiFoundation.framework,
 * which is what the picker itself uses, exposes both halves: each
 * EMFEmojiToken knows its document ID, and EMFInvertedIndex reads the index.
 *
 * Neither framework is public API, so this runs as JavaScript for Automation
 * (`osascript -l JavaScript`), whose Objective-C bridge can call them. See
 * scripts/refreshMacOS.ts, which runs this and reshapes its output into
 * packages/generator/macos.json.
 */

const emojiFoundationPath =
	"/System/Library/PrivateFrameworks/EmojiFoundation.framework";

/**
 * Every class and selector below is private API, so a macOS update can rename
 * or remove any of them. They're all checked up front, because a bridged
 * property that no longer exists reads back as `undefined` rather than
 * throwing, which would otherwise write a snapshot with data quietly missing.
 */
const required = {
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

function run(argv) {
	ObjC.import("Foundation");

	if (!$.NSBundle.bundleWithPath(emojiFoundationPath).load) {
		throw new Error(`Could not load ${emojiFoundationPath}.`);
	}

	preflight();

	const localeIdentifier = argv[0] || "en_US";
	const localeData = $.NSClassFromString(
		"EMFEmojiLocaleData",
	).emojiLocaleDataWithLocaleIdentifier($(localeIdentifier));
	const bundle = $.NSClassFromString(
		"EMFSearchEngineBundleLoader",
	).assetBundleForLocale(
		$.NSLocale.localeWithLocaleIdentifier($(localeIdentifier)),
	);

	if (bundle.isNil()) {
		throw new Error(
			`No emoji search index bundle for locale ${localeIdentifier}.`,
		);
	}

	const index =
		$.NSClassFromString("EMFIndexLoader").defaultIndexForBundle(bundle);
	const placements = readCategoryPlacements();
	const tokens = localeData.emojiTokensForOptionsPresentationStyle(0, 0);
	const entries = [];

	for (let i = 0; i < tokens.count; i += 1) {
		const token = tokens.objectAtIndex(i);
		const emoji = must(token.string, "EMFEmojiToken string").js;
		const placement = placements[emoji] || { category: null, order: null };

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
		`Extracted ${entries.length} emoji tokens for ${localeIdentifier}.`,
	);
}

/**
 * Reads a bridged value that must exist, since a renamed selector reads back
 * as `undefined` instead of throwing.
 */
function must(value, label) {
	if (value === undefined || value === null) {
		throw new Error(`${label} read back as ${String(value)}.`);
	}

	return value;
}

function nameOfType(token, type) {
	const name = token.nameForType(type);

	return name.isNil() ? null : name.js;
}

function preflight() {
	const missing = [];

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
	const placements = {};
	let order = 0;

	for (let i = 0; i < identifiers.count; i += 1) {
		const identifier = identifiers.objectAtIndex(i).js;

		if (identifier === "EMFEmojiCategoryRecents") {
			continue;
		}

		const name = identifier.replace("EMFEmojiCategory", "");
		const selector =
			name === "Flags" ? "computeEmojiFlagsSortedByLanguage" : `${name}Emoji`;
		const emojis = must(
			categoryClass[selector],
			`EMFEmojiCategory ${selector}`,
		);

		for (let j = 0; j < emojis.count; j += 1) {
			const emoji = emojis.objectAtIndex(j).js;

			if (emoji in placements) {
				continue;
			}

			placements[emoji] = { category: name, order };
			order += 1;
		}
	}

	return placements;
}

/**
 * Reads one emoji's keywords and their search weights out of the index.
 */
function readKeywordWeights(index, token) {
	const documentId = must(
		token.valueForKey($("_emojiIndex")),
		"EMFEmojiToken _emojiIndex",
	).js;
	const terms = index.termsForDocument($.NSNumber.numberWithInt(documentId));

	if (terms.isNil()) {
		return {};
	}

	const postings = ObjC.deepUnwrap(terms);
	const weights = {};

	for (const term of Object.keys(postings)) {
		weights[term] = postings[term].w;
	}

	return weights;
}

function writeStandardOutput(text) {
	$.NSFileHandle.fileHandleWithStandardOutput.writeData(
		$(text).dataUsingEncoding($.NSUTF8StringEncoding),
	);
}

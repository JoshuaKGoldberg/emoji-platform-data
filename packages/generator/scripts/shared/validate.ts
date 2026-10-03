/**
 * One count of what was read, which shouldn't fall below its minimum, nor far
 * below what it was in the previous snapshot.
 */
interface Count<Entry> {
	count: (entries: Entry[]) => number;

	/** What's counted, as it reads in "Only 1400 emoji have keywords". */
	counted: string;

	minimum: number;

	/** The count's name, as it reads in "Emoji with keywords fell from 1500 to 1400". */
	name: string;
}

interface Entry {
	emoji: string;
	keywords: string[];
}

interface ShortcodeEntry extends Entry {
	aliases: string[];
	name: string;
}

export const emojiCount = {
	count: (entries: unknown[]) => entries.length,
	counted: "emoji were read",
	name: "Emoji count",
};

export const emojiWithKeywordsCount = {
	count: countWithKeywords,
	counted: "emoji have keywords",
	name: "Emoji with keywords",
};

/**
 * Checks that each canary emoji is in the entries, then checks the entry
 * against the canary with `check`. Emoji are matched once both are put
 * through `toKey`.
 */
export function checkCanaries<CanaryEntry extends { emoji: string }, Canary>(
	problems: string[],
	entries: CanaryEntry[],
	canaries: Record<string, Canary>,
	check: (entry: CanaryEntry, canary: Canary, emoji: string) => void,
	toKey = (emoji: string) => emoji,
) {
	for (const [emoji, canary] of Object.entries(canaries)) {
		const entry = entries.find(
			(candidate) => toKey(candidate.emoji) === toKey(emoji),
		);

		if (!entry) {
			problems.push(`${emoji} is missing entirely.`);
			continue;
		}

		check(entry, canary, emoji);
	}
}

/**
 * Checks that each canary emoji is in the entries, and lists every keyword it
 * should.
 */
export function checkCanaryKeywords(
	problems: string[],
	entries: Entry[],
	canaries: Record<string, string[]>,
	toKey?: (emoji: string) => string,
) {
	checkCanaries(
		problems,
		entries,
		canaries,
		(entry, keywords, emoji) => {
			for (const keyword of keywords) {
				if (!entry.keywords.includes(keyword)) {
					problems.push(`${emoji} no longer lists the keyword '${keyword}'.`);
				}
			}
		},
		toKey,
	);
}

/**
 * Checks that each canary emoji is in the entries, and lists the shortcode and
 * the keyword it should.
 */
export function checkCanaryShortcodes(
	problems: string[],
	entries: ShortcodeEntry[],
	canaries: Record<string, { keyword: string; name: string }>,
) {
	checkCanaries(
		problems,
		entries,
		canaries,
		(entry, { keyword, name }, emoji) => {
			if (![entry.name, ...entry.aliases].includes(name)) {
				problems.push(`${emoji} no longer lists the shortcode '${name}'.`);
			}

			if (!entry.keywords.includes(keyword)) {
				problems.push(`${emoji} no longer lists the keyword '${keyword}'.`);
			}
		},
	);
}

/**
 * Checks each count against its minimum, then against the previous snapshot's,
 * returning the problems found as the start of the list to report.
 */
export function checkCounts<CountedEntry>(
	entries: CountedEntry[],
	previous: CountedEntry[] | undefined,
	counts: Count<CountedEntry>[],
) {
	const problems: string[] = [];
	const values = counts.map(({ count }) => count(entries));

	for (const [index, { counted, minimum }] of counts.entries()) {
		if (values[index] < minimum) {
			problems.push(
				`Only ${values[index].toString()} ${counted}, out of at least ${minimum.toString()} expected.`,
			);
		}
	}

	if (previous) {
		for (const [index, { count, name }] of counts.entries()) {
			const before = count(previous);

			if (values[index] < before * 0.95) {
				problems.push(
					`${name} fell from ${before.toString()} to ${values[index].toString()}, more than refreshing should change it.`,
				);
			}
		}
	}

	return problems;
}

/**
 * Checks that no emoji is listed twice, once put through `toKey`.
 */
export function checkDuplicates(
	problems: string[],
	entries: { emoji: string }[],
	toKey = (emoji: string) => emoji,
) {
	const seen = new Set<string>();
	const duplicates = entries.filter((entry) => {
		const key = toKey(entry.emoji);
		const isDuplicate = seen.has(key);
		seen.add(key);
		return isDuplicate;
	});

	if (duplicates.length) {
		problems.push(
			`${duplicates.length.toString()} emoji are listed more than once, such as ${duplicates[0].emoji}.`,
		);
	}
}

export function countWithKeywords(entries: { keywords: string[] }[]) {
	return entries.filter((entry) => entry.keywords.length).length;
}

/**
 * Refuses to go on to write the snapshot if any problems were found, naming
 * the data by how it was `read`, such as "for Slack" or "out of macOS".
 */
export function throwIfProblems(problems: string[], read: string) {
	if (problems.length) {
		throw new Error(
			[
				`The data read ${read} doesn't look right, so the snapshot wasn't written:`,
				...problems.map((problem) => `  ${problem}`),
			].join("\n"),
		);
	}
}

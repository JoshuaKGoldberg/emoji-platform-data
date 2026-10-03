interface ScriptSearch<Data> {
	/** What `read` looks for, as it reads in "contained emoji data". */
	description: string;

	fetchScript: (script: string) => Promise<string>;

	/** How the chunk expected to hold what `read` looks for is named. */
	prefix: string;

	read: (script: string) => Data | undefined;

	/** The scripts the page lists, in the order it lists them. */
	scripts: string[];

	/** The page that listed the scripts. */
	source: string;
}

/**
 * Pulls the JSON blobs out of a script.
 *
 * The bundler emits a large JSON module as a string literal it parses at
 * runtime, so these are read as literals rather than by matching the shape of
 * what's inside them. A blob is found by asking what it holds, not by where it
 * sits or what its first key is, since neither is the client's to keep stable.
 */
export function* extractJsonBlobs(script: string) {
	const prefix = "JSON.parse('";

	for (let start = script.indexOf(prefix); start !== -1;) {
		const open = start + prefix.length;
		let end = open;

		while (end < script.length && script[end] !== "'") {
			end += script[end] === "\\" ? 2 : 1;
		}

		const literal = toJsonEscapes(script.slice(open, end));

		try {
			yield JSON.parse(literal) as unknown;
		} catch {
			// A literal that doesn't parse isn't one of the blobs being looked for.
		}

		start = script.indexOf(prefix, end);
	}
}

/**
 * Finds a match in the script, insisting it appears exactly once.
 *
 * These read minified code that nothing promises to keep stable. A pattern that
 * starts matching twice is as much a sign of that code having moved on as one
 * that stops matching, and quietly taking the first of two would be a coin flip.
 */
export function findOnly(script: string, pattern: RegExp) {
	const matches = [...script.matchAll(pattern)];

	return matches.length === 1 ? matches[0] : undefined;
}

/**
 * The scripts a page loads, as `pattern` captures their names, in the order
 * the page lists them.
 */
export function listScripts(page: string, pattern: RegExp, source: string) {
	const scripts = [
		...new Set([...page.matchAll(pattern)].map((match) => match[1])),
	];

	if (!scripts.length) {
		throw new Error(`No scripts were listed by ${source}.`);
	}

	return scripts;
}

/**
 * Reads the scripts a page lists, starting with the ones named as expected,
 * until one holds what `read` looks for.
 *
 * The web clients split what's read here into chunks they name, which is what
 * this looks for first. Those names are theirs to change, so a miss falls back
 * to reading every script, which is slower but doesn't depend on the names.
 */
export async function searchScripts<Data>({
	description,
	fetchScript,
	prefix,
	read,
	scripts,
	source,
}: ScriptSearch<Data>): Promise<{ chunk: string; data: Data }> {
	const named = scripts.filter((script) => script.startsWith(prefix));
	const ordered = [
		...named,
		...scripts.filter((script) => !named.includes(script)),
	];

	for (const chunk of ordered) {
		const data = read(await fetchScript(chunk));

		if (data !== undefined) {
			return { chunk, data };
		}
	}

	throw new Error(
		`None of the ${scripts.length.toString()} scripts listed by ${source} contained ${description}.`,
	);
}

/**
 * Rewrites the escapes JavaScript string literals have that JSON doesn't, such
 * as `\'`, `\x41`, and `\u{1F600}`, into JSON's. Each escape is read whole, so
 * that an escaped backslash followed by "x41" stays an escaped backslash.
 */
export function toJsonEscapes(literal: string) {
	return literal.replaceAll(
		/\\(?:x([0-9a-fA-F]{2})|u\{([0-9a-fA-F]+)\}|[\s\S])/g,
		(escape, hex: string | undefined, codePoint: string | undefined) => {
			if (hex) {
				return `\\u00${hex}`;
			}

			if (codePoint) {
				return JSON.stringify(
					String.fromCodePoint(parseInt(codePoint, 16)),
				).slice(1, -1);
			}

			return escape === "\\'" ? "'" : escape;
		},
	);
}

/**
 * Compares by code unit rather than with localeCompare, so that two different
 * machines, locales, or versions of Node's ICU can't produce two different
 * orderings.
 */
export function compareStrings(a: string, b: string) {
	if (a < b) {
		return -1;
	}

	return a > b ? 1 : 0;
}

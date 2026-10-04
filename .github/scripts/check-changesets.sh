#!/usr/bin/env bash
# Fails unless the changesets that HEAD adds or changes, compared to its first
# parent, name every package whose built output HEAD changes. Both are built,
# so changes that come from dependencies are caught along with code changes.
set -euo pipefail

hash_packages="$(cd "$(dirname "$0")" && pwd)/hash-packages.sh"
base=$(mktemp -d)
results=$(mktemp -d)

git archive HEAD^1 | tar -x -C "$base"
(cd "$base" && pnpm install --frozen-lockfile > /dev/null && pnpm build > /dev/null && "$hash_packages") | sort > "$results/before.txt"

pnpm build > /dev/null
"$hash_packages" | sort > "$results/after.txt"

changed=$(comm -13 "$results/before.txt" "$results/after.txt" | cut -d ' ' -f 1)

named=$(
	git diff --diff-filter=AM --name-only --no-renames HEAD^1 HEAD -- '.changeset/*.md' ':!.changeset/README.md' \
		| while read -r changeset; do
			awk '/^---$/ { fences++; next } fences == 1' "$changeset"
		done \
		| sed -E "s/^[\"']?([^\"':]+)[\"']?[[:space:]]*:.*$/\1/" \
		| sort -u
)

missing=$(comm -23 <(echo "$changed" | sed '/^$/d' | sort -u) <(echo "$named" | sed '/^$/d'))

if [ -n "$missing" ]; then
	echo "These packages' built output changed, but no changeset in this pull request names them:"
	echo "$missing" | sed 's/^/- /'
	echo "Run 'pnpm changeset' to add one that does."
	exit 1
fi

echo "Every package whose built output changed has a changeset."

#!/usr/bin/env bash
# Prints each data package's name with a hash of its built lib/ directory.
set -euo pipefail

for directory in packages/*/; do
	if [ -d "$directory/lib/data" ]; then
		printf '%s %s\n' "$(jq -r .name "$directory/package.json")" "$(find "$directory/lib" -type f -print0 | sort -z | xargs -0 shasum | shasum | cut -d ' ' -f 1)"
	fi
done

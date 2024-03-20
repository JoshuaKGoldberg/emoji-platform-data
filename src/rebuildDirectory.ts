import * as fs from "node:fs/promises";
import * as path from "node:path";

import { generateAll } from "./all.js";
import { formatExportLine } from "./formatExportLine.js";

export interface RebuildSettings {
	directory: string;
}

export async function rebuildDirectory({ directory }: RebuildSettings) {
	await fs.rm(directory, { force: true, recursive: true });
	await fs.mkdir(path.join(directory, "data"), { recursive: true });

	const indexFile = path.join(directory, "index");
	const byTitleFile = path.join(directory, "byTitle");

	await fs.writeFile(
		`${indexFile}.d.mts`,
		[
			`export const byTitle: AllEmojiPlatformData;`,
			"",
			(await fs.readFile("src/types.ts")).toString(),
			"",
		].join("\n"),
	);
	await fs.writeFile(
		`${indexFile}.mjs`,
		`export * as byTitle from "./byTitle.mjs";\n`,
	);

	const byTitle = await generateAll();

	for (const [title, platformData] of Object.entries(byTitle)) {
		// const titleName = title.replaceAll(/\W/g, "");
		const slug = platformData.slug;

		const fileContents = JSON.stringify(
			Object.fromEntries(
				Object.entries(platformData).sort(([a], [b]) => a.localeCompare(b)),
			),
			null,
			4,
		);
		const filePathStart = path.join(directory, "data", slug);
		const exportLine = formatExportLine(
			platformData.emojipedia?.currentCldrName,
			slug,
			title,
		);

		await Promise.all([
			fs.appendFile(`${byTitleFile}.d.mts`, exportLine),
			fs.appendFile(`${byTitleFile}.mjs`, exportLine),
			fs.writeFile(`${filePathStart}.json`, fileContents),
		]);
	}
}

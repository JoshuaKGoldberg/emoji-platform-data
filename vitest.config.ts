import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			include: ["packages/generator/src/**"],
			reporter: ["lcovonly", "text-summary"],
		},
		include: ["test/**/*.test.ts"],
		server: {
			deps: {
				external: [/\/packages\/[^/]+\/lib\//],
			},
		},
	},
});

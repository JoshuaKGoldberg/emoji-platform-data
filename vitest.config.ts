import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		server: {
			deps: {
				external: [/\/packages\/[^/]+\/lib\//],
			},
		},
	},
});

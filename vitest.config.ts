import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		server: {
			deps: {
				// The built packages are imported by Node itself, the way a consumer
				// would import them, rather than through Vite's transforms.
				external: [/\/packages\/[^/]+\/lib\//],
			},
		},
	},
});

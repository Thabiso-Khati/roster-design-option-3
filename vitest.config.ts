import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Run in Node — vault crypto uses WebCrypto (available in Node 19+)
    environment: "node",

    // Inject describe/it/expect/vi globally so tests don't need to import them
    globals: true,

    // Increase timeout for crypto-heavy tests
    testTimeout: 15_000,

    // Only pick up tests in __tests__/ — exclude worktrees, e2e, Storybook
    include:  ["__tests__/**/*.test.ts"],
    exclude:  [".claude/**", "e2e/**", "**/*.stories.*", "stories/**", ".storybook/**"],

    // Collect coverage from lib/ and app/api/
    coverage: {
      provider: "v8",
      include:  ["lib/**/*.ts", "app/api/**/*.ts"],
      exclude:  ["lib/mock/**", "**/*.test.ts", "**/*.spec.ts"],
      // Minimum thresholds — CI fails if coverage drops below these.
      // Raise gradually as test suite grows; never lower without a PR comment.
      thresholds: {
        statements: 20,
        branches:   20,
        functions:  20,
        lines:      20,
      },
    },
  },
  resolve: {
    alias: {
      // Resolve @/ to the project root — mirrors tsconfig paths
      "@": path.resolve(__dirname, "."),
    },
  },
});

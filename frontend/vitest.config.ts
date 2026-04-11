import path from "path";
import { defineConfig } from "vitest/config";

const isSonarCoverageRun = process.env.CI_SONAR === "true";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/test/**",
        "src/routeTree.gen.ts",
        "src/vite-env.d.ts",
        "src/**/*.d.ts",
      ],
      ...(!isSonarCoverageRun && {
        thresholds: {
          statements: 70,
          branches: 60,
          functions: 70,
          lines: 70,
        },
      }),
    },
  },
});

import path from "path";
import { defineConfig } from "vitest/config";

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
      include: [
        "src/auth/permissions.ts",
        "src/hooks/useDebouncedCallback.ts",
        "src/hooks/useDialogFormToggle.ts",
        "src/hooks/useErrorToast.ts",
        "src/hooks/useLanguageUpdater.ts",
        "src/hooks/usePagination.ts",
        "src/public-content/client.ts",
        "src/public-content/hooks.ts",
        "src/public-content/source.ts",
        "src/public-content/useRouteMetadata.ts",
        "src/stores/bookingStore.ts",
        "src/stores/eventStore.ts",
        "src/utilities/colorUtils.ts",
        "src/utilities/dateExtensions.ts",
        "src/utilities/enumUtils.ts",
        "src/utilities/fetchApiExtensions.ts",
        "src/utilities/nullabilityUtils.ts",
      ],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});

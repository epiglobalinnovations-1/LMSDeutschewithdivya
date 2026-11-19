import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    projects: [
      { extends: true, test: { name: "unit", include: ["src/**/*.test.ts"] } },
      { extends: true, test: { name: "db", include: ["tests/db/**/*.test.ts"], fileParallelism: false } },
    ],
  },
});

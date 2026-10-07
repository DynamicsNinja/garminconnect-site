import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // Next's tsconfig uses "jsx": "preserve"; tests import page modules, so compile JSX here.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `import "server-only"` throws outside Next; tests run server code directly.
      "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Raíz del proyecto (equivale a "./" en tsconfig.json paths "@/*": ["./*"]).
const projectRoot = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: [
      // Coherente con tsconfig.json: "@/*" -> "./*" (raíz del proyecto).
      { find: /^@\//, replacement: `${projectRoot}` },
    ],
  },
});

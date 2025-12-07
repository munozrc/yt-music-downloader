import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js, "simple-import-sort": pluginSimpleImportSort },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  tseslint.configs.recommended,
  globalIgnores(["dist/*", "node_modules/*"]),
]);

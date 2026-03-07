import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import pluginImport from "eslint-plugin-import";
import obsidianmd from "eslint-plugin-obsidianmd";
import prettierPlugin from "eslint-plugin-prettier";
import unusedImports from "eslint-plugin-unused-imports";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default defineConfig([
  {
    ignores: [
      "node_modules/**",
      "build/**",
      "dist/**",
      "npm/**",
      "src/typings/**",
      "_site/**",
      "**/*.d.ts",
      "**/*.js",
      "**/*.mjs",
      "package.json",
    ],
  },
  ...obsidianmd.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        project: ["./tsconfig.json"],
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        structuredClone: "readonly",
        getComputedStyle: "readonly",
        createImageBitmap: "readonly",
        HTMLElement: "readonly",
        HTMLDivElement: "readonly",
        Element: "readonly",
        Event: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
      },
    },
    plugins: {
      "unused-imports": unusedImports,
      prettier: prettierPlugin,
      import: pluginImport,
    },
    rules: {
      // TypeScript handles undefined checks — no-undef causes false positives on TS types
      "no-undef": "off",
      "obsidianmd/ui/sentence-case": ["error", { enforceCamelCaseLower: true }],
      "obsidianmd/prefer-file-manager-trash-file": "warn",
      "prettier/prettier": ["off", { endOfLine: "auto" }],
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
]);

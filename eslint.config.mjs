// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import pluginImport from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import obsidianmd from "eslint-plugin-obsidianmd";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // 👇 global ignores, applied before any rules
  {
    ignores: [
      "node_modules/**",
      "build/**",
      "src/typings/**",
      "_site/**",
      "**/*.d.ts",
      "**/*.js",
      "**/*.mjs",
    ],
  },
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      "unused-imports": unusedImports,
      prettier: prettierPlugin,
      import: pluginImport,
      obsidianmd,
    },
    rules: {
      "obsidianmd/ui/sentence-case": ["error", { enforceCamelCaseLower: true }],
      "obsidianmd/no-forbidden-elements": "error",
      "obsidianmd/no-plugin-as-component": "error",
      "obsidianmd/detach-leaves": "error",
      "obsidianmd/hardcoded-config-path": "error",
      "obsidianmd/no-sample-code": "error",
      "obsidianmd/no-tfile-tfolder-cast": "error",
      "obsidianmd/no-view-references-in-plugin": "error",
      "obsidianmd/no-static-styles-assignment": "error",
      "obsidianmd/object-assign": "error",
      "obsidianmd/platform": "error",
      "obsidianmd/prefer-abstract-input-suggest": "error",
      "obsidianmd/prefer-file-manager-trash-file": "warn",
      "obsidianmd/commands/no-command-in-command-id": "error",
      "obsidianmd/commands/no-command-in-command-name": "error",
      "obsidianmd/commands/no-default-hotkeys": "error",
      "obsidianmd/commands/no-plugin-id-in-command-id": "error",
      "obsidianmd/commands/no-plugin-name-in-command-name": "error",
      "obsidianmd/settings-tab/no-manual-html-headings": "error",
      "obsidianmd/settings-tab/no-problematic-settings-headings": "error",
      "obsidianmd/vault/iterate": "error",
      "no-console": ["error", { allow: ["warn", "error", "debug"] }],
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "@typescript-eslint/no-deprecated": "error",
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
    ignores: [
      "npm/**",
      "dist/**",
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        project: ["./tsconfig.json"],
      },
      globals: {
        window: "readonly",
        console: "readonly",
      },
    },
  },
];

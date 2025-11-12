// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import pluginImport from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";

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
    },
    rules: {
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

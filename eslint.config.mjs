// Flat ESLint config for rubric (ESLint 9, Next.js 16 App Router).
//
// Layers, in order:
//   0. globalIgnores      — never lint generated / build / handoff output.
//   1. eslint-config-next — core-web-vitals + typescript (bundles react-hooks v7,
//                           which merges the React Compiler rules — compiler is ON).
//   2. type-aware tiers   — typescript-eslint strict + stylistic, SOURCE TS ONLY,
//                           via parserOptions.projectService (the editor's TS engine).
//   3. import hygiene      — eslint-plugin-import-x (cycles, order, dedupe, type style).
//   4. drizzle             — guard unscoped .delete()/.update() on our `db` instance.
//   5. zod                 — one low-noise best-practice rule (enum over literal union).
//   6. security/no-secrets — defense-in-depth: ReDoS, dynamic child_process/fs, key leaks.
//   7. no-console          — error in product code, off in CLI scripts / seeds.
//   8. per-area overrides  — CLI, seeds, tests, config files relax the noisy rules.
//   9. disableTypeChecked  — turn type-aware OFF for non-source JS/config files.
//
// `next lint` is removed in Next 16 — `npm run lint` runs `eslint` directly.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import { importX } from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import drizzle from "eslint-plugin-drizzle";
import zod from "eslint-plugin-zod";
import noSecrets from "eslint-plugin-no-secrets";
import security from "eslint-plugin-security";

// Source globs that get the full type-aware treatment.
const SOURCE_TS = ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "db/**/*.ts"];
// CLI entrypoints + scripts + seeds log to stdout legitimately and run
// fire-and-forget; they opt out of no-console and a couple of async rules.
const CLI_LIKE = ["bin/**/*.ts", "scripts/**/*.ts", "db/seed*.ts"];

const eslintConfig = defineConfig([
  // 0) Ignore generated / build / handoff output so the TS project service
  //    never type-checks it (avoids "file not in project" noise + slow lint).
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "db/migrations/**", // drizzle-kit generated SQL + meta
    "**/*.gen.ts",
    // Design handoff prototypes — reference spec, not production code.
    "docs/**",
  ]),

  // 1) Next.js base: App Router + Core Web Vitals (errors) + Next's TS recommended.
  //    eslint-config-next@16 ships real flat-config arrays — spread them, no FlatCompat.
  ...nextVitals,
  ...nextTs,

  // 2) Type-aware tiers — SOURCE ONLY. strictTypeChecked is the right tier for a
  //    no-any team: its no-unsafe-* rules are what actually catch `any` leaking in
  //    from JSON.parse / Groq / DB rows at the Zod boundary.
  {
    files: SOURCE_TS,
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        // Modern type-aware linting: spins up TS's project service (same engine
        // as the editor), faster and lower-maintenance than a project glob.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- Hard repo rule: no `any`, ever. ---
      "@typescript-eslint/no-explicit-any": "error",

      // --- Async-heavy bug-catchers (DB + LLM calls everywhere). ---
      // ignoreVoid keeps the `void runLoop(...)` fire-and-forget escape hatch.
      "@typescript-eslint/no-floating-promises": ["error", { ignoreVoid: true }],
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      // Noisy for App Router handlers / Server Actions that are async by contract.
      "@typescript-eslint/require-await": "warn",

      // --- Server-only / bundle hygiene: import type for type-only imports. ---
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // --- Exhaustive switches over Zod discriminated unions / ActionResult. ---
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: true },
      ],

      // --- Null-safety on DB/LLM results: ?? over ||, optional chaining. ---
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // --- Trustworthy now that tsconfig has noUncheckedIndexedAccess on, so
      //     every indexed access is `T | undefined` and these stop false-firing.
      //     Promoted warn -> error after the audit fixed every occurrence. ---
      "@typescript-eslint/no-unnecessary-condition": "error",
      // allowNullish:false keeps null/undefined out of user-facing strings.
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true, allowNullish: false, allowNever: true },
      ],
      // Tuned so it coexists with the no-floating-promises `void` escape hatch
      // instead of the two rules fighting over `void somePromise()`.
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true, ignoreVoidOperator: true },
      ],

      // --- console banned in product code (overridden for CLI below). ---
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // 3) Import hygiene — import-x (Rust resolver, faster than eslint-plugin-import).
  {
    files: ["**/*.{ts,tsx}"],
    extends: [importX.flatConfigs.recommended, importX.flatConfigs.typescript],
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({ alwaysTryTypes: true, project: "./tsconfig.json" }),
      ],
    },
    rules: {
      // Circular imports break tree-shaking + cause undefined-on-init bugs.
      "import-x/no-cycle": ["error", { maxDepth: 4, ignoreExternal: true }],
      // Auto-fixable sorting — warn so it never blocks CI; --fix handles it.
      "import-x/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          pathGroups: [
            { pattern: "server-only", group: "builtin", position: "before" },
            { pattern: "@/**", group: "internal" },
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import-x/no-duplicates": "error",
      "import-x/consistent-type-specifier-style": ["error", "prefer-inline"],
      "import-x/no-useless-path-segments": ["error", { noUselessIndex: true }],
      // server-only / client-only are virtual modules — don't let no-unresolved choke.
      "import-x/no-unresolved": ["error", { ignore: ["^server-only$", "^client-only$"] }],
    },
  },

  // 4) Drizzle — guard unscoped DELETE/UPDATE. Scoped to our single `db` instance
  //    so .delete()/.update() on arrays/Maps/etc. don't false-positive.
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { drizzle },
    rules: {
      "drizzle/enforce-delete-with-where": ["error", { drizzleObjectName: ["db"] }],
      "drizzle/enforce-update-with-where": ["error", { drizzleObjectName: ["db"] }],
    },
  },

  // 5) Zod — one genuinely low-noise win: rewrite literal-union into z.enum.
  //    (require-strict / prefer-strict-object is intentionally OFF — it clashes
  //    with passthrough/.loose() at LLM + external boundaries.)
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { zod },
    rules: {
      "zod/prefer-enum-over-literal-union": "warn",
    },
  },

  // 6) Security plugin (recommended) + secret scanning, then quiet the noise.
  security.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "no-secrets": noSecrets },
    rules: {
      "no-secrets/no-secrets": [
        "error",
        {
          tolerance: 4.2, // default 4 over-fires on hashes / base64 fixtures.
          ignoreContent: ["^[A-Fa-f0-9]{32,}$"], // hex hashes / ids
          additionalRegexes: {
            "Neon URL": "postgres(?:ql)?://[^\\s]*neon\\.tech",
            "Groq Key": "gsk_[A-Za-z0-9]{20,}",
            "HF Token": "hf_[A-Za-z0-9]{20,}",
          },
        },
      ],
      // The #1 noise source — fires on nearly every obj[key]. Off by consensus.
      "security/detect-object-injection": "off",
      // Real DoS vector when regexing over LLM / scraped text — worth error.
      "security/detect-unsafe-regex": "error",
      // Moderate false positives — keep at warn and triage.
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-child-process": "warn",
    },
  },

  // 7) no-console: strict in product code, off where logging is the contract.
  {
    files: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "db/index.ts"],
    rules: { "no-console": ["error", { allow: ["warn", "error"] }] },
  },
  {
    files: CLI_LIKE,
    rules: { "no-console": "off" },
  },

  // 8) CLI entrypoints / scripts / seeds: relax the async rules that fight legit
  //    fire-and-forget + top-level orchestration in tooling.
  {
    files: CLI_LIKE,
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/require-await": "off",
    },
  },

  // 8b) Tests: relax the noisiest type-aware rules (vitest 4). Tests build
  //     regexes from attack fixtures + markers — not a production attack surface.
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-secrets/no-secrets": "off",
      "security/detect-non-literal-regexp": "off",
      "import-x/no-cycle": "off",
    },
  },

  // 9) Non-source JS/config files: turn type-aware linting OFF so the project
  //    service never tries to type-check files outside tsconfig.
  {
    files: ["**/*.{js,mjs,cjs}", "**/*.config.{ts,mts}", "drizzle.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;

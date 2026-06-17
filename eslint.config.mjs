import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
    {
        ignores: ["dist/", "coverage/", "node_modules/", "test/fixtures/"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    // Disable ESLint rules that conflict with Prettier (formatting is Prettier's job).
    prettier,
    {
        languageOptions: {
            globals: {...globals.node},
        },
        rules: {
            // The validation layer is intentionally loosely typed (it passes
            // arbitrary user keys through), so explicit `any` casts are allowed.
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true},
            ],
        },
    },
    {
        // Test files use jest globals.
        files: ["test/**/*.{ts,mjs}"],
        languageOptions: {globals: {...globals.node, ...globals.jest}},
    },
    {
        // The e2e runner transports option functions across processes via eval.
        files: ["test/helpers/runner.mjs"],
        rules: {"no-eval": "off"},
    }
);

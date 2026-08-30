import tsPlugin from "@typescript-eslint/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    {ignores: ["dist/**", "node_modules/**", "tools/**", "*.config.js", "*.config.ts"]},
    ...tsPlugin.configs["flat/recommended"],
    {
        files: ["**/*.{ts,tsx}"],
        plugins: {
            react,
            "react-hooks": reactHooks,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                fetch: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly",
                FormData: "readonly",
                AbortController: "readonly",
                ResizeObserver: "readonly",
                MutationObserver: "readonly",
                PerformanceObserver: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            // ...react.configs.recommended.rules,
            ...react.configs.all.rules,
            ...reactHooks.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "react/destructuring-assignment": "off",
            "react/display-name": "error",
            "react/forbid-component-props": "off",
            "react/hook-use-state": "error",
            "react/jsx-boolean-value": "error",
            "react/jsx-filename-extension": ["error", {extensions: [".tsx", ".jsx"]}],
            "react/jsx-max-depth": "off",
            "react/jsx-max-props-per-line": "off",
            "react/jsx-newline": "off",
            "react/jsx-no-bind": ["error", {ignoreDOMComponents: true}],
            "react/jsx-no-literals": "off",
            "react/jsx-one-expression-per-line": "off",
            "react/jsx-sort-props": "error",
            "react/no-multi-comp": "off",
            "react/prefer-read-only-props": "off",
            "react/prop-types": "off",
            "react/react-in-jsx-scope": "off",
            "react/require-default-props": "off",
        },
    },
    eslintConfigPrettier,
];

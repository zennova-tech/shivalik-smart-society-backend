// eslint.config.cjs — minimal flat config for ESLint v9+
module.exports = [
  {
    // files to lint
    files: ["**/*.js"],

    // ignore these paths (replaces .eslintignore)
    ignores: ["node_modules/**", "logs/**", "dist/**", "src/migrations/**"],

    // language options (use instead of "env")
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        // common Node globals your code may use
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __filename: "readonly",
        __dirname: "readonly",
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },

    // basic rules (keeps it simple)
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off",
    },
  },
];

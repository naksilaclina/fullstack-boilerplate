module.exports = {
    root: true,
    extends: ["eslint:recommended", "plugin:prettier/recommended"],
    env: {
      node: true,
    },
    parserOptions: {
      ecmaVersion: "latest",
    },
    overrides: [
      {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: ["@typescript-eslint"],
        extends: [
          "eslint:recommended",
          "plugin:@typescript-eslint/recommended",
          "plugin:@typescript-eslint/recommended-requiring-type-checking",
          "standard-with-typescript",
          "plugin:prettier/recommended",
        ],
        rules: {
          "@typescript-eslint/explicit-function-return-type": "off",
          "@typescript-eslint/strict-boolean-expressions": [
            "error",
            {
              allowString: true,
              allowNullableString: true,
            },
          ],
        },
        parser: "@typescript-eslint/parser",
        parserOptions: {
          tsconfigRootDir: __dirname,
          project: [
            "./packages/apps/*/tsconfig.json",
            "./packages/modules/*/tsconfig.json",
          ],
        },
      },
    ],
  };
  
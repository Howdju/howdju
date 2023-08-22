module.exports.testFilePattern = "*.{test,testlib}.{js,jsx,ts,tsx}";

// Even though the client-common config extends eslint-config-howdju, for some reason these settings
// aren't picked up. So define them here so that the two configs are in sync.
module.exports.typescriptRules = {
  // This rule has false positives when an exhaustive switch statement's cases all have `return`s.
  // We can instead rely on @typescript-eslint/switch-exhaustiveness-check.
  "no-fallthrough": "off",
  // Rely on @typescript-eslint/no-unused-vars instead
  "no-unused-vars": "off",
  // TODO(254) remove and replace with per-instance overrides
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/ban-ts-comment": [
    "error",
    {
      "ts-ignore": "allow-with-description",
    },
  ],
  // TODO(254): replace these global overrides with specific per instance overrides
  "@typescript-eslint/no-unsafe-argument": "off",
  "@typescript-eslint/no-unsafe-assignment": "off",
  "@typescript-eslint/no-unsafe-return": "off",
  "@typescript-eslint/no-unsafe-member-access": "off",
  "@typescript-eslint/no-unsafe-call": "off",
  "@typescript-eslint/restrict-template-expressions": "off",
  "@typescript-eslint/switch-exhaustiveness-check": "error",
  "@typescript-eslint/no-empty-interface": [
    "error",
    { allowSingleExtends: true },
  ],
  // I don't see any problem with triple-slash references. Also I don't understand how to
  // replace them with imports that only import types.
  "@typescript-eslint/triple-slash-reference": "off",
};

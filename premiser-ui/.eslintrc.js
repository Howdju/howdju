module.exports = {
  extends: [
    "howdju",
    "howdju/react",
    "plugin:jest-dom/recommended",
  ],
  plugins: [
    "react-hooks",
    "jest-dom",
  ],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  }
}

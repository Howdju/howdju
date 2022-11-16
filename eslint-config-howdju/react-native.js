/**
 * ESLint config for React Native
 *
 * Use this instead of
 * [`eslint-config-react-native-community`](https://github.com/facebook/react-native/blob/main/packages/eslint-config-react-native-community/index.js).
 * While that config provides a useful starting point, it extends eslint-plugin-prettier, which is
 * [not recommended](https://prettier.io/docs/en/integrating-with-linters.html#notes). Instead,
 * we can use `prettier --check`.
 */
module.exports = {
  plugins: ["react-native", "@react-native-community"],
  extends: ["eslint-config-howdju/client-common", "prettier"],
};

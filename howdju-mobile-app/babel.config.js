module.exports = {
  presets: [
    "module:metro-react-native-babel-preset",
    "@babel/preset-typescript",
  ],
  env: {
    production: {
      // "get smaller bundle size by excluding modules you don't use"
      // (https://callstack.github.io/react-native-paper/docs/guides/getting-started#installation)
      plugins: ["react-native-paper/babel"],
    },
  },
};

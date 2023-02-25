module.exports = {
  commands: require("@callstack/repack/commands"),
  // Prevent autolinking from copying fonts since we manually configured them
  // (https://github.com/oblador/react-native-vector-icons#ios)
  dependencies: {
    "react-native-vector-icons": {
      platforms: {
        ios: null,
      },
    },
  },
};

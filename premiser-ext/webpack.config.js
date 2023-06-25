const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const project = require("./package.json");

module.exports = (env, argv) => ({
  mode: env.production ? "production" : "development",
  devtool: env.production ? "source-map" : "inline-source-map",
  entry: {
    background: path.join(__dirname, "./src/background"),
    content: path.join(__dirname, "./src/content"),
    "options-ui": path.join(__dirname, "./src/options-ui"),
  },
  output: {
    path: path.join(__dirname, "./dist"),
    filename: "[name].js",
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/manifest.json",
          transform(content) {
            return content
              .toString()
              .replace("$EXTENSION_VERSION", project.version)
              .replace(
                "$EXTENSION_NAME",
                env.production ? "Howdju Extension" : "Howdju Extension (dev)"
              )
              .replace(
                "$BROWSER_ACTION_DEFAULT_TITLE",
                env.production ? "Howdju" : "Howdju (dev)"
              );
          },
        },
        { from: "icons/**/*" },
        // `to: "[name][ext]"` flattens the files
        { from: "src/*.css", to: "[name][ext]" },
        { from: "src/*.html", to: "[name][ext]" },
      ],
    }),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        env.production ? "production" : "development"
      ),
    }),
  ],
  resolve: {
    extensions: [".ts", "..."],
  },
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/,
        resolve: {
          extensions: [".ts", ".tsx", "..."],
        },
        loader: "babel-loader",
        options: {
          cacheDirectory: true,
          rootMode: "upward",
        },
        exclude: /node_modules/,
      },
    ],
  },
});

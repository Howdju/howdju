/// <reference path="../../howdju-common/lib/dom-anchor-text-position.d.ts" />
/// <reference path="../../howdju-common/lib/dom-anchor-text-quote.d.ts" />

import webpack, { WebpackPluginInstance } from "webpack";
import { merge } from "webpack-merge";
import Debug from "debug";
import path from "path";
import { assign } from "lodash";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import { DuplicatesPlugin } from "inspectpack/plugin";
import MomentLocalesPlugin from "moment-locales-webpack-plugin";
import WarningsToErrorsPlugin from "warnings-to-errors-webpack-plugin";
import StatoscopeWebpackPlugin from "@statoscope/webpack-plugin";

import { gitShaShort } from "howdju-ops";
import ProjectRelativeImportResolverPlugin from "../../webpack/ProjectRelativeImportResolverPlugin";

import packageInfo from "../package.json";
import projectConfig from "./project.config";
import { sassLoaderAdditionalData } from "./sass-loader-additional-data";

const debug = Debug("howdju-ui:webpack");

const envWebpackPath = `./webpack.${process.env.NODE_ENV}.config.ts`;
debug(`Loading env webpack from ${envWebpackPath}`);
import {
  envHtmlWebpackPluginConfig,
  envDefinePluginConfig,
  envWebpackConfig,
} from "./webpack.env.config";

const htmlWebpackPluginConfig = merge(
  {
    appMountId: "root",
    environment: process.env.NODE_ENV,
    filename: projectConfig.names.indexHtml,
    hash: false,
    inject: false, // The template injects scripts
    minify: {
      collapseWhitespace: true,
      conservativeCollapse: true,
    },
    mobile: true,
    title: "Howdju",
    template: projectConfig.paths.src(projectConfig.names.indexHtml),
  },
  envHtmlWebpackPluginConfig
);

const definePluginConfig = assign(
  {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    "process.env.SENTRY_ENV": JSON.stringify(process.env.SENTRY_ENV),
    "process.env.PACKAGE_VERSION": JSON.stringify(packageInfo.version),
    "process.env.GIT_COMMIT_HASH_SHORT": JSON.stringify(gitShaShort()),
  },
  envDefinePluginConfig as Record<string, string>
);

const OUTPUT_PUBLIC_PATH = "/";

const plugins: WebpackPluginInstance[] = [
  new HtmlWebpackPlugin(htmlWebpackPluginConfig),
  new webpack.DefinePlugin(definePluginConfig),
  new MiniCssExtractPlugin(),
  new MomentLocalesPlugin({ localesToKeep: ["en"] }),
  new WarningsToErrorsPlugin(),
  new ProjectRelativeImportResolverPlugin({
    projectSources: { "premiser-ui": "src" },
  }),
];

// Adding webpack-bundle-analyzer seems to take over the whole build, only showing
// the analysis. So only add it when requested.
if (process.env.BUNDLE_ANALYZER) {
  plugins.push(new BundleAnalyzerPlugin() as unknown as WebpackPluginInstance);
}
if (process.env.STATOSCOPE) {
  plugins.push(
    new StatoscopeWebpackPlugin({
      saveReportTo: projectConfig.paths.dist("statoscope.html"),
    })
  );
}
// This plugin adds a full-page overlay over the web app that reappears
// on every hot refresh, and so is very annoying. Only enable it on purpose.
if (process.env.CHECK_DUPLICATES) {
  plugins.push(new DuplicatesPlugin({ emitErrors: false }));
}

const baseWebpackConfig = {
  entry: [projectConfig.paths.src("main.tsx")],
  output: {
    filename: projectConfig.names.js,
    path: projectConfig.paths.dist(),
    clean: true,
    publicPath: OUTPUT_PUBLIC_PATH,
  },
  resolve: {
    alias: {
      // Support project-relative imports for non-JS files.
      "@": path.resolve(__dirname, "../src/"),
    },
  },
  module: {
    rules: [
      {
        test: /\.m?(j|t)sx?$/,
        exclude: [/node_modules/],
        resolve: {
          extensions: [".jsx", ".tsx", ".ts", "..."],
        },
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            rootMode: "upward",
          },
        },
      },
      {
        test: /node_modules\/(@grrr\/(cookie-consent|utils)|normalize-url)/,
        resolve: {
          // Allow cookie-consent's modules to import files without their extension
          fullySpecified: false,
          // Support ES module extensions when resolving the file corresponding to an extensionless package
          // because cookie-consent uses .mjs
          extensions: [".mjs", "..."],
        },
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            rootMode: "upward",
          },
        },
      },
      {
        test: /\.(scss|sass|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "resolve-url-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              additionalData: sassLoaderAdditionalData,
            },
          },
        ],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        type: "asset/inline",
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        type: "asset/resource",
      },
      {
        test: /\.md$/,
        use: ["html-loader", "markdown-loader"],
      },
    ],
  },
  plugins,
  // Replace imports from howdju-service-common with a reference to a property howdju-service-common
  // on the global object. This config allows the web app to depend on howdju-service-routes (which
  // depends on howdju-service-common) without importing any of howdju-service-common into the web
  // app.
  //
  // This property will not exist, and so attempts to access it will fail.
  externals: { "howdju-service-common": "global howdju-service-common" },
};

type BaseWebPackConfigOverrides = Partial<typeof baseWebpackConfig>;
export default merge(
  baseWebpackConfig,
  envWebpackConfig as BaseWebPackConfigOverrides
);

import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import type { Response } from "webpack-dev-server";

import {
  getApiRoot,
  devWebServerPort,
  getUiHost,
  doEnableLocalNetworkAccess,
} from "howdju-ops";

export const htmlWebpackPluginConfig = {
  minify: {
    preserveLineBreaks: true,
  },
  // We don't want these active in dev (Google Analytics will HTTP error if we try too use it from localhost)
  // But we might want to use these later in preprod or another env.
  // googleAnalytics: {
  //   trackingId: 'UA-104314283-2',
  // },
  // mixpanel: {
  //   trackingId: 'abd1abe616789b11f1ef46bd254ec937',
  // },
};

const port = devWebServerPort();
const devServerBindHost = doEnableLocalNetworkAccess()
  ? "0.0.0.0"
  : "localhost";
const uiHost = getUiHost();

const apiRoot = process.env.API_ROOT || getApiRoot();
export const definePluginConfig = {
  "process.env.API_ROOT": JSON.stringify(apiRoot),
  "process.env.DO_ASSERT": JSON.stringify(true),
  // Sentry wraps errors so that all exceptions appear to come from it, obscuring the source. So just omit it from dev.
  "process.env.SENTRY_ENABLED": JSON.stringify(false),
};

export const webpackConfig: HtmlWebpackPlugin.Options = {
  mode: "development",
  // For an explanation of possible values, see: https://webpack.js.org/configuration/devtool/#development
  // 'cheap-module-source-map' is recommended for React development.  See: https://reactjs.org/docs/cross-origin-errors.html#source-maps
  devtool: "cheap-module-source-map",
  devServer: {
    bonjour: true,
    compress: true,
    // hot: true,
    // Behave like an SPA, serving index.html for paths that don't match files
    historyApiFallback: true,
    open: {
      target: [`http://${uiHost}:${port}`],
      app: {
        // TODO(423) google-chrome' on Linux, and 'chrome' on Windows.
        name: "Google Chrome",
      },
    },
    port,
    host: devServerBindHost,
    static: [
      {
        directory: "public",
        staticOptions: {
          setHeaders: (res: Response, path: string, _stat: unknown) => {
            console.log(`public path: ${path}`);
            // In development, the static resources should be accessible from localhost, 127.0.0.1, or any other
            // local address.
            res.set("Access-Control-Allow-Origin", "*");
          },
        },
      },
      {
        directory: "dist/bookmarklet",
        staticOptions: {
          setHeaders: (res: Response, path: string, _stat: unknown) => {
            console.log(`bookmarklet path: ${path}`);
            if (path.endsWith(".js")) {
              res.set("Content-Type", "application/javascript");
            }
          },
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "public", to: "" }],
    }),
  ],
};

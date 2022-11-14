import CopyPlugin from "copy-webpack-plugin";
import { hostAddress } from "./util";
import { devApiServerPort } from "howdju-ops";
import HtmlWebpackPlugin from "html-webpack-plugin";

export const htmlWebpackPluginConfig = {
  minify: {
    preserveLineBreaks: true,
  },
  smallChat: true,
  // We don't want these active in dev (Google Analytics will HTTP error if we try too use it from localhost)
  // But we might want to use these later in preprod or another env.
  // googleAnalytics: {
  //   trackingId: 'UA-104314283-2',
  // },
  // mixpanel: {
  //   trackingId: 'abd1abe616789b11f1ef46bd254ec937',
  // },
};

const apiRoot =
  process.env.API_ROOT || `http://${hostAddress()}:${devApiServerPort()}/api/`;
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
    host: hostAddress(),
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "public", to: "" }],
    }),
  ],
};

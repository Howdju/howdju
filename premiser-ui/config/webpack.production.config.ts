import CopyPlugin from 'copy-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import webpack from 'webpack'
// import Visualizer from 'webpack-visualizer-plugin2'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'

import { utcTimestamp } from 'howdju-common'

import { gitSha } from "howdju-ops"
import packageInfo from '../package.json'
import projectConfig from './project.config'
import HtmlWebpackPlugin from 'html-webpack-plugin'

export const htmlWebpackPluginConfig: HtmlWebpackPlugin.Options = {
  smallChat: true,
  googleAnalytics: {
    trackingId: 'UA-104314283-1',
  },
  // mixpanel: {
  //   trackingId: 'cfedfc23579bf718b9e5704f6f6d85bd',
  // },
}

const apiRoot = process.env.API_ROOT || 'https://api.howdju.com/api/'
export const definePluginConfig = {
  'process.env.API_ROOT': JSON.stringify(apiRoot),
  'process.env.DO_ASSERT': JSON.stringify(false),
  'process.env.SENTRY_ENABLED': JSON.stringify(true),
}

/*
Supposed to support more stuff like this:

 hash:[hash]
 chunkhash:[chunkhash]
 name:[name]
 filebase:[filebase]
 query:[query]
 file:[file]

 but didn't work; maybe in a newer version
*/
const banner = `name: ${projectConfig.names.js}
version: ${packageInfo.version}
timstamp: ${utcTimestamp()}
git_commit: ${gitSha()}`

export const webpackConfig = {
  /*
  production values: https://webpack.js.org/configuration/devtool/#production
  - source-map - A full SourceMap is emitted as a separate file. It adds a
    reference comment to the bundle so development tools know where to find it.
  - hidden-source-map - Same as source-map, but doesn't add a reference comment to the bundle.
    Useful if you only want SourceMaps to map error stack traces from error reports, but don't want
    to expose your SourceMap for the browser development tools.
  - nosources-source-map - A SourceMap is created without the sourcesContent in it.
    It can be used to map stack traces on the client without exposing all of the source code.
   */
  devtool: 'source-map',
  plugins: [
    new webpack.BannerPlugin({
      banner: banner,
      entryOnly: true,
      test: /\.js$/,
    }),
    new CopyPlugin({
      patterns: [
        {from: projectConfig.paths.src('error.html')},
        // Copy everything from public directly into dist, except for the fonts, which the client requests from CDN in prod
        {
          from: projectConfig.paths.public(),
          to: projectConfig.paths.dist(),
          filter: (resourcePath) => !resourcePath.match(/.woff2$/),
        },
      ],
    }),
    new MiniCssExtractPlugin(),
    // new Visualizer({
    //   filename: './stats.html'
    // }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
  ],
  optimization: {
    minimize: true,
    moduleIds: 'named',
    minimizer: [
      `...`,
      new CssMinimizerPlugin(),
    ],
    emitOnErrors: true,
  },
}
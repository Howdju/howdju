const CopyPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')
const Visualizer = require('webpack-visualizer-plugin2')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

const {
  utcTimestamp
} = require('howdju-common')

const {
  gitSha,
} = require("howdju-ops")
const packageInfo = require('../package.json')
const projectConfig = require('./project.config')

module.exports.htmlWebpackPluginConfig = {
  smallChat: true,
  googleAnalytics: {
    trackingId: 'UA-104314283-1',
  },
  // mixpanel: {
  //   trackingId: 'cfedfc23579bf718b9e5704f6f6d85bd',
  // },
}

const apiRoot = process.env.API_ROOT || 'https://api.howdju.com/api/'
module.exports.definePluginConfig = {
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

module.exports.webpackConfig = {
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
    new Visualizer({
      filename: './stats.html'
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
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

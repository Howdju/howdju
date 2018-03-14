const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const webpack = require('webpack')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const Visualizer = require('webpack-visualizer-plugin')

const {
  utcTimestamp
} = require('howdju-common')

const {
  gitShortSha,
  nodePackageVersion,
} = require("./util")
const projectConfig = require('./project.config')
const {sassLoaderConfig} = require('./sass-loader-config')


module.exports.htmlWebpackPluginConfig = {
  smallChat: true,
  sentry: true,
  googleAnalytics: {
    trackingId: 'UA-104314283-1',
  },
  // heapAnalytics: {
  //   trackingId: '522456069',
  // },
  // mixpanel: {
  //   trackingId: 'cfedfc23579bf718b9e5704f6f6d85bd',
  // },
}

const apiRoot = process.env.API_ROOT || 'https://api.howdju.com/api/'
module.exports.definePluginConfig = {
  'process.env.API_ROOT': JSON.stringify(apiRoot)
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
version: ${nodePackageVersion()}
timstamp: ${utcTimestamp()}
git_commit: ${gitShortSha()}`

const extractTextPlugin = new ExtractTextPlugin({
  // filename: "[name].[contenthash].css",
  // Although the hash may be good for cache-busting, for now it is creating a lot of files in our S3 bucket
  filename: "[name].css",
})

module.exports.webpackConfig = {
  entry: [projectConfig.paths.src('main.js')],
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
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: extractTextPlugin.extract({
          use: [
            "css-loader?sourceMap",
            "resolve-url-loader",
            sassLoaderConfig
          ],
          // use style-loader in development
          // fallback: "style-loader"
        })
      },
    ]
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: banner,
      entryOnly: true,
      test: /\.js$/,
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compressor: {
        screw_ie8: true,
        warnings: true,
      }
    }),
    new CopyWebpackPlugin([
      { from: projectConfig.paths.src('error.html') },
      // Copy everything from public directly into dist, except for the fonts, which the client requests from CDN in prod
      {
        from: projectConfig.paths.public(),
        to: projectConfig.paths.dist(),
        ignore: '*.woff2',
      },
    ]),
    extractTextPlugin,
    new OptimizeCssAssetsPlugin({
      cssProcessor: require('cssnano'),
      // cssProcessorOptions: { discardComments: {removeAll: true } },
      canPrint: true
    }),
    new Visualizer(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
}
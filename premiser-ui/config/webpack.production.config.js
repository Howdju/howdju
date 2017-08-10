const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const moment = require('moment')
const webpack = require('webpack')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const {
  gitShortSha,
  nodePackageVersion
} = require("./util")

const projectConfig = require('./project.config')


module.exports.htmlWebpackPluginConfig = {
  smallChat: true,
  sentry: true,
  googleAnalytics: {
    trackingId: 'UA-104314283-1',
  },
  mixpanel: {
    trackingId: 'cfedfc23579bf718b9e5704f6f6d85bd',
  },
  heap: {
    trackingId: '522456069',
  },
}

module.exports.definePluginConfig = {
  'process.env.API_ROOT': JSON.stringify('https://ewl0mezq3f.execute-api.us-east-1.amazonaws.com/dev/api/')
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
timstamp: ${moment().format()}
git_commit: ${gitShortSha()}`

const extractTextPlugin = new ExtractTextPlugin({
  filename: "[name].[contenthash].css",
})

module.exports.webpackConfig = {
  entry: [projectConfig.paths.src('main.js')],
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: extractTextPlugin.extract({
          use: [
            "css-loader?sourceMap",
            "resolve-url-loader",
            "sass-loader?sourceMap",
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
        warnings: false,
      }
    }),
    new CopyWebpackPlugin([ { from: projectConfig.paths.src('error.html') }]),
    extractTextPlugin,
    new OptimizeCssAssetsPlugin({
      cssProcessor: require('cssnano'),
      // cssProcessorOptions: { discardComments: {removeAll: true } },
      canPrint: true
    })
  ],
}
const CopyWebpackPlugin = require('copy-webpack-plugin')
// const ExtractTextPlugin = require("extract-text-webpack-plugin")
const moment = require('moment')
const webpack = require('webpack')

const projectConfig = require('./project.config')


module.exports.htmlWebpackPluginConfig = {}

module.exports.definePluginConfig = {
  'process.env.API_ROOT': JSON.stringify('https://ewl0mezq3f.execute-api.us-east-1.amazonaws.com/dev/api/')
}

const commitHash = require('child_process')
    .execSync('git rev-parse --short HEAD')
    .toString();
const banner = `${projectConfig.names.js} ${moment().format()} ${commitHash}`

// const extractTextPlugin = new ExtractTextPlugin({
//   filename: "[name].[contenthash].css",
// })

module.exports.webpackConfig = {
  entry: [projectConfig.paths.src('main.js')],
  devtool: 'cheap-module-source-map',
  // module: {
  //   rules: [{
  //     test: /\.scss$/,
  //     use: extractTextPlugin.extract({
  //       use: [
  //         "css-loader",
  //         "sass-loader"
  //       ],
  //       // use style-loader in development
  //       fallback: "style-loader"
  //     })
  //   }]
  // },
  plugins: [
    new webpack.BannerPlugin({
      banner: banner,
      entryOnly: true,
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compressor: {
        screw_ie8: true,
        warnings: false,
      }
    }),
    new CopyWebpackPlugin([ { from: projectConfig.paths.src('error.html') }]),
    // extractTextPlugin,
  ],
}
const webpack = require('webpack')

const projectConfig = require('./project.config')

module.exports.htmlWebpackPluginConfig = {}

module.exports.definePluginConfig = {
  'process.env.API_ROOT': JSON.stringify('https://ewl0mezq3f.execute-api.us-east-1.amazonaws.com/dev/api/')
}

module.exports.webpackConfig = {
  entry: [projectConfig.paths.src('main.js')],
  devtool: 'cheap-module-source-map',
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compressor: {
        screw_ie8: true,
        warnings: false,
      }
    }),
  ],
}